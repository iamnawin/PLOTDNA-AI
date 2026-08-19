from __future__ import annotations

import hashlib
import json
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from .catalog_models import (
    CatalogLocationPrecision,
    CatalogMetrics,
    CatalogReviewStatus,
    CatalogStatus,
    IdentityStatus,
)
from .catalog_pipeline import CandidateCatalogSnapshot
from .models import RegistryBundle


class ValidationModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ValidationFinding(ValidationModel):
    code: str
    message: str


class ValidationReceipt(ValidationModel):
    passed: bool
    receipt_sha256: str
    findings: tuple[ValidationFinding, ...]


class ObservedMigrationState(ValidationModel):
    project_ids: tuple[UUID, ...]
    registration_project_ids: dict[UUID, UUID]
    evidence_source_ids: tuple[UUID, ...]
    claim_evidence_ids: tuple[UUID, ...]
    developer_project_ids: dict[UUID, UUID]
    customer_identity: dict[UUID, tuple[Any, ...]]
    claim_links: dict[UUID, tuple[Any, ...]]


class MigrationReconciliation(ValidationModel):
    passed: bool
    project_count: int
    findings: tuple[ValidationFinding, ...]


def validate_candidate_snapshot(snapshot: CandidateCatalogSnapshot) -> ValidationReceipt:
    findings: list[ValidationFinding] = []
    registration_ids: set[UUID] = set()
    registration_keys: set[tuple[str, str]] = set()
    for projection in snapshot.projections:
        if projection.registration_id in registration_ids:
            findings.append(
                ValidationFinding(
                    code="registration.duplicate_id",
                    message=f"duplicate registration UUID {projection.registration_id}",
                )
            )
        registration_ids.add(projection.registration_id)
        key = (projection.authority_code, projection.normalized_rera_number)
        if key in registration_keys:
            findings.append(
                ValidationFinding(
                    code="registration.duplicate_key",
                    message=f"duplicate authority registration {key[0]}:{key[1]}",
                )
            )
        registration_keys.add(key)
        if (
            projection.state.catalog_status == CatalogStatus.SEARCHABLE
            and projection.state.location_precision == CatalogLocationPrecision.UNKNOWN
        ):
            findings.append(
                ValidationFinding(
                    code="location.unknown_searchable",
                    message=f"registration {projection.registration_id} has no public location",
                )
            )

    expected_metrics = _calculate_metrics(snapshot)
    if snapshot.metrics != expected_metrics:
        findings.append(
            ValidationFinding(
                code="metrics.mismatch",
                message="snapshot metrics do not reconcile with its projections",
            )
        )

    findings_tuple = tuple(sorted(findings, key=lambda item: (item.code, item.message)))
    canonical = json.dumps(
        snapshot.model_dump(mode="json"),
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return ValidationReceipt(
        passed=not findings_tuple,
        receipt_sha256=hashlib.sha256(canonical).hexdigest(),
        findings=findings_tuple,
    )


def expected_migration_state(bundle: RegistryBundle) -> ObservedMigrationState:
    developer_by_project = {project.id: project.developer_id for project in bundle.projects}
    registrations_by_project: dict[UUID, list[str]] = {}
    for reference in bundle.rera_references:
        registrations_by_project.setdefault(reference.project_id, []).append(
            reference.registration_number
        )
    identity = {
        project.id: (
            project.canonical_name,
            project.developer_id,
            project.city_slug,
            project.locality_slug,
            tuple(sorted(registrations_by_project.get(project.id, []))),
        )
        for project in bundle.projects
    }
    return ObservedMigrationState(
        project_ids=tuple(sorted((project.id for project in bundle.projects), key=str)),
        registration_project_ids={
            reference.id: reference.project_id for reference in bundle.rera_references
        },
        evidence_source_ids=tuple(
            sorted((source.id for source in bundle.evidence_sources), key=str)
        ),
        claim_evidence_ids=tuple(
            sorted((claim.id for claim in bundle.claim_evidence), key=str)
        ),
        developer_project_ids=developer_by_project,
        customer_identity=identity,
        claim_links={
            claim.id: (
                claim.evidence_source_id,
                claim.developer_id,
                claim.developer_alias_id,
                claim.project_id,
                claim.project_alias_id,
                claim.rera_reference_id,
                claim.claim_key,
                claim.observed_value,
                claim.review_status.value,
                claim.reviewed_by,
                claim.reviewed_at.isoformat() if claim.reviewed_at else None,
            )
            for claim in bundle.claim_evidence
        },
    )


def reconcile_registry_migration(
    bundle: RegistryBundle,
    observed: ObservedMigrationState,
) -> MigrationReconciliation:
    expected = expected_migration_state(bundle)
    findings: list[ValidationFinding] = []
    if len(expected.project_ids) != 14:
        findings.append(
            ValidationFinding(
                code="baseline.project_count",
                message=f"expected reviewed baseline has {len(expected.project_ids)} projects, not 14",
            )
        )
    _compare_id_sets("project", expected.project_ids, observed.project_ids, findings)
    _compare_id_sets(
        "evidence",
        expected.evidence_source_ids,
        observed.evidence_source_ids,
        findings,
    )
    _compare_id_sets(
        "claim_evidence",
        expected.claim_evidence_ids,
        observed.claim_evidence_ids,
        findings,
    )
    for claim_id, expected_link in expected.claim_links.items():
        if claim_id in observed.claim_links and observed.claim_links[claim_id] != expected_link:
            findings.append(
                ValidationFinding(
                    code="claim_evidence.link_changed",
                    message=f"claim evidence {claim_id} changed source or subject linkage",
                )
            )

    for registration_id, project_id in expected.registration_project_ids.items():
        actual = observed.registration_project_ids.get(registration_id)
        if actual is None:
            findings.append(
                ValidationFinding(
                    code="registration.missing",
                    message=f"missing registration {registration_id}",
                )
            )
        elif actual != project_id:
            findings.append(
                ValidationFinding(
                    code="registration.reassigned",
                    message=f"registration {registration_id} changed canonical project",
                )
            )
    for registration_id in set(observed.registration_project_ids) - set(
        expected.registration_project_ids
    ):
        findings.append(
            ValidationFinding(
                code="registration.extra",
                message=f"unexpected registration {registration_id}",
            )
        )
    for project_id, developer_id in expected.developer_project_ids.items():
        if observed.developer_project_ids.get(project_id) != developer_id:
            findings.append(
                ValidationFinding(
                    code="developer.relationship_changed",
                    message=f"project {project_id} changed developer relationship",
                )
            )
    for project_id, identity in expected.customer_identity.items():
        if observed.customer_identity.get(project_id) != identity:
            findings.append(
                ValidationFinding(
                    code="customer_identity.changed",
                    message=f"project {project_id} changed customer-visible identity",
                )
            )

    findings_tuple = tuple(sorted(findings, key=lambda item: (item.code, item.message)))
    return MigrationReconciliation(
        passed=not findings_tuple,
        project_count=len(observed.project_ids),
        findings=findings_tuple,
    )


def _calculate_metrics(snapshot: CandidateCatalogSnapshot) -> CatalogMetrics:
    projections = snapshot.projections
    return CatalogMetrics(
        acquired_records=sum(len(item.source_record_ids) for item in projections),
        unique_registrations=len(projections),
        classified_apartments=sum(
            not item.state.duplicate_suspected
            and item.property_type == "RESIDENTIAL_APARTMENT"
            for item in projections
        ),
        in_geography=sum(
            not item.state.duplicate_suspected
            and item.state.exclusion_reason != "OUTSIDE_HYDERABAD_MARKET"
            for item in projections
        ),
        searchable_records=sum(
            item.state.catalog_status == CatalogStatus.SEARCHABLE for item in projections
        ),
        quarantined_records=sum(
            item.state.catalog_status == CatalogStatus.QUARANTINED for item in projections
        ),
        excluded_records=sum(
            item.state.catalog_status == CatalogStatus.HIDDEN for item in projections
        ),
        resolved_identities=sum(
            item.state.identity_status == IdentityStatus.RESOLVED for item in projections
        ),
        partially_resolved_identities=sum(
            item.state.identity_status == IdentityStatus.PARTIALLY_RESOLVED
            for item in projections
        ),
        unresolved_identities=sum(
            item.state.identity_status == IdentityStatus.UNRESOLVED for item in projections
        ),
        reviewed_projects=sum(
            item.state.review_status == CatalogReviewStatus.SUPPORTED for item in projections
        ),
    )


def _compare_id_sets(
    prefix: str,
    expected: tuple[UUID, ...],
    observed: tuple[UUID, ...],
    findings: list[ValidationFinding],
) -> None:
    expected_set = set(expected)
    observed_set = set(observed)
    for missing in sorted(expected_set - observed_set, key=str):
        findings.append(
            ValidationFinding(code=f"{prefix}.missing", message=f"missing {prefix} {missing}")
        )
    for extra in sorted(observed_set - expected_set, key=str):
        findings.append(
            ValidationFinding(code=f"{prefix}.extra", message=f"unexpected {prefix} {extra}")
        )
