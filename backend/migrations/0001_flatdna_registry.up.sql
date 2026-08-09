BEGIN;

CREATE TABLE flat_developers (
    id uuid PRIMARY KEY,
    canonical_name text NOT NULL,
    normalized_name text NOT NULL,
    registry_status text NOT NULL DEFAULT 'DRAFT',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT flat_developers_canonical_name_check CHECK (btrim(canonical_name) <> ''),
    CONSTRAINT flat_developers_normalized_name_check CHECK (
        btrim(normalized_name) <> '' AND normalized_name = lower(btrim(normalized_name))
    ),
    CONSTRAINT flat_developers_registry_status_check CHECK (
        registry_status IN ('DRAFT', 'REVIEW_REQUIRED', 'SUPPORTED', 'UNSUPPORTED', 'INACTIVE')
    )
);

CREATE INDEX flat_developers_normalized_name_idx
    ON flat_developers (normalized_name);

CREATE TABLE flat_developer_aliases (
    id uuid PRIMARY KEY,
    developer_id uuid NOT NULL REFERENCES flat_developers(id) ON DELETE RESTRICT,
    alias text NOT NULL,
    normalized_alias text NOT NULL,
    alias_type text NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT flat_developer_aliases_alias_check CHECK (btrim(alias) <> ''),
    CONSTRAINT flat_developer_aliases_normalized_alias_check CHECK (
        btrim(normalized_alias) <> '' AND normalized_alias = lower(btrim(normalized_alias))
    ),
    CONSTRAINT flat_developer_aliases_alias_type_check CHECK (
        alias_type IN ('LEGAL_NAME', 'ABBREVIATION', 'FORMER_NAME', 'COMMON_USAGE', 'COMMON_MISSPELLING')
    ),
    CONSTRAINT flat_developer_aliases_parent_alias_key UNIQUE (developer_id, normalized_alias)
);

CREATE INDEX flat_developer_aliases_developer_id_idx
    ON flat_developer_aliases (developer_id);
CREATE INDEX flat_developer_aliases_active_normalized_alias_idx
    ON flat_developer_aliases (normalized_alias) WHERE active = true;

CREATE TABLE flat_projects (
    id uuid PRIMARY KEY,
    developer_id uuid NOT NULL REFERENCES flat_developers(id) ON DELETE RESTRICT,
    canonical_name text NOT NULL,
    normalized_name text NOT NULL,
    city_slug text NOT NULL,
    locality_slug text NOT NULL,
    latitude numeric(9,6) NULL,
    longitude numeric(10,6) NULL,
    location_precision text NOT NULL DEFAULT 'UNKNOWN',
    registry_status text NOT NULL DEFAULT 'DRAFT',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT flat_projects_canonical_name_check CHECK (btrim(canonical_name) <> ''),
    CONSTRAINT flat_projects_normalized_name_check CHECK (
        btrim(normalized_name) <> '' AND normalized_name = lower(btrim(normalized_name))
    ),
    CONSTRAINT flat_projects_city_slug_check CHECK (
        btrim(city_slug) <> '' AND city_slug = lower(btrim(city_slug))
    ),
    CONSTRAINT flat_projects_locality_slug_check CHECK (
        btrim(locality_slug) <> '' AND locality_slug = lower(btrim(locality_slug))
    ),
    CONSTRAINT flat_projects_coordinate_pair_check CHECK (
        (latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)
    ),
    CONSTRAINT flat_projects_latitude_check CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT flat_projects_longitude_check CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    CONSTRAINT flat_projects_location_precision_check CHECK (
        location_precision IN ('ENTRANCE', 'PROJECT_CENTROID', 'APPROXIMATE', 'UNKNOWN')
    ),
    CONSTRAINT flat_projects_registry_status_check CHECK (
        registry_status IN ('DRAFT', 'REVIEW_REQUIRED', 'SUPPORTED', 'UNSUPPORTED', 'INACTIVE')
    )
);

CREATE INDEX flat_projects_normalized_name_idx ON flat_projects (normalized_name);
CREATE INDEX flat_projects_developer_id_idx ON flat_projects (developer_id);
CREATE INDEX flat_projects_city_locality_idx ON flat_projects (city_slug, locality_slug);
CREATE UNIQUE INDEX flat_projects_supported_identity_key
    ON flat_projects (developer_id, city_slug, locality_slug, normalized_name)
    WHERE registry_status = 'SUPPORTED';

CREATE TABLE flat_project_aliases (
    id uuid PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES flat_projects(id) ON DELETE RESTRICT,
    alias text NOT NULL,
    normalized_alias text NOT NULL,
    alias_type text NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT flat_project_aliases_alias_check CHECK (btrim(alias) <> ''),
    CONSTRAINT flat_project_aliases_normalized_alias_check CHECK (
        btrim(normalized_alias) <> '' AND normalized_alias = lower(btrim(normalized_alias))
    ),
    CONSTRAINT flat_project_aliases_alias_type_check CHECK (
        alias_type IN (
            'MARKETING', 'ABBREVIATION', 'FORMER_NAME', 'COMMON_MISSPELLING',
            'BUILDER_PREFIXED', 'LOCALITY_QUALIFIED', 'PHASE_NAME'
        )
    ),
    CONSTRAINT flat_project_aliases_parent_alias_key UNIQUE (project_id, normalized_alias)
);

CREATE INDEX flat_project_aliases_project_id_idx
    ON flat_project_aliases (project_id);
CREATE INDEX flat_project_aliases_active_normalized_alias_idx
    ON flat_project_aliases (normalized_alias) WHERE active = true;

CREATE TABLE flat_rera_references (
    id uuid PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES flat_projects(id) ON DELETE RESTRICT,
    authority_code text NOT NULL,
    registration_number text NOT NULL,
    normalized_registration_number text NOT NULL,
    reference_status text NOT NULL DEFAULT 'RECORDED',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT flat_rera_references_authority_code_check CHECK (
        btrim(authority_code) <> '' AND authority_code = upper(btrim(authority_code))
    ),
    CONSTRAINT flat_rera_references_registration_number_check CHECK (btrim(registration_number) <> ''),
    CONSTRAINT flat_rera_references_normalized_number_check CHECK (
        btrim(normalized_registration_number) <> ''
        AND normalized_registration_number = lower(btrim(normalized_registration_number))
    ),
    CONSTRAINT flat_rera_references_status_check CHECK (
        reference_status IN ('RECORDED', 'VERIFIED', 'REVIEW_REQUIRED', 'SUPERSEDED')
    ),
    CONSTRAINT flat_rera_references_authority_number_key UNIQUE (
        authority_code, normalized_registration_number
    )
);

CREATE INDEX flat_rera_references_project_id_idx
    ON flat_rera_references (project_id);
CREATE INDEX flat_rera_references_normalized_number_idx
    ON flat_rera_references (normalized_registration_number);

CREATE TABLE flat_evidence_sources (
    id uuid PRIMARY KEY,
    source_class text NOT NULL,
    data_origin text NOT NULL,
    publisher text NOT NULL,
    title text NULL,
    source_ref text NOT NULL,
    url text NULL,
    retrieved_at timestamptz NOT NULL,
    content_hash char(64) NULL,
    source_status text NOT NULL DEFAULT 'ACTIVE',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT flat_evidence_sources_source_class_check CHECK (
        source_class IN ('OFFICIAL_PROJECT', 'OFFICIAL_REGULATOR', 'BUILDER_PUBLISHED', 'CURATED_REFERENCE')
    ),
    CONSTRAINT flat_evidence_sources_data_origin_check CHECK (data_origin IN ('REAL', 'CURATED')),
    CONSTRAINT flat_evidence_sources_publisher_check CHECK (btrim(publisher) <> ''),
    CONSTRAINT flat_evidence_sources_source_ref_check CHECK (btrim(source_ref) <> ''),
    CONSTRAINT flat_evidence_sources_content_hash_check CHECK (
        content_hash IS NULL OR content_hash ~ '^[0-9a-f]{64}$'
    ),
    CONSTRAINT flat_evidence_sources_source_status_check CHECK (
        source_status IN ('ACTIVE', 'INVALID', 'SUPERSEDED')
    ),
    CONSTRAINT flat_evidence_sources_retrieval_key UNIQUE (source_class, source_ref, retrieved_at)
);

CREATE INDEX flat_evidence_sources_source_ref_idx ON flat_evidence_sources (source_ref);
CREATE INDEX flat_evidence_sources_content_hash_idx ON flat_evidence_sources (content_hash)
    WHERE content_hash IS NOT NULL;
CREATE INDEX flat_evidence_sources_source_status_idx ON flat_evidence_sources (source_status);

CREATE TABLE flat_claim_evidence (
    id uuid PRIMARY KEY,
    evidence_source_id uuid NOT NULL REFERENCES flat_evidence_sources(id) ON DELETE RESTRICT,
    developer_id uuid NULL REFERENCES flat_developers(id) ON DELETE RESTRICT,
    developer_alias_id uuid NULL REFERENCES flat_developer_aliases(id) ON DELETE RESTRICT,
    project_id uuid NULL REFERENCES flat_projects(id) ON DELETE RESTRICT,
    project_alias_id uuid NULL REFERENCES flat_project_aliases(id) ON DELETE RESTRICT,
    rera_reference_id uuid NULL REFERENCES flat_rera_references(id) ON DELETE RESTRICT,
    claim_key text NOT NULL,
    observed_value text NOT NULL,
    review_status text NOT NULL DEFAULT 'PENDING',
    reviewed_by text NULL,
    reviewed_at timestamptz NULL,
    notes text NULL,
    fingerprint char(64) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT flat_claim_evidence_subject_check CHECK (
        num_nonnulls(developer_id, developer_alias_id, project_id, project_alias_id, rera_reference_id) = 1
    ),
    CONSTRAINT flat_claim_evidence_claim_key_check CHECK (btrim(claim_key) <> ''),
    CONSTRAINT flat_claim_evidence_observed_value_check CHECK (btrim(observed_value) <> ''),
    CONSTRAINT flat_claim_evidence_review_status_check CHECK (
        review_status IN ('PENDING', 'APPROVED', 'REJECTED')
    ),
    CONSTRAINT flat_claim_evidence_review_metadata_check CHECK (
        (review_status = 'PENDING' AND reviewed_by IS NULL AND reviewed_at IS NULL)
        OR
        (
            review_status IN ('APPROVED', 'REJECTED')
            AND reviewed_by IS NOT NULL
            AND btrim(reviewed_by) <> ''
            AND reviewed_at IS NOT NULL
        )
    ),
    CONSTRAINT flat_claim_evidence_fingerprint_check CHECK (fingerprint ~ '^[0-9a-f]{64}$'),
    CONSTRAINT flat_claim_evidence_fingerprint_key UNIQUE (fingerprint)
);

CREATE INDEX flat_claim_evidence_source_id_idx ON flat_claim_evidence (evidence_source_id);
CREATE INDEX flat_claim_evidence_developer_id_idx ON flat_claim_evidence (developer_id)
    WHERE developer_id IS NOT NULL;
CREATE INDEX flat_claim_evidence_developer_alias_id_idx ON flat_claim_evidence (developer_alias_id)
    WHERE developer_alias_id IS NOT NULL;
CREATE INDEX flat_claim_evidence_project_id_idx ON flat_claim_evidence (project_id)
    WHERE project_id IS NOT NULL;
CREATE INDEX flat_claim_evidence_project_alias_id_idx ON flat_claim_evidence (project_alias_id)
    WHERE project_alias_id IS NOT NULL;
CREATE INDEX flat_claim_evidence_rera_reference_id_idx ON flat_claim_evidence (rera_reference_id)
    WHERE rera_reference_id IS NOT NULL;
CREATE INDEX flat_claim_evidence_approved_project_claim_idx
    ON flat_claim_evidence (project_id, claim_key)
    WHERE project_id IS NOT NULL AND review_status = 'APPROVED';

CREATE FUNCTION flat_assert_supported_project_evidence(target_project_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    project_row flat_projects%ROWTYPE;
BEGIN
    SELECT * INTO project_row FROM flat_projects WHERE id = target_project_id;
    IF NOT FOUND OR project_row.registry_status <> 'SUPPORTED' THEN
        RETURN;
    END IF;

    IF project_row.latitude IS NULL OR project_row.longitude IS NULL
       OR project_row.location_precision = 'UNKNOWN' THEN
        RAISE EXCEPTION 'SUPPORTED FlatDNA project % requires reviewed coordinates', target_project_id
            USING ERRCODE = 'check_violation';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM flat_claim_evidence claim
        JOIN flat_evidence_sources source ON source.id = claim.evidence_source_id
        WHERE claim.project_id = target_project_id
          AND claim.claim_key = 'identity.canonical_name'
          AND claim.observed_value = project_row.normalized_name
          AND claim.review_status = 'APPROVED'
          AND source.data_origin IN ('REAL', 'CURATED')
          AND source.source_status = 'ACTIVE'
    ) THEN
        RAISE EXCEPTION 'SUPPORTED FlatDNA project % lacks canonical-name evidence', target_project_id
            USING ERRCODE = 'check_violation';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM flat_claim_evidence claim
        JOIN flat_evidence_sources source ON source.id = claim.evidence_source_id
        WHERE claim.project_id = target_project_id
          AND claim.claim_key = 'identity.developer'
          AND claim.observed_value = project_row.developer_id::text
          AND claim.review_status = 'APPROVED'
          AND source.data_origin IN ('REAL', 'CURATED')
          AND source.source_status = 'ACTIVE'
    ) THEN
        RAISE EXCEPTION 'SUPPORTED FlatDNA project % lacks developer evidence', target_project_id
            USING ERRCODE = 'check_violation';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM flat_claim_evidence claim
        JOIN flat_evidence_sources source ON source.id = claim.evidence_source_id
        WHERE claim.project_id = target_project_id
          AND claim.claim_key = 'identity.locality'
          AND claim.observed_value = project_row.city_slug || '/' || project_row.locality_slug
          AND claim.review_status = 'APPROVED'
          AND source.data_origin IN ('REAL', 'CURATED')
          AND source.source_status = 'ACTIVE'
    ) THEN
        RAISE EXCEPTION 'SUPPORTED FlatDNA project % lacks locality evidence', target_project_id
            USING ERRCODE = 'check_violation';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM flat_claim_evidence claim
        JOIN flat_evidence_sources source ON source.id = claim.evidence_source_id
        WHERE claim.project_id = target_project_id
          AND claim.claim_key = 'identity.coordinates'
          AND claim.observed_value = project_row.latitude::text || ',' || project_row.longitude::text
          AND claim.review_status = 'APPROVED'
          AND source.data_origin IN ('REAL', 'CURATED')
          AND source.source_status = 'ACTIVE'
    ) THEN
        RAISE EXCEPTION 'SUPPORTED FlatDNA project % lacks coordinate evidence', target_project_id
            USING ERRCODE = 'check_violation';
    END IF;
END;
$$;

CREATE FUNCTION flat_revalidate_supported_project()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    affected_project_id uuid;
    source_id uuid;
BEGIN
    IF TG_TABLE_NAME = 'flat_projects' THEN
        IF TG_OP = 'UPDATE' AND OLD.id <> NEW.id THEN
            RAISE EXCEPTION 'FlatDNA project UUIDs are immutable'
                USING ERRCODE = 'check_violation';
        END IF;
        PERFORM flat_assert_supported_project_evidence(NEW.id);
    ELSIF TG_TABLE_NAME = 'flat_claim_evidence' THEN
        IF TG_OP <> 'INSERT' AND OLD.project_id IS NOT NULL THEN
            PERFORM flat_assert_supported_project_evidence(OLD.project_id);
        END IF;
        IF TG_OP <> 'DELETE' AND NEW.project_id IS NOT NULL THEN
            PERFORM flat_assert_supported_project_evidence(NEW.project_id);
        END IF;
    ELSIF TG_TABLE_NAME = 'flat_evidence_sources' THEN
        IF TG_OP = 'DELETE' THEN
            source_id := OLD.id;
        ELSE
            source_id := NEW.id;
        END IF;
        FOR affected_project_id IN
            SELECT DISTINCT project_id
            FROM flat_claim_evidence
            WHERE evidence_source_id = source_id AND project_id IS NOT NULL
        LOOP
            PERFORM flat_assert_supported_project_evidence(affected_project_id);
        END LOOP;
    END IF;
    RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER flat_supported_project_row_guard
AFTER INSERT OR UPDATE ON flat_projects
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION flat_revalidate_supported_project();

CREATE CONSTRAINT TRIGGER flat_supported_project_claim_guard
AFTER INSERT OR UPDATE OR DELETE ON flat_claim_evidence
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION flat_revalidate_supported_project();

CREATE CONSTRAINT TRIGGER flat_supported_project_source_guard
AFTER UPDATE OR DELETE ON flat_evidence_sources
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION flat_revalidate_supported_project();

COMMIT;
