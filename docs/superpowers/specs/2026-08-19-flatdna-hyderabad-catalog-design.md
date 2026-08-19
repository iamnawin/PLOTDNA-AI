# FlatDNA Hyderabad Catalog Design

Date: 2026-08-19
Status: Approved design
Product boundary: FlatDNA within PropertyDNA

## Goal

Turn FlatDNA from a 14-project reviewed pilot into a broadly searchable Hyderabad apartment catalog without presenting imported registry facts as FlatDNA verification.

The first release covers all discoverable residential apartment registrations found in approved TG-RERA source material and classified within the approved Hyderabad/HMDA market boundary. Plotted, commercial, mixed-use, non-RERA, exempt, and pre-RERA projects are outside this first catalog unless a later scope decision explicitly includes them.

The existing 14 reviewed projects remain the initial FlatDNA-reviewed subset. Broad catalog discovery and enriched review are separate product layers.

## Governing Release Rule

> No ingestion run can affect PropertyDNA customers until it produces a complete, reconciled and validated FlatDNA catalog snapshot that passes every publication gate and is atomically promoted.

## Acquisition Hard Gate

Automated production ingestion must not begin until all of the following are documented and approved:

- The permitted TG-RERA acquisition method.
- Portal, export, feed, rate-limit, authentication, captcha, retention, and redistribution constraints.
- The exact source endpoints or files and the fields they provide.
- The retrieval schedule and operator identity.
- The raw-evidence retention policy.
- The Hyderabad/HMDA boundary source and version.
- The residential-apartment classification rules.
- The expected source denominator and known completeness limitations.

A permissioned export or feed is preferred. A rate-controlled public-record importer is allowed only after its operating constraints are reviewed. Captcha bypass, access-control circumvention, and unsupported production scraping are prohibited.

Until this gate is approved, implementation may use sanitized fixtures and disposable test data only.

## Product Layers

| Catalog layer | Customer label | Information displayed |
| --- | --- | --- |
| Imported TG-RERA project | **Listed in TG-RERA records** | Registry facts, source date, project status, location precision, and sourced regulatory warnings |
| Current reviewed project | **FlatDNA Reviewed** | Registry facts plus current enriched analysis, risks, comparisons, and verdict |
| Uncertain location only | **Details being verified** | Limited registry facts with honest location wording |
| Uncertain project identity | Not displayed | Quarantined for resolution |
| Outside FlatDNA scope | Not displayed | Internal exclusion reason |
| Completed or withdrawn project | Relevant status badge | Searchable when historically useful |

“Listed in TG-RERA records” describes provenance. It must not imply PropertyDNA endorsement, legal approval, title verification, construction quality, or investment safety.

## Independent Status Dimensions

The system must not overload one lifecycle field with unrelated meanings.

### Review status

```text
REVIEW_REQUIRED
SUPPORTED
UNSUPPORTED
```

- `REVIEW_REQUIRED`: no current FlatDNA review is eligible to support rich claims.
- `SUPPORTED`: a current, non-expired FlatDNA review exists and satisfies every evidence constraint.
- `UNSUPPORTED`: the identity is understood, but the project is outside FlatDNA review scope or has an approved exclusion reason.

Identity failures must never use `UNSUPPORTED`.

### Identity status

```text
RESOLVED
PARTIALLY_RESOLVED
UNRESOLVED
```

- `RESOLVED`: registration, project, and promoter identity are unambiguous.
- `PARTIALLY_RESOLVED`: project identity is unambiguous, but locality or coordinate mapping remains uncertain.
- `UNRESOLVED`: project, promoter, registration, or duplicate identity is uncertain.

`PARTIALLY_RESOLVED + SEARCHABLE` is permitted only when:

- A valid, unique TG-RERA registration number exists.
- The project and promoter record are unambiguous.
- No duplicate registration is suspected.
- Only locality or coordinate mapping remains uncertain.

If project identity is uncertain, the record must remain `UNRESOLVED + QUARANTINED`.

### Project status

```text
ACTIVE
COMPLETED
WITHDRAWN
LAPSED
UNKNOWN
```

This records the source-derived project lifecycle. Completed and withdrawn projects may remain searchable when historically useful.

### Catalog status

```text
SEARCHABLE
QUARANTINED
HIDDEN
```

- `SEARCHABLE`: eligible for public catalog queries in a published snapshot.
- `QUARANTINED`: retained for resolution but excluded from normal public search and indexed totals.
- `HIDDEN`: intentionally excluded, with an internal reason.

### Regulatory flags

The independent `regulatory_flags` collection uses:

```text
REVOKED
DEFAULTER
LITIGATION_REPORTED
OTHER_WARNING
```

Flags are multi-valued and independent of every other status dimension. Each flag must record one origin:

- `TG_RERA`: **Reported in TG-RERA records**
- `FLATDNA_REVIEW`: **Identified during FlatDNA review**
- `THIRD_PARTY`: **Third-party evidence—verification pending**

A warning may be marked resolved only when its supporting origin explicitly reports resolution. Absence from a later import is not proof of resolution.

## Status Invariants and Transitions

- `SUPPORTED` requires a valid `current_review_id` belonging to the same canonical project.
- The referenced review must be current, non-expired, and evidence-complete.
- Only one current review may exist per canonical project.
- When a review expires, current rich-claim eligibility ends and effective review status returns to `REVIEW_REQUIRED`.
- Expiration does not delete or rewrite the historical review.
- Historical reviews are immutable.
- `UNRESOLVED` requires `QUARANTINED` or `HIDDEN`; it can never be `SEARCHABLE`.
- `PARTIALLY_RESOLVED + SEARCHABLE` must satisfy the precise exception defined above.
- `UNSUPPORTED` requires a resolved identity and an approved scope-exclusion reason.
- `COMPLETED` does not imply `HIDDEN` or `UNSUPPORTED`.
- Regulatory flags do not automatically change review, identity, project, or catalog status.
- No working-state transition affects customers until a new snapshot is published.

## Architecture and Data Flow

```text
Approved TG-RERA acquisition
        ↓
Ingestion run and immutable raw source records
        ↓
Normalize project, promoter, registration, address and source status
        ↓
Resolve registration identity and duplicates with internal confidence
        ↓
Filter by geography, property type and approved scope
        ↓
Map locality and coordinates with internal confidence
        ↓
Build snapshot-specific customer projection
        ↓
Validate, reconcile and calculate snapshot metrics
        ↓
Atomically publish the validated catalog snapshot
        ↓
Serve registry facts for searchable registrations
        ↓
Trigger evidence review by demand, risk or business priority
        ↓
Serve current FlatDNA analysis only for eligible reviewed projects
```

Ingestion may mutate working data. Customer queries may read only an atomically published and validated catalog snapshot.

## Persistence Model

The design remains inside the existing PostgreSQL-backed FastAPI application and extends the existing `flat_*` domain.

### `flat_ingestion_runs`

Records every acquisition attempt, including failures:

- Run ID.
- Acquisition method and source.
- Started and completed timestamps.
- Source retrieval date.
- Importer name and version.
- Request or source metadata permitted by the acquisition policy.
- Success/failure state and sanitized error summary.
- Raw artifact location and content hash.
- Diagnostic record counts.

A failed run may retain diagnostic evidence but cannot create or publish a customer catalog snapshot.

### Immutable raw source records

Every acquired record must retain:

- Ingestion run ID.
- Source URL or approved source identifier.
- Retrieval timestamp.
- Raw payload or immutable artifact reference.
- Content hash.
- Source registration number as observed.
- Parser/importer version.

Raw evidence is append-only. Normalized corrections never rewrite the source record.

### `flat_catalog_snapshots`

Represents a successfully processed, immutable candidate catalog:

- Snapshot ID such as `tg-rera-2026-08-18-001`.
- Source-as-of date.
- Producing ingestion run.
- Processing version.
- Validation state and reconciliation report reference.
- Snapshot-consistent measures.
- Publication eligibility state.

Only successfully processed snapshots may reach publication validation.

### `flat_catalog_publications`

Provides the atomic production publication pointer:

- Publication ID and channel.
- Published snapshot ID.
- Published-at and superseded-at timestamps.
- Publisher identity or approved automation method.
- Validation receipt.
- Optional rollback-of publication reference.

There must be at most one current publication per channel. Publication occurs in one database transaction that supersedes the previous pointer and activates the new one. Rollback republishes a previously validated snapshot; it does not mutate that snapshot.

Customer queries must resolve the active publication first and use its snapshot ID for both records and metrics.

### Canonical projects and registrations

`flat_projects` remains the stable canonical development identity and retains existing UUIDs.

`flat_project_registrations` models independently registered phases:

- Registration UUID.
- Canonical project UUID.
- Normalized RERA number with an authority-scoped uniqueness constraint.
- Source registration number.
- Registered phase or project name.
- Promoter reference.
- Parent-development relationship where known.

Two RERA registrations must not be merged merely because names, addresses, or promoters are similar. Parent-development grouping may connect registrations without destroying phase-level regulatory identity.

### Snapshot membership and projection

`flat_catalog_project_versions` is the immutable customer projection for one snapshot. Each row represents one registration-backed catalog entry and contains:

- Snapshot ID.
- Canonical project ID.
- Registration ID and source-record ID.
- Normalized customer-visible registry fields.
- Independent review, identity, project, and catalog statuses as effective for that snapshot.
- Location precision and customer-safe mapped values.
- Warning references.
- Source-as-of metadata.

Search and metrics must query this projection using the same published snapshot ID. A mutable `current_source_snapshot_id` on `flat_projects` is not sufficient and must not be the customer query boundary.

### Match and mapping assessments

Internal assessment data must separately store method and confidence for:

- Project-name normalization.
- Duplicate matching.
- Promoter matching.
- Locality mapping.
- Coordinate accuracy.

Technical scores remain internal. Exact registration matches may resolve registration identity. Fuzzy name, address, or promoter similarity may propose candidates but cannot silently merge registrations or promote a project to `SUPPORTED`.

### Regulatory warnings

Regulatory warning records contain:

- Canonical project and, where applicable, registration.
- Flag type.
- Origin classification.
- Supporting source record or reviewed evidence.
- Observed-at date.
- Active/resolved state.
- Explicit resolution evidence when resolved.

### Versioned FlatDNA reviews

Reviews are immutable versions containing:

- Review ID and canonical project ID.
- Reviewer or review method.
- Review date.
- Evidence-as-of date.
- Evidence snapshot/version.
- Valid-until date.
- Current/historical state.
- Refresh status.
- Links to existing evidence sources and approved claim evidence.

`flat_projects.current_review_id` may reference the only current review. Database and publication constraints must prevent cross-project references, multiple current reviews, expired current eligibility, and `SUPPORTED` without a valid review.

## Location Presentation

Internal mapping confidence must be translated into customer language:

| Stored precision | Customer wording | Map behavior |
| --- | --- | --- |
| Verified project coordinate | **Exact project location** | Project pin allowed |
| Lower-precision project coordinate | **Approximate project location** | Visually approximate marker; no exact-pin implication |
| Locality only | **Locality-level location** | Locality area or centroid treatment, not a project pin |
| Unresolved mapping | **Location being verified** | No precise map marker |

Weak coordinates, geocoded localities, and fuzzy name matches must never silently become verified project locations.

## Review Freshness

Initial review policy:

- Active projects: current review valid for 90 days.
- Completed projects: current review valid for 180 days.
- Regulatory, identity, promoter, or material project-status changes trigger immediate re-review.

An expired review remains accessible under **Historical FlatDNA Review** and must show:

- Review date.
- Evidence-as-of date.
- **Historical—not a current assessment**.
- Refresh status.

The historical score or verdict must not appear as the current project verdict. Current registry facts remain available from the published catalog.

## Acquisition and Refresh Workflow

- Daily incremental acquisition is the target after the acquisition hard gate is approved.
- A weekly full reconciliation checks source drift, missing records, new registrations, status changes, and warning changes.
- Every run is idempotent for the same source payload and importer version.
- A failed run retains diagnostics and raw evidence when permitted.
- A failed run cannot create a published snapshot or move the publication pointer.
- The last-known-good publication remains available with explicit freshness metadata.

Review queues are prioritized by customer search demand, regulatory risk, material source changes, and business priority.

## Publication Validation

A snapshot is publication-eligible only when all checks pass:

- Every projected row belongs to the candidate snapshot.
- Every searchable record has a valid unique registration identity.
- No `UNRESOLVED` record is searchable.
- Every partially resolved searchable record satisfies the location-only exception.
- Separate RERA registrations remain separate.
- Scope and exclusion reasons are populated consistently.
- Location display behavior matches stored precision.
- Every warning has an origin and supporting evidence.
- `SUPPORTED` rows have a valid current review for the same canonical project.
- Expired reviews do not produce current verdict eligibility.
- Searchable-row counts reconcile with indexed metrics.
- Migration reconciliation for the existing reviewed projects passes.
- API contract, customer-language, failure-injection, and rollback checks pass.

Publication switches atomically only after validation. Search must never read an unpublished snapshot.

## Measurable Coverage

“Broad coverage” is not an acceptance criterion. Each published snapshot must calculate and expose operationally:

- Acquired source records.
- Unique source registrations.
- Classified apartment registrations.
- In-geography registrations.
- Searchable records.
- Quarantined records.
- Hidden or excluded records, grouped by reason.
- Resolved, partially resolved, and unresolved identities.
- Current FlatDNA-reviewed projects.
- Review-required projects.
- Expired historical reviews.
- Active regulatory warnings by origin and type.

The customer-facing indexed count means public `SEARCHABLE` records only. It excludes quarantined, hidden, unresolved, and unpublished records.

Indexed and reviewed customer metrics must be computed from the same active snapshot:

```text
2,480 Hyderabad apartment records indexed
14 currently FlatDNA Reviewed
Data retrieved from TG-RERA on 18 August 2026
```

The numbers above are illustrative, not expected production counts.

## Public API Contract

Search remains available by project, promoter, locality, and RERA registration number. Responses must include snapshot and freshness metadata.

Representative project metadata:

```json
{
  "source_as_of": "2026-08-18",
  "catalog_snapshot_id": "tg-rera-2026-08-18-001",
  "catalog_layer": "FLATDNA_REVIEWED",
  "review_status": "SUPPORTED",
  "identity_status": "RESOLVED",
  "project_status": "ACTIVE",
  "catalog_status": "SEARCHABLE",
  "review_freshness": "CURRENT",
  "reviewed_at": "2026-08-10",
  "review_valid_until": "2026-11-10",
  "location_precision": "LOCALITY",
  "warnings": [],
  "served_from_last_known_good": false
}
```

API rules:

- Search and catalog metrics return the same `catalog_snapshot_id`.
- Internal confidence scores, quarantined records, exclusion reasons, and unresolved candidates are not exposed publicly.
- A registry-only result omits current FlatDNA verdict fields.
- An expired review returns historical-review metadata separately and cannot populate current verdict fields.
- Warnings include customer-safe origin wording and supporting source metadata.
- `served_from_last_known_good` is true when freshness is degraded because a later run failed.
- An unavailable source does not produce a `NOT_FOUND` domain result for records already present in the last-known-good publication.

## Customer Language

Primary search copy:

> **Search Hyderabad apartment projects listed in TG-RERA records. Selected projects include additional FlatDNA review.**

Expired review:

> **FlatDNA analysis is being refreshed. Registry information remains available below. You can also view the dated historical review.**

No confident match:

> **We couldn’t find a confident match. Check the project name or registration number, or request project verification.**

Customer-visible claims must reveal their source, precision, and freshness without exposing internal scoring mechanics.

## Failure Handling and Rollback

- Source unavailable: fail the ingestion run and retain the current publication.
- Parser failure: retain raw diagnostics, create no publishable snapshot.
- Partial source response: reject publication unless the approved acquisition contract explicitly supports partial snapshots and reconciliation proves completeness.
- Duplicate registration conflict: quarantine affected records and fail publication if a searchable identity would become ambiguous.
- Validation or metric mismatch: reject publication.
- Database interruption during publication: transaction rollback leaves the previous pointer active.
- Fault after publication: republish the previous validated snapshot through an audited rollback transaction.
- Review expiration: remove current verdict eligibility without deleting history.
- Missing warning in a later import: retain the warning until its origin explicitly resolves it.

## Existing 14-Project Migration

The current reviewed registry is the migration baseline. Before publication can switch to the new architecture, a reconciliation report must prove for all 14 projects:

- Canonical project UUID is unchanged.
- Existing registration reference is retained and linked to the correct project.
- Project and developer relationships remain correct.
- Evidence-source IDs and claim-evidence links remain intact.
- Existing approved evidence is preserved.
- Review history is created without rewriting provenance.
- Customer-visible project identity, search matching, detail availability, and source presentation remain behaviorally compatible except for intentionally approved wording and freshness additions.
- No reviewed project is silently split, merged, hidden, quarantined, or downgraded.

The publication pointer cannot move until the reconciliation report passes for all 14 projects.

## Rollout

### Phase 1: Acquisition proof

- Approve acquisition constraints.
- Capture representative active, completed, phased, and warned registrations.
- Approve boundary and property-type classifiers.
- Establish measurable source coverage.

### Phase 2: Persistence foundation

- Add ingestion, snapshot, publication, registration, projection, warning, and review-version structures.
- Add constraints and status-transition guards.
- Prepare a non-destructive migration for the existing registry.

### Phase 3: Processing pipeline

- Normalize and resolve identities.
- Preserve phase-level registrations.
- Apply geography, scope, and location mapping.
- Produce quarantined, hidden, and searchable projections.

### Phase 4: Validation and migration rehearsal

- Run complete traceability and failure suites.
- Produce the 14-project reconciliation report.
- Simulate publication, read consistency, rollback, and failed publication.

### Phase 5: Product release

- Publish the first validated Hyderabad catalog atomically.
- Release snapshot-consistent search, detail, metrics, and copy.
- Start demand/risk-driven review queues and freshness monitoring.

## Requirement-to-Schema Traceability

| Requirement | Schema boundary |
| --- | --- |
| Record every attempted acquisition | `flat_ingestion_runs` and immutable raw source records |
| Prevent failed runs from reaching customers | Separate snapshots plus `flat_catalog_publications` pointer |
| Keep results and metrics snapshot-consistent | `flat_catalog_project_versions.snapshot_id` and active publication |
| Preserve canonical development identity | `flat_projects` |
| Preserve phase-level regulatory identity | `flat_project_registrations` |
| Separate status dimensions | Independent status columns in canonical/working data and snapshot projections |
| Quarantine identity uncertainty | `identity_status` plus `catalog_status` constraints |
| Preserve confidence by matching dimension | Internal match and mapping assessments |
| Preserve warning origin and resolution evidence | Regulatory warning records and source links |
| Version reviews and prevent drift | Immutable reviews plus constrained `current_review_id` |
| Preserve existing reviewed evidence | Existing evidence sources and claim evidence linked to review versions |
| Make coverage measurable | Snapshot metric fields or snapshot-scoped metric records |

## Requirement-to-Test Traceability

| Requirement | Required verification |
| --- | --- |
| Acquisition hard gate | Production-mode importer refuses to run without approved acquisition configuration |
| Idempotent ingestion | Reprocess identical payload/version without duplicate canonical or registration records |
| Immutable evidence | Attempts to rewrite raw source records, snapshots, or historical reviews fail |
| Atomic publication | Readers observe either old or new snapshot, never a mixed catalog |
| Published-only reads | Search rejects or cannot address unpublished snapshot IDs |
| Snapshot-consistent metrics | Every returned record and metric carries one active snapshot ID |
| Unique registrations | Authority plus normalized RERA number constraint and conflict tests |
| Preserve separate phases | Similar project/promoter/address records with different registrations remain separate |
| Quarantine uncertain identities | Fuzzy or conflicting identity cannot become searchable |
| Partial-resolution exception | Only locality/coordinate uncertainty can be searchable |
| Honest map precision | Locality-only and unresolved locations never render precise project pins |
| Sourced warnings | Each public warning maps to an allowed origin and evidence source |
| Warning resolution safety | Missing later observation cannot resolve an existing warning |
| Review consistency | `SUPPORTED` cannot exist without a valid same-project current review |
| Review expiration | Current verdict disappears while historical review remains immutable and accessible |
| Migration preservation | Reconciliation proves all 14 UUIDs, links, history, and behaviors |
| Failure isolation | Source, parser, validation, and publication faults leave active pointer unchanged |
| Rollback | Previous validated snapshot can be atomically republished |
| API safety | Payloads omit internal confidences and current verdicts when ineligible |
| Customer language | Approved labels and disclaimers appear for every catalog layer and warning origin |

## Required Verification Artifacts

Before first publication, retain:

- Acquisition-method approval.
- Requirement-to-schema review.
- Requirement-to-test review.
- Status-transition validation report.
- Migration reconciliation report for all 14 projects.
- Snapshot publication and rollback simulation receipt.
- Failure-injection test report.
- Public API payload review.
- Customer-language review.
- Coverage reconciliation report.
- Explicit assumptions and unresolved acquisition constraints.

## Assumptions and Unresolved Acquisition Constraints

The following assumptions must be validated during Phase 1 and are not permission to begin production ingestion:

- TG-RERA exposes an approved method capable of enumerating the required registration population.
- Available records contain stable registration numbers and enough project/promoter data for normalization.
- A defensible Hyderabad/HMDA boundary can be versioned and applied consistently.
- Residential apartment registrations can be distinguished from plotted, commercial, and mixed-use records with measurable classification outcomes.
- Source terms permit the required storage, processing, refresh, and customer display of registry facts.
- Source change behavior can be reconciled without treating disappearance as withdrawal, warning resolution, or deletion.

If any assumption fails, Phase 1 must return to product and legal/operational review. The system must narrow its coverage claim rather than silently infer completeness.

## Out of Scope

- Claiming every physical Hyderabad apartment exists in TG-RERA data.
- Pre-RERA, exempt, or unregistered project discovery.
- Plotted, commercial, and mixed-use catalog coverage in the first release.
- Captcha solving or access-control circumvention.
- Automatic legal, title, approval, or investment-safety certification.
- Automatically merging separate RERA phases into one regulatory identity.
- Exposing internal match-confidence scores to customers.
- Replacing the existing PropertyDNA database or splitting FlatDNA into a separate service.

## Final Acceptance Criteria

- The acquisition hard gate is approved before automated production ingestion.
- Coverage is reported with calculated snapshot measures, not qualitative claims.
- All 14 existing reviewed projects pass migration reconciliation before publication switches.
- Every publication gate and required verification artifact passes.
- Search and metrics read only the atomically published snapshot.
- Every public claim reveals its catalog layer, source, precision, warning origin, and freshness as applicable.
- A failed or incomplete ingestion run cannot change customer-visible PropertyDNA data.
