BEGIN;

DROP TRIGGER flat_supported_project_source_guard ON flat_evidence_sources;
DROP TRIGGER flat_supported_project_claim_guard ON flat_claim_evidence;
DROP TRIGGER flat_supported_project_row_guard ON flat_projects;
DROP FUNCTION flat_revalidate_supported_project();
DROP FUNCTION flat_assert_supported_project_evidence(uuid);

DROP TABLE flat_claim_evidence;
DROP TABLE flat_evidence_sources;
DROP TABLE flat_rera_references;
DROP TABLE flat_project_aliases;
DROP TABLE flat_projects;
DROP TABLE flat_developer_aliases;
DROP TABLE flat_developers;

COMMIT;
