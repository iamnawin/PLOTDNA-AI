from __future__ import annotations

from dataclasses import dataclass
from collections import Counter
from urllib.parse import urlparse
from uuid import UUID

from app.services.market_catalog import get_city_area

from .models import (
    DataOrigin,
    RegistryBundle,
    RegistryStatus,
    ReviewStatus,
    SourceClass,
    SourceStatus,
    claim_fingerprint,
    format_coordinate_claim,
    normalize_identity,
    normalize_reference,
)


CORE_PROJECT_CLAIMS = (
    "identity.canonical_name",
    "identity.developer",
    "identity.locality",
    "identity.coordinates",
)
_BANNED_SOURCE_MARKERS = ("tsrera_scraper.py", "data/tsrera_projects.json")
HYDERABAD_LAUNCH_PROJECT_IDS = {
    "Myscape Isle of Sky": UUID("4b2ca36e-b2ad-4f61-8686-fd8e096c731c"),
    "My Home Nishada": UUID("421c032d-37c5-4e88-8c18-3b1185ac825f"),
    "Prestige Beverly Hills": UUID("c75202ca-dc26-46c4-b7d8-b7fca77c9d19"),
    "Rajapushpa Pristinia": UUID("d456e85d-a1fd-418a-9053-29b3dca717a6"),
    "Rajapushpa Provincia": UUID("c3762910-130b-46a1-8835-aabada890854"),
    "EIPL Cornerstone": UUID("4b792811-982f-45a2-8b1c-1008d2b06755"),
    "My Home Tridasa": UUID("97becc5f-d926-411d-bf51-14873cb22c4e"),
    "Aparna Newlands": UUID("8afccfe9-f040-440c-895f-930db6a2e7fd"),
    "Rajapushpa Imperia": UUID("9ffdfa60-3dd5-4f47-9f41-f5f35c8450ad"),
    "Aparna Sarovar Zenith": UUID("caa5580b-97d0-496b-814d-feaedfe88672"),
    "Aparna Sarovar Zicon": UUID("067db042-3467-44c1-b31a-ace541f37f3c"),
    "Aparna Luxor Park": UUID("0103521f-bdf6-459c-afe2-1db7620743eb"),
    "On Cloud 33": UUID("67f11bc5-7719-49b3-b670-c02e3aa6c1ef"),
    "Ramky One Harmony": UUID("5c7fb656-e68f-43ce-a311-856f26b9fe05"),
}
HYDERABAD_LAUNCH_LOCALITY_COUNTS = {
    "financial-district": 1,
    "kokapet": 3,
    "narsingi": 1,
    "puppalaguda": 1,
    "tellapur": 3,
    "nallagandla": 2,
    "kondapur": 1,
    "bachupally": 2,
}
_SOURCE_ORIGINS = {
    SourceClass.OFFICIAL_PROJECT: DataOrigin.REAL,
    SourceClass.OFFICIAL_REGULATOR: DataOrigin.REAL,
    SourceClass.BUILDER_PUBLISHED: DataOrigin.REAL,
    SourceClass.CURATED_REFERENCE: DataOrigin.CURATED,
}


@dataclass(frozen=True)
class ValidationFinding:
    code: str
    message: str
    record_id: UUID | None = None


def validate_registry_bundle(bundle: RegistryBundle) -> list[ValidationFinding]:
    findings: list[ValidationFinding] = []
    developers = _records_by_id(bundle.developers, "developer", findings)
    developer_aliases = _records_by_id(bundle.developer_aliases, "developer alias", findings)
    projects = _records_by_id(bundle.projects, "project", findings)
    project_aliases = _records_by_id(bundle.project_aliases, "project alias", findings)
    rera_references = _records_by_id(bundle.rera_references, "RERA reference", findings)
    sources = _records_by_id(bundle.evidence_sources, "evidence source", findings)
    _records_by_id(bundle.claim_evidence, "claim evidence", findings)

    for developer in bundle.developers:
        if developer.normalized_name != normalize_identity(developer.canonical_name):
            findings.append(_finding("developer.normalized_name", "developer normalized name is stale", developer.id))

    developer_alias_keys: set[tuple[UUID, str]] = set()
    for alias in bundle.developer_aliases:
        if alias.developer_id not in developers:
            findings.append(_finding("developer_alias.developer", "developer alias references an unknown developer", alias.id))
        if alias.normalized_alias != normalize_identity(alias.alias):
            findings.append(_finding("developer_alias.normalized", "developer alias normalization is stale", alias.id))
        key = (alias.developer_id, alias.normalized_alias)
        if key in developer_alias_keys:
            findings.append(_finding("developer_alias.duplicate", "duplicate normalized alias for one developer", alias.id))
        developer_alias_keys.add(key)

    project_alias_keys: set[tuple[UUID, str]] = set()
    for project in bundle.projects:
        if project.developer_id not in developers:
            findings.append(_finding("project.developer", "project references an unknown developer", project.id))
        if project.normalized_name != normalize_identity(project.canonical_name):
            findings.append(_finding("project.normalized_name", "project normalized name is stale", project.id))
        if get_city_area(project.city_slug, project.locality_slug) is None:
            findings.append(_finding("project.locality", "project references an unknown PlotDNA locality", project.id))

    for alias in bundle.project_aliases:
        if alias.project_id not in projects:
            findings.append(_finding("project_alias.project", "project alias references an unknown project", alias.id))
        if alias.normalized_alias != normalize_identity(alias.alias):
            findings.append(_finding("project_alias.normalized", "project alias normalization is stale", alias.id))
        key = (alias.project_id, alias.normalized_alias)
        if key in project_alias_keys:
            findings.append(_finding("project_alias.duplicate", "duplicate normalized alias for one project", alias.id))
        project_alias_keys.add(key)

    rera_keys: set[tuple[str, str]] = set()
    for reference in bundle.rera_references:
        if reference.project_id not in projects:
            findings.append(_finding("rera.project", "RERA reference points to an unknown project", reference.id))
        if reference.authority_code != reference.authority_code.strip().upper():
            findings.append(_finding("rera.authority", "RERA authority code must be uppercase", reference.id))
        if reference.normalized_registration_number != normalize_reference(reference.registration_number):
            findings.append(_finding("rera.normalized", "RERA registration normalization is stale", reference.id))
        key = (reference.authority_code, reference.normalized_registration_number)
        if key in rera_keys:
            findings.append(_finding("rera.duplicate", "duplicate authority and RERA registration number", reference.id))
        rera_keys.add(key)

    for source in bundle.evidence_sources:
        if source.data_origin in {DataOrigin.TEST, DataOrigin.SYNTHETIC}:
            findings.append(_finding("source.unsafe_origin", "TEST and SYNTHETIC evidence cannot enter FlatDNA", source.id))
        source_text = " ".join(filter(None, (source.source_ref, source.url, source.title))).casefold().replace("\\", "/")
        if any(marker in source_text for marker in _BANNED_SOURCE_MARKERS):
            findings.append(_finding("source.synthetic_marker", "synthetic TSRERA source is forbidden", source.id))
        if source.data_origin != _SOURCE_ORIGINS[source.source_class]:
            findings.append(_finding("source.class_origin", "source class and data origin are inconsistent", source.id))

    for claim in bundle.claim_evidence:
        source = sources.get(claim.evidence_source_id)
        if source is None:
            findings.append(_finding("claim.source", "claim references an unknown evidence source", claim.id))
        subject_type, subject_id = claim.subject_values()[0]
        subject_sets = {
            "developer": developers,
            "developer_alias": developer_aliases,
            "project": projects,
            "project_alias": project_aliases,
            "rera_reference": rera_references,
        }
        if subject_id not in subject_sets[subject_type]:
            findings.append(_finding("claim.subject", "claim references an unknown canonical subject", claim.id))
        expected_fingerprint = claim_fingerprint(
            subject_type=subject_type,
            subject_id=subject_id,
            claim_key=claim.claim_key,
            observed_value=claim.observed_value,
            evidence_source_id=claim.evidence_source_id,
        )
        if claim.fingerprint != expected_fingerprint:
            findings.append(_finding("claim.fingerprint", "claim fingerprint does not match its observed value", claim.id))

    approved_claims = _approved_claim_index(bundle, sources)
    for developer in bundle.developers:
        if developer.registry_status != RegistryStatus.SUPPORTED:
            continue
        key = ("developer", developer.id, "identity.canonical_name", developer.normalized_name)
        if key not in approved_claims:
            findings.append(_finding("developer.supported_evidence", "supported developer lacks approved canonical-name evidence", developer.id))
    for project in bundle.projects:
        if project.registry_status != RegistryStatus.SUPPORTED:
            continue
        expected_values = {
            "identity.canonical_name": project.normalized_name,
            "identity.developer": str(project.developer_id),
            "identity.locality": f"{project.city_slug}/{project.locality_slug}",
        }
        if project.latitude is None or project.longitude is None or project.location_precision.value == "UNKNOWN":
            findings.append(_finding("project.supported_coordinates", "supported project requires reviewed coordinates", project.id))
        else:
            expected_values["identity.coordinates"] = format_coordinate_claim(project.latitude, project.longitude)
        for claim_key in CORE_PROJECT_CLAIMS:
            expected_value = expected_values.get(claim_key)
            if expected_value is None or ("project", project.id, claim_key, expected_value) not in approved_claims:
                findings.append(_finding("project.supported_evidence", f"supported project lacks approved {claim_key} evidence", project.id))

        for alias in bundle.project_aliases:
            if alias.project_id == project.id and alias.active:
                key = ("project_alias", alias.id, "identity.alias", alias.normalized_alias)
                if key not in approved_claims:
                    findings.append(_finding("project_alias.evidence", "active alias for a supported project lacks approved evidence", alias.id))

    for alias in bundle.developer_aliases:
        developer = developers.get(alias.developer_id)
        if developer is not None and developer.registry_status == RegistryStatus.SUPPORTED and alias.active:
            key = ("developer_alias", alias.id, "identity.alias", alias.normalized_alias)
            if key not in approved_claims:
                findings.append(_finding("developer_alias.evidence", "active alias for a supported developer lacks approved evidence", alias.id))

    for reference in bundle.rera_references:
        key = ("rera_reference", reference.id, "identity.rera_reference", reference.normalized_registration_number)
        if key not in approved_claims:
            findings.append(_finding("rera.evidence", "RERA reference lacks approved evidence", reference.id))

    return findings


def validate_hyderabad_launch_registry(bundle: RegistryBundle) -> list[ValidationFinding]:
    findings = validate_registry_bundle(bundle)
    if len(bundle.projects) != len(HYDERABAD_LAUNCH_PROJECT_IDS):
        findings.append(_finding("launch.project_count", "Hyderabad launch registry must contain exactly 14 projects", None))

    actual_ids = {project.canonical_name: project.id for project in bundle.projects}
    if actual_ids != HYDERABAD_LAUNCH_PROJECT_IDS:
        findings.append(_finding("launch.project_ids", "Hyderabad launch project roster or stable UUID lock differs", None))

    locality_counts = Counter(project.locality_slug for project in bundle.projects)
    if dict(locality_counts) != HYDERABAD_LAUNCH_LOCALITY_COUNTS:
        findings.append(_finding("launch.locality_distribution", "Hyderabad launch locality distribution differs", None))

    developers = {developer.id: developer for developer in bundle.developers}
    references_by_project = Counter(reference.project_id for reference in bundle.rera_references)
    for project in bundle.projects:
        if project.city_slug != "hyderabad":
            findings.append(_finding("launch.city", "launch projects must use city slug hyderabad", project.id))
        if project.registry_status != RegistryStatus.SUPPORTED:
            findings.append(_finding("launch.status", "launch projects must be SUPPORTED", project.id))
        developer = developers.get(project.developer_id)
        if developer is None or developer.registry_status != RegistryStatus.SUPPORTED:
            findings.append(_finding("launch.developer_status", "launch project developer must be SUPPORTED", project.id))
        if project.location_precision.value not in {"ENTRANCE", "PROJECT_CENTROID"}:
            findings.append(_finding("launch.location_precision", "launch coordinates require entrance or project-centroid precision", project.id))
        if references_by_project[project.id] == 0:
            findings.append(_finding("launch.rera_required", "launch project requires a reviewed RERA reference", project.id))

    for source in bundle.evidence_sources:
        parsed = urlparse(source.url or "")
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            findings.append(_finding("launch.source_url", "launch evidence requires an absolute HTTP(S) source URL", source.id))

    return findings


def _records_by_id(records, label: str, findings: list[ValidationFinding]):
    result = {}
    for record in records:
        if record.id in result:
            findings.append(_finding("id.duplicate", f"duplicate {label} UUID", record.id))
        result[record.id] = record
    return result


def _approved_claim_index(bundle: RegistryBundle, sources: dict[UUID, object]) -> set[tuple[str, UUID, str, str]]:
    approved: set[tuple[str, UUID, str, str]] = set()
    for claim in bundle.claim_evidence:
        source = sources.get(claim.evidence_source_id)
        if (
            source is None
            or claim.review_status != ReviewStatus.APPROVED
            or source.data_origin not in {DataOrigin.REAL, DataOrigin.CURATED}
            or source.source_status != SourceStatus.ACTIVE
        ):
            continue
        subject_type, subject_id = claim.subject_values()[0]
        approved.add((subject_type, subject_id, claim.claim_key, claim.observed_value))
    return approved


def _finding(code: str, message: str, record_id: UUID | None) -> ValidationFinding:
    return ValidationFinding(code=code, message=message, record_id=record_id)
