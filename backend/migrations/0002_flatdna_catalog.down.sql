BEGIN;

DROP TRIGGER IF EXISTS flat_catalog_project_versions_immutable_guard ON flat_catalog_project_versions;
DROP TRIGGER IF EXISTS flat_catalog_snapshots_immutable_guard ON flat_catalog_snapshots;
DROP TRIGGER IF EXISTS flat_source_records_immutable_guard ON flat_source_records;
DROP FUNCTION IF EXISTS flat_prevent_catalog_snapshot_mutation();

DROP TRIGGER IF EXISTS flat_project_reviews_immutable_guard ON flat_project_reviews;
DROP TRIGGER IF EXISTS flat_review_claim_evidence_immutable_guard ON flat_review_claim_evidence;
DROP FUNCTION IF EXISTS flat_prevent_historical_review_mutation();

DROP TRIGGER IF EXISTS flat_catalog_publications_validated_guard ON flat_catalog_publications;
DROP FUNCTION IF EXISTS flat_assert_validated_catalog_publication();

DROP TRIGGER IF EXISTS flat_catalog_project_versions_review_guard ON flat_catalog_project_versions;
DROP FUNCTION IF EXISTS flat_assert_catalog_project_review();

DROP TRIGGER IF EXISTS flat_projects_current_review_guard ON flat_projects;
DROP FUNCTION IF EXISTS flat_assert_current_project_review();
DROP TRIGGER IF EXISTS flat_claim_evidence_review_guard ON flat_claim_evidence;
DROP FUNCTION IF EXISTS flat_revalidate_linked_review_claim();
DROP TRIGGER IF EXISTS flat_review_claim_evidence_insert_guard ON flat_review_claim_evidence;
DROP FUNCTION IF EXISTS flat_guard_review_evidence_link();
DROP FUNCTION IF EXISTS flat_review_has_approved_evidence(uuid, uuid);

ALTER TABLE flat_projects
    DROP CONSTRAINT IF EXISTS flat_projects_unsupported_identity_check,
    DROP CONSTRAINT IF EXISTS flat_projects_partially_resolved_searchable_check,
    DROP CONSTRAINT IF EXISTS flat_projects_unresolved_not_searchable_check,
    DROP CONSTRAINT IF EXISTS flat_projects_catalog_status_check,
    DROP CONSTRAINT IF EXISTS flat_projects_project_status_check,
    DROP CONSTRAINT IF EXISTS flat_projects_identity_status_check,
    DROP CONSTRAINT IF EXISTS flat_projects_review_status_check,
    DROP COLUMN IF EXISTS current_review_id,
    DROP COLUMN IF EXISTS location_only_uncertainty,
    DROP COLUMN IF EXISTS duplicate_suspected,
    DROP COLUMN IF EXISTS promoter_identity_resolved,
    DROP COLUMN IF EXISTS project_identity_resolved,
    DROP COLUMN IF EXISTS unique_registration,
    DROP COLUMN IF EXISTS exclusion_reason,
    DROP COLUMN IF EXISTS catalog_status,
    DROP COLUMN IF EXISTS project_status,
    DROP COLUMN IF EXISTS identity_status,
    DROP COLUMN IF EXISTS review_status;

DROP TABLE IF EXISTS flat_catalog_project_versions;
DROP TABLE IF EXISTS flat_match_assessments;
DROP TABLE IF EXISTS flat_regulatory_warnings;
DROP TABLE IF EXISTS flat_review_claim_evidence;
DROP TABLE IF EXISTS flat_project_reviews;
DROP TABLE IF EXISTS flat_project_registrations;
DROP TABLE IF EXISTS flat_catalog_publications;
DROP TABLE IF EXISTS flat_catalog_snapshots;
DROP TABLE IF EXISTS flat_source_records;
DROP TABLE IF EXISTS flat_ingestion_runs;

COMMIT;
