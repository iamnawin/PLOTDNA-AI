from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from app.services.flatdna.models import (
    ClaimEvidenceRecord,
    DataOrigin,
    DeveloperRecord,
    EvidenceSourceRecord,
    LocationPrecision,
    ProjectRecord,
    RegistryBundle,
    RegistryStatus,
    ReviewStatus,
    SourceClass,
    claim_fingerprint,
)


DEVELOPER_ID = UUID("10000000-0000-4000-8000-000000000001")
PROJECT_ID = UUID("20000000-0000-4000-8000-000000000001")
SOURCE_ID = UUID("30000000-0000-4000-8000-000000000001")
REVIEWED_AT = datetime(2026, 8, 9, tzinfo=timezone.utc)


def make_supported_bundle(*, data_origin: DataOrigin = DataOrigin.CURATED) -> RegistryBundle:
    developer = DeveloperRecord(
        id=DEVELOPER_ID,
        canonical_name="Example Developer",
        normalized_name="example developer",
        registry_status=RegistryStatus.SUPPORTED,
    )
    project = ProjectRecord(
        id=PROJECT_ID,
        developer_id=DEVELOPER_ID,
        canonical_name="Example Heights",
        normalized_name="example heights",
        city_slug="hyderabad",
        locality_slug="kokapet",
        latitude=Decimal("17.400000"),
        longitude=Decimal("78.300000"),
        location_precision=LocationPrecision.PROJECT_CENTROID,
        registry_status=RegistryStatus.SUPPORTED,
    )
    source = EvidenceSourceRecord(
        id=SOURCE_ID,
        source_class=SourceClass.CURATED_REFERENCE,
        data_origin=data_origin,
        publisher="Reviewed public source",
        source_ref="reviewed-public-source-1",
        retrieved_at=REVIEWED_AT,
    )
    values = {
        "identity.canonical_name": "example heights",
        "identity.developer": str(DEVELOPER_ID),
        "identity.locality": "hyderabad/kokapet",
        "identity.coordinates": "17.400000,78.300000",
    }
    developer_claim_id = UUID("40000000-0000-4000-8000-000000000000")
    developer_claim_value = "example developer"
    claims = [
        ClaimEvidenceRecord(
            id=developer_claim_id,
            evidence_source_id=SOURCE_ID,
            developer_id=DEVELOPER_ID,
            claim_key="identity.canonical_name",
            observed_value=developer_claim_value,
            review_status=ReviewStatus.APPROVED,
            reviewed_by="registry-reviewer",
            reviewed_at=REVIEWED_AT,
            fingerprint=claim_fingerprint(
                subject_type="developer",
                subject_id=DEVELOPER_ID,
                claim_key="identity.canonical_name",
                observed_value=developer_claim_value,
                evidence_source_id=SOURCE_ID,
            ),
        )
    ]
    for index, (claim_key, observed_value) in enumerate(values.items(), start=1):
        claim_id = UUID(f"40000000-0000-4000-8000-{index:012d}")
        claims.append(
            ClaimEvidenceRecord(
                id=claim_id,
                evidence_source_id=SOURCE_ID,
                project_id=PROJECT_ID,
                claim_key=claim_key,
                observed_value=observed_value,
                review_status=ReviewStatus.APPROVED,
                reviewed_by="registry-reviewer",
                reviewed_at=REVIEWED_AT,
                fingerprint=claim_fingerprint(
                    subject_type="project",
                    subject_id=PROJECT_ID,
                    claim_key=claim_key,
                    observed_value=observed_value,
                    evidence_source_id=SOURCE_ID,
                ),
            )
        )
    return RegistryBundle(
        developers=[developer],
        projects=[project],
        evidence_sources=[source],
        claim_evidence=claims,
    )
