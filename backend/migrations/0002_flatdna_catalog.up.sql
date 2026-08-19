BEGIN;

CREATE TABLE IF NOT EXISTS flat_ingestion_runs (
    id uuid PRIMARY KEY,
    authority_code text NOT NULL,
    acquisition_method text NOT NULL,
    run_status text NOT NULL DEFAULT 'RUNNING',
    source_as_of date,
    importer_version text NOT NULL,
    raw_artifact_ref text,
    content_hash text CHECK (content_hash IS NULL OR content_hash ~ '^[0-9a-f]{64}$'),
    error_summary text,
    diagnostic_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    CONSTRAINT flat_ingestion_runs_authority_check CHECK (btrim(authority_code) <> ''),
    CONSTRAINT flat_ingestion_runs_method_check CHECK (btrim(acquisition_method) <> ''),
    CONSTRAINT flat_ingestion_runs_version_check CHECK (btrim(importer_version) <> ''),
    CONSTRAINT flat_ingestion_runs_status_check CHECK (
        run_status IN ('RUNNING', 'SUCCEEDED', 'FAILED')
    ),
    CONSTRAINT flat_ingestion_runs_completion_check CHECK (
        (run_status = 'RUNNING' AND completed_at IS NULL)
        OR (run_status IN ('SUCCEEDED', 'FAILED') AND completed_at IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS flat_ingestion_runs_status_started_idx
    ON flat_ingestion_runs (run_status, started_at DESC);

CREATE TABLE IF NOT EXISTS flat_source_records (
    id uuid PRIMARY KEY,
    ingestion_run_id uuid NOT NULL REFERENCES flat_ingestion_runs(id) ON DELETE RESTRICT,
    source_identifier text NOT NULL,
    source_registration_number text,
    raw_payload jsonb NOT NULL,
    content_hash text NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
    retrieved_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT flat_source_records_identifier_check CHECK (btrim(source_identifier) <> ''),
    CONSTRAINT flat_source_records_run_hash_key UNIQUE (ingestion_run_id, content_hash)
);

CREATE INDEX IF NOT EXISTS flat_source_records_registration_idx
    ON flat_source_records (source_registration_number);

CREATE TABLE IF NOT EXISTS flat_catalog_snapshots (
    snapshot_id text PRIMARY KEY,
    ingestion_run_id uuid NOT NULL UNIQUE REFERENCES flat_ingestion_runs(id) ON DELETE RESTRICT,
    source_as_of date NOT NULL,
    processing_version text NOT NULL,
    validation_status text NOT NULL DEFAULT 'CANDIDATE',
    validation_receipt_sha256 text,
    metrics jsonb NOT NULL,
    reconciliation_report_ref text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT flat_catalog_snapshots_id_check CHECK (snapshot_id ~ '^[a-z0-9][a-z0-9-]+$'),
    CONSTRAINT flat_catalog_snapshots_version_check CHECK (btrim(processing_version) <> ''),
    CONSTRAINT flat_catalog_snapshots_status_check CHECK (
        validation_status IN ('CANDIDATE', 'VALIDATED', 'REJECTED')
    ),
    CONSTRAINT flat_catalog_snapshots_receipt_check CHECK (
        validation_status <> 'VALIDATED'
        OR (
            validation_receipt_sha256 IS NOT NULL
            AND validation_receipt_sha256 ~ '^[0-9a-f]{64}$'
        )
    )
);

CREATE TABLE IF NOT EXISTS flat_catalog_publications (
    id uuid PRIMARY KEY,
    channel text NOT NULL,
    snapshot_id text NOT NULL REFERENCES flat_catalog_snapshots(snapshot_id) ON DELETE RESTRICT,
    published_at timestamptz NOT NULL DEFAULT now(),
    superseded_at timestamptz,
    published_by text NOT NULL,
    validation_receipt text NOT NULL,
    served_from_last_known_good boolean NOT NULL DEFAULT false,
    rollback_of uuid REFERENCES flat_catalog_publications(id) ON DELETE RESTRICT,
    CONSTRAINT flat_catalog_publications_channel_check CHECK (btrim(channel) <> ''),
    CONSTRAINT flat_catalog_publications_publisher_check CHECK (btrim(published_by) <> ''),
    CONSTRAINT flat_catalog_publications_receipt_check CHECK (
        validation_receipt ~ '^[0-9a-f]{64}$'
    ),
    CONSTRAINT flat_catalog_publications_time_check CHECK (
        superseded_at IS NULL OR superseded_at >= published_at
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS flat_catalog_publications_current_channel_idx
    ON flat_catalog_publications (channel)
    WHERE superseded_at IS NULL;

CREATE INDEX IF NOT EXISTS flat_catalog_publications_snapshot_idx
    ON flat_catalog_publications (snapshot_id, published_at DESC);

CREATE TABLE IF NOT EXISTS flat_project_registrations (
    id uuid PRIMARY KEY,
    canonical_project_id uuid NOT NULL REFERENCES flat_projects(id) ON DELETE RESTRICT,
    authority_code text NOT NULL,
    source_registration_number text NOT NULL,
    normalized_rera_number text NOT NULL,
    registration_name text NOT NULL,
    phase_name text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT flat_project_registrations_authority_check CHECK (btrim(authority_code) <> ''),
    CONSTRAINT flat_project_registrations_source_number_check CHECK (
        btrim(source_registration_number) <> ''
    ),
    CONSTRAINT flat_project_registrations_normalized_number_check CHECK (
        btrim(normalized_rera_number) <> ''
    ),
    CONSTRAINT flat_project_registrations_name_check CHECK (btrim(registration_name) <> ''),
    CONSTRAINT flat_project_registrations_authority_number_key
        UNIQUE (authority_code, normalized_rera_number)
);

CREATE INDEX IF NOT EXISTS flat_project_registrations_project_idx
    ON flat_project_registrations (canonical_project_id);

CREATE TABLE IF NOT EXISTS flat_project_reviews (
    id uuid PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES flat_projects(id) ON DELETE RESTRICT,
    reviewed_by text NOT NULL,
    review_method text NOT NULL,
    reviewed_at timestamptz NOT NULL,
    evidence_as_of date NOT NULL,
    evidence_snapshot_id text REFERENCES flat_catalog_snapshots(snapshot_id) ON DELETE RESTRICT,
    valid_until timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT flat_project_reviews_reviewer_check CHECK (btrim(reviewed_by) <> ''),
    CONSTRAINT flat_project_reviews_method_check CHECK (btrim(review_method) <> ''),
    CONSTRAINT flat_project_reviews_validity_check CHECK (valid_until > reviewed_at),
    CONSTRAINT flat_project_reviews_evidence_date_check CHECK (evidence_as_of <= reviewed_at::date)
);

CREATE INDEX IF NOT EXISTS flat_project_reviews_project_date_idx
    ON flat_project_reviews (project_id, reviewed_at DESC);

CREATE TABLE IF NOT EXISTS flat_review_claim_evidence (
    review_id uuid NOT NULL REFERENCES flat_project_reviews(id) ON DELETE RESTRICT,
    claim_evidence_id uuid NOT NULL REFERENCES flat_claim_evidence(id) ON DELETE RESTRICT,
    linked_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (review_id, claim_evidence_id)
);

CREATE INDEX IF NOT EXISTS flat_review_claim_evidence_claim_idx
    ON flat_review_claim_evidence (claim_evidence_id);

ALTER TABLE flat_projects
    ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'REVIEW_REQUIRED',
    ADD COLUMN IF NOT EXISTS identity_status text NOT NULL DEFAULT 'UNRESOLVED',
    ADD COLUMN IF NOT EXISTS project_status text NOT NULL DEFAULT 'UNKNOWN',
    ADD COLUMN IF NOT EXISTS catalog_status text NOT NULL DEFAULT 'QUARANTINED',
    ADD COLUMN IF NOT EXISTS exclusion_reason text,
    ADD COLUMN IF NOT EXISTS unique_registration boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS project_identity_resolved boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS promoter_identity_resolved boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS duplicate_suspected boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS location_only_uncertainty boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS current_review_id uuid REFERENCES flat_project_reviews(id) ON DELETE RESTRICT;

ALTER TABLE flat_projects
    DROP CONSTRAINT IF EXISTS flat_projects_review_status_check,
    DROP CONSTRAINT IF EXISTS flat_projects_identity_status_check,
    DROP CONSTRAINT IF EXISTS flat_projects_project_status_check,
    DROP CONSTRAINT IF EXISTS flat_projects_catalog_status_check,
    DROP CONSTRAINT IF EXISTS flat_projects_unresolved_not_searchable_check,
    DROP CONSTRAINT IF EXISTS flat_projects_partially_resolved_searchable_check,
    DROP CONSTRAINT IF EXISTS flat_projects_unsupported_identity_check;

ALTER TABLE flat_projects
    ADD CONSTRAINT flat_projects_review_status_check CHECK (
        review_status IN ('REVIEW_REQUIRED', 'SUPPORTED', 'UNSUPPORTED')
    ),
    ADD CONSTRAINT flat_projects_identity_status_check CHECK (
        identity_status IN ('RESOLVED', 'PARTIALLY_RESOLVED', 'UNRESOLVED')
    ),
    ADD CONSTRAINT flat_projects_project_status_check CHECK (
        project_status IN ('ACTIVE', 'COMPLETED', 'WITHDRAWN', 'LAPSED', 'UNKNOWN')
    ),
    ADD CONSTRAINT flat_projects_catalog_status_check CHECK (
        catalog_status IN ('SEARCHABLE', 'QUARANTINED', 'HIDDEN')
    ),
    ADD CONSTRAINT flat_projects_unresolved_not_searchable_check CHECK (
        identity_status <> 'UNRESOLVED' OR catalog_status <> 'SEARCHABLE'
    ),
    ADD CONSTRAINT flat_projects_partially_resolved_searchable_check CHECK (
        identity_status <> 'PARTIALLY_RESOLVED'
        OR catalog_status <> 'SEARCHABLE'
        OR (
            unique_registration
            AND project_identity_resolved
            AND promoter_identity_resolved
            AND NOT duplicate_suspected
            AND location_only_uncertainty
        )
    ),
    ADD CONSTRAINT flat_projects_unsupported_identity_check CHECK (
        review_status <> 'UNSUPPORTED'
        OR (
            identity_status = 'RESOLVED'
            AND exclusion_reason IS NOT NULL
            AND btrim(exclusion_reason) <> ''
        )
    );

UPDATE flat_projects
SET identity_status = 'RESOLVED',
    catalog_status = 'SEARCHABLE',
    review_status = 'REVIEW_REQUIRED',
    unique_registration = true,
    project_identity_resolved = true,
    promoter_identity_resolved = true,
    duplicate_suspected = false,
    location_only_uncertainty = false
WHERE registry_status = 'SUPPORTED';

INSERT INTO flat_project_registrations (
    id,
    canonical_project_id,
    authority_code,
    source_registration_number,
    normalized_rera_number,
    registration_name
)
SELECT rera.id,
       rera.project_id,
       rera.authority_code,
       rera.registration_number,
       rera.normalized_registration_number,
       project.canonical_name
FROM flat_rera_references rera
JOIN flat_projects project ON project.id = rera.project_id
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS flat_regulatory_warnings (
    id uuid PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES flat_projects(id) ON DELETE RESTRICT,
    registration_id uuid REFERENCES flat_project_registrations(id) ON DELETE RESTRICT,
    flag_type text NOT NULL,
    warning_origin text NOT NULL,
    warning_status text NOT NULL DEFAULT 'ACTIVE',
    source_record_id uuid REFERENCES flat_source_records(id) ON DELETE RESTRICT,
    evidence_source_id uuid REFERENCES flat_evidence_sources(id) ON DELETE RESTRICT,
    resolution_source_record_id uuid REFERENCES flat_source_records(id) ON DELETE RESTRICT,
    resolution_evidence_source_id uuid REFERENCES flat_evidence_sources(id) ON DELETE RESTRICT,
    observed_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT flat_regulatory_warnings_flag_check CHECK (
        flag_type IN ('REVOKED', 'DEFAULTER', 'LITIGATION_REPORTED', 'OTHER_WARNING')
    ),
    CONSTRAINT flat_regulatory_warnings_origin_check CHECK (
        warning_origin IN ('TG_RERA', 'FLATDNA_REVIEW', 'THIRD_PARTY')
    ),
    CONSTRAINT flat_regulatory_warnings_status_check CHECK (
        warning_status IN ('ACTIVE', 'RESOLVED')
    ),
    CONSTRAINT flat_regulatory_warnings_source_check CHECK (
        num_nonnulls(source_record_id, evidence_source_id) >= 1
    ),
    -- Resolved warnings require explicit resolution evidence.
    CONSTRAINT flat_regulatory_warnings_resolution_evidence_check CHECK (
        warning_status <> 'RESOLVED'
        OR num_nonnulls(resolution_source_record_id, resolution_evidence_source_id) >= 1
    )
);

CREATE INDEX IF NOT EXISTS flat_regulatory_warnings_project_status_idx
    ON flat_regulatory_warnings (project_id, warning_status);

CREATE TABLE IF NOT EXISTS flat_catalog_warning_versions (
    snapshot_id text NOT NULL REFERENCES flat_catalog_snapshots(snapshot_id) ON DELETE RESTRICT,
    warning_id uuid NOT NULL REFERENCES flat_regulatory_warnings(id) ON DELETE RESTRICT,
    project_id uuid NOT NULL REFERENCES flat_projects(id) ON DELETE RESTRICT,
    registration_id uuid REFERENCES flat_project_registrations(id) ON DELETE RESTRICT,
    flag_type text NOT NULL,
    warning_origin text NOT NULL,
    warning_status text NOT NULL,
    public_origin_label text NOT NULL,
    source_label text NOT NULL,
    source_url text,
    observed_at timestamptz NOT NULL,
    source_as_of date NOT NULL,
    PRIMARY KEY (snapshot_id, warning_id),
    CONSTRAINT flat_catalog_warning_versions_flag_check CHECK (
        flag_type IN ('REVOKED', 'DEFAULTER', 'LITIGATION_REPORTED', 'OTHER_WARNING')
    ),
    CONSTRAINT flat_catalog_warning_versions_origin_check CHECK (
        warning_origin IN ('TG_RERA', 'FLATDNA_REVIEW', 'THIRD_PARTY')
    ),
    CONSTRAINT flat_catalog_warning_versions_status_check CHECK (
        warning_status IN ('ACTIVE', 'RESOLVED')
    ),
    CONSTRAINT flat_catalog_warning_versions_labels_check CHECK (
        btrim(public_origin_label) <> '' AND btrim(source_label) <> ''
    )
);

CREATE TABLE IF NOT EXISTS flat_match_assessments (
    id uuid PRIMARY KEY,
    source_record_id uuid NOT NULL REFERENCES flat_source_records(id) ON DELETE RESTRICT,
    canonical_project_id uuid REFERENCES flat_projects(id) ON DELETE RESTRICT,
    registration_id uuid REFERENCES flat_project_registrations(id) ON DELETE RESTRICT,
    project_name_bps integer NOT NULL,
    duplicate_bps integer NOT NULL,
    promoter_bps integer NOT NULL,
    locality_bps integer NOT NULL,
    coordinate_bps integer NOT NULL,
    methods jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT flat_match_assessments_project_name_check CHECK (project_name_bps BETWEEN 0 AND 10000),
    CONSTRAINT flat_match_assessments_duplicate_check CHECK (duplicate_bps BETWEEN 0 AND 10000),
    CONSTRAINT flat_match_assessments_promoter_check CHECK (promoter_bps BETWEEN 0 AND 10000),
    CONSTRAINT flat_match_assessments_locality_check CHECK (locality_bps BETWEEN 0 AND 10000),
    CONSTRAINT flat_match_assessments_coordinate_check CHECK (coordinate_bps BETWEEN 0 AND 10000),
    CONSTRAINT flat_match_assessments_source_key UNIQUE (source_record_id)
);

CREATE TABLE IF NOT EXISTS flat_catalog_project_versions (
    snapshot_id text NOT NULL REFERENCES flat_catalog_snapshots(snapshot_id) ON DELETE RESTRICT,
    registration_id uuid NOT NULL REFERENCES flat_project_registrations(id) ON DELETE RESTRICT,
    canonical_project_id uuid NOT NULL REFERENCES flat_projects(id) ON DELETE RESTRICT,
    source_record_id uuid NOT NULL REFERENCES flat_source_records(id) ON DELETE RESTRICT,
    canonical_name text NOT NULL,
    developer_name text NOT NULL,
    authority_code text NOT NULL,
    registration_number text NOT NULL,
    city_slug text NOT NULL,
    locality_slug text,
    latitude numeric(10, 7),
    longitude numeric(10, 7),
    location_precision text NOT NULL,
    review_status text NOT NULL,
    identity_status text NOT NULL,
    project_status text NOT NULL,
    catalog_status text NOT NULL,
    exclusion_reason text,
    unique_registration boolean NOT NULL,
    project_identity_resolved boolean NOT NULL,
    promoter_identity_resolved boolean NOT NULL,
    duplicate_suspected boolean NOT NULL,
    location_only_uncertainty boolean NOT NULL,
    current_review_id uuid REFERENCES flat_project_reviews(id) ON DELETE RESTRICT,
    historical_reviewed_at timestamptz,
    historical_review_valid_until timestamptz,
    source_as_of date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (snapshot_id, registration_id),
    CONSTRAINT flat_catalog_project_versions_name_check CHECK (btrim(canonical_name) <> ''),
    CONSTRAINT flat_catalog_project_versions_developer_check CHECK (btrim(developer_name) <> ''),
    CONSTRAINT flat_catalog_project_versions_location_check CHECK (
        location_precision IN ('EXACT_PROJECT', 'APPROXIMATE_PROJECT', 'LOCALITY', 'UNKNOWN')
    ),
    CONSTRAINT flat_catalog_project_versions_review_check CHECK (
        review_status IN ('REVIEW_REQUIRED', 'SUPPORTED', 'UNSUPPORTED')
    ),
    CONSTRAINT flat_catalog_project_versions_identity_check CHECK (
        identity_status IN ('RESOLVED', 'PARTIALLY_RESOLVED', 'UNRESOLVED')
    ),
    CONSTRAINT flat_catalog_project_versions_project_status_check CHECK (
        project_status IN ('ACTIVE', 'COMPLETED', 'WITHDRAWN', 'LAPSED', 'UNKNOWN')
    ),
    CONSTRAINT flat_catalog_project_versions_catalog_status_check CHECK (
        catalog_status IN ('SEARCHABLE', 'QUARANTINED', 'HIDDEN')
    ),
    CONSTRAINT flat_catalog_project_versions_unresolved_check CHECK (
        identity_status <> 'UNRESOLVED' OR catalog_status <> 'SEARCHABLE'
    ),
    CONSTRAINT flat_catalog_project_versions_partially_resolved_searchable_check CHECK (
        identity_status <> 'PARTIALLY_RESOLVED'
        OR catalog_status <> 'SEARCHABLE'
        OR (
            unique_registration
            AND project_identity_resolved
            AND promoter_identity_resolved
            AND NOT duplicate_suspected
            AND location_only_uncertainty
        )
    ),
    CONSTRAINT flat_catalog_project_versions_supported_review_check CHECK (
        review_status <> 'SUPPORTED' OR current_review_id IS NOT NULL
    ),
    CONSTRAINT flat_catalog_project_versions_unsupported_reason_check CHECK (
        review_status <> 'UNSUPPORTED'
        OR (
            identity_status = 'RESOLVED'
            AND exclusion_reason IS NOT NULL
            AND btrim(exclusion_reason) <> ''
        )
    ),
    CONSTRAINT flat_catalog_project_versions_coordinate_pair_check CHECK (
        (latitude IS NULL) = (longitude IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS flat_catalog_project_versions_search_idx
    ON flat_catalog_project_versions (snapshot_id, catalog_status, canonical_name);

CREATE OR REPLACE FUNCTION flat_review_has_approved_evidence(
    target_review_id uuid,
    target_project_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM flat_review_claim_evidence link
        JOIN flat_claim_evidence claim ON claim.id = link.claim_evidence_id
        JOIN flat_projects project ON project.id = target_project_id
        WHERE link.review_id = target_review_id
          AND claim.review_status = 'APPROVED'
          AND (
              claim.project_id = target_project_id
              OR claim.project_alias_id IN (
                  SELECT alias.id FROM flat_project_aliases alias
                  WHERE alias.project_id = target_project_id
              )
              OR claim.rera_reference_id IN (
                  SELECT rera.id FROM flat_rera_references rera
                  WHERE rera.project_id = target_project_id
              )
              OR claim.developer_id = project.developer_id
              OR claim.developer_alias_id IN (
                  SELECT alias.id FROM flat_developer_aliases alias
                  WHERE alias.developer_id = project.developer_id
              )
          )
    );
$$;

CREATE OR REPLACE FUNCTION flat_guard_review_evidence_link()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM flat_projects project
        WHERE project.current_review_id = NEW.review_id
          AND project.review_status = 'SUPPORTED'
    ) OR EXISTS (
        SELECT 1 FROM flat_catalog_project_versions version
        WHERE version.current_review_id = NEW.review_id
          AND version.review_status = 'SUPPORTED'
    ) THEN
        RAISE EXCEPTION 'active FlatDNA review evidence set is immutable';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS flat_review_claim_evidence_insert_guard ON flat_review_claim_evidence;

CREATE TRIGGER flat_review_claim_evidence_insert_guard
BEFORE INSERT ON flat_review_claim_evidence
FOR EACH ROW EXECUTE FUNCTION flat_guard_review_evidence_link();

CREATE OR REPLACE FUNCTION flat_revalidate_linked_review_claim()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    target_claim_id uuid;
    linked_review record;
BEGIN
    target_claim_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;
    FOR linked_review IN
        SELECT review.id AS review_id, review.project_id
        FROM flat_review_claim_evidence link
        JOIN flat_project_reviews review ON review.id = link.review_id
        WHERE link.claim_evidence_id = target_claim_id
    LOOP
        IF NOT flat_review_has_approved_evidence(
            linked_review.review_id,
            linked_review.project_id
        ) AND (
            EXISTS (
                SELECT 1 FROM flat_projects project
                WHERE project.current_review_id = linked_review.review_id
                  AND project.review_status = 'SUPPORTED'
            )
            OR EXISTS (
                SELECT 1 FROM flat_catalog_project_versions version
                WHERE version.current_review_id = linked_review.review_id
                  AND version.review_status = 'SUPPORTED'
            )
        ) THEN
            RAISE EXCEPTION 'active FlatDNA review lost approved evidence';
        END IF;
    END LOOP;
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS flat_claim_evidence_review_guard ON flat_claim_evidence;

CREATE CONSTRAINT TRIGGER flat_claim_evidence_review_guard
AFTER UPDATE OR DELETE ON flat_claim_evidence
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION flat_revalidate_linked_review_claim();

CREATE OR REPLACE FUNCTION flat_assert_current_project_review()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    review_row flat_project_reviews%ROWTYPE;
BEGIN
    IF NEW.review_status <> 'SUPPORTED' THEN
        RETURN NEW;
    END IF;
    IF NEW.current_review_id IS NULL THEN
        RAISE EXCEPTION 'SUPPORTED FlatDNA project % requires current review', NEW.id;
    END IF;
    SELECT * INTO review_row
    FROM flat_project_reviews
    WHERE id = NEW.current_review_id;
    IF NOT FOUND
       OR review_row.project_id <> NEW.id
       OR review_row.valid_until <= now()
       OR NOT flat_review_has_approved_evidence(review_row.id, NEW.id) THEN
        RAISE EXCEPTION 'SUPPORTED FlatDNA project % has invalid current review', NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS flat_projects_current_review_guard ON flat_projects;

CREATE CONSTRAINT TRIGGER flat_projects_current_review_guard
AFTER INSERT OR UPDATE OF review_status, current_review_id ON flat_projects
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION flat_assert_current_project_review();

CREATE OR REPLACE FUNCTION flat_assert_catalog_project_review()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    review_row flat_project_reviews%ROWTYPE;
BEGIN
    IF NEW.review_status <> 'SUPPORTED' THEN
        RETURN NEW;
    END IF;
    SELECT * INTO review_row
    FROM flat_project_reviews
    WHERE id = NEW.current_review_id;
    IF NOT FOUND
       OR review_row.project_id <> NEW.canonical_project_id
       OR review_row.valid_until <= now()
       OR NOT flat_review_has_approved_evidence(review_row.id, NEW.canonical_project_id) THEN
        RAISE EXCEPTION 'SUPPORTED catalog row has invalid current review';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS flat_catalog_project_versions_review_guard ON flat_catalog_project_versions;

CREATE CONSTRAINT TRIGGER flat_catalog_project_versions_review_guard
AFTER INSERT OR UPDATE OF review_status, current_review_id ON flat_catalog_project_versions
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION flat_assert_catalog_project_review();

CREATE OR REPLACE FUNCTION flat_assert_validated_catalog_publication()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    snapshot_status text;
BEGIN
    SELECT validation_status INTO snapshot_status
    FROM flat_catalog_snapshots
    WHERE snapshot_id = NEW.snapshot_id;
    IF snapshot_status IS DISTINCT FROM 'VALIDATED' THEN
        RAISE EXCEPTION 'catalog publication requires VALIDATED snapshot';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM flat_catalog_project_versions version
        LEFT JOIN flat_project_reviews review ON review.id = version.current_review_id
        WHERE version.snapshot_id = NEW.snapshot_id
          AND version.review_status = 'SUPPORTED'
          AND (
              review.id IS NULL
              OR review.project_id <> version.canonical_project_id
              OR review.valid_until <= now()
              OR NOT flat_review_has_approved_evidence(
                  review.id,
                  version.canonical_project_id
              )
          )
    ) THEN
        RAISE EXCEPTION 'supported review expired before publication';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS flat_catalog_publications_validated_guard ON flat_catalog_publications;

CREATE CONSTRAINT TRIGGER flat_catalog_publications_validated_guard
AFTER INSERT OR UPDATE OF snapshot_id ON flat_catalog_publications
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION flat_assert_validated_catalog_publication();

CREATE OR REPLACE FUNCTION flat_prevent_historical_review_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'FlatDNA review history is immutable';
END;
$$;

DROP TRIGGER IF EXISTS flat_project_reviews_immutable_guard ON flat_project_reviews;
DROP TRIGGER IF EXISTS flat_review_claim_evidence_immutable_guard ON flat_review_claim_evidence;

CREATE TRIGGER flat_project_reviews_immutable_guard
BEFORE UPDATE OR DELETE ON flat_project_reviews
FOR EACH ROW EXECUTE FUNCTION flat_prevent_historical_review_mutation();

CREATE TRIGGER flat_review_claim_evidence_immutable_guard
BEFORE UPDATE OR DELETE ON flat_review_claim_evidence
FOR EACH ROW EXECUTE FUNCTION flat_prevent_historical_review_mutation();

CREATE OR REPLACE FUNCTION flat_prevent_catalog_snapshot_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'FlatDNA catalog snapshot data is immutable';
END;
$$;

DROP TRIGGER IF EXISTS flat_source_records_immutable_guard ON flat_source_records;
DROP TRIGGER IF EXISTS flat_catalog_snapshots_immutable_guard ON flat_catalog_snapshots;
DROP TRIGGER IF EXISTS flat_catalog_project_versions_immutable_guard ON flat_catalog_project_versions;
DROP TRIGGER IF EXISTS flat_catalog_warning_versions_immutable_guard ON flat_catalog_warning_versions;

CREATE TRIGGER flat_source_records_immutable_guard
BEFORE UPDATE OR DELETE ON flat_source_records
FOR EACH ROW EXECUTE FUNCTION flat_prevent_catalog_snapshot_mutation();

CREATE TRIGGER flat_catalog_snapshots_immutable_guard
BEFORE UPDATE OR DELETE ON flat_catalog_snapshots
FOR EACH ROW EXECUTE FUNCTION flat_prevent_catalog_snapshot_mutation();

CREATE TRIGGER flat_catalog_project_versions_immutable_guard
BEFORE UPDATE OR DELETE ON flat_catalog_project_versions
FOR EACH ROW EXECUTE FUNCTION flat_prevent_catalog_snapshot_mutation();

CREATE TRIGGER flat_catalog_warning_versions_immutable_guard
BEFORE UPDATE OR DELETE ON flat_catalog_warning_versions
FOR EACH ROW EXECUTE FUNCTION flat_prevent_catalog_snapshot_mutation();

COMMIT;
