# TG-RERA Catalog Acquisition Constraints

Date: 2026-08-19
Status: `UNAPPROVED` for automated production ingestion

## Catalog Scope

The first FlatDNA catalog targets residential apartment registrations found in approved TG-RERA source material and classified within the approved Hyderabad/HMDA market boundary. Plotted, commercial, mixed-use, exempt, unregistered, and pre-RERA projects are outside this first catalog.

## Current Operating Boundary

No automated production acquisition method is approved. The repository does not contain an approved export endpoint, feed contract, public-record import procedure, authentication method, rate limit, captcha workflow, or redistribution approval.

Until those constraints are documented and approved:

- Production acquisition must fail closed.
- No code may bypass captcha or access controls.
- No undocumented endpoint may be treated as a production interface.
- Sanitized fixtures and disposable test data may be used for implementation.
- Existing reviewed evidence remains the only supported FlatDNA project corpus.

The machine-readable gate is [acquisition-policy.json](../../data/cities/hyderabad/flatdna/acquisition-policy.json). It intentionally declares `UNAPPROVED`.

## Approval Evidence Required

Before changing the policy to `APPROVED`, record and review:

- Acquisition method: permissioned export, permissioned feed, or approved public-record import.
- Source identifiers and permitted fields.
- Authentication, captcha, rate-limit, retention, and redistribution rules.
- Approved operator or automation identity and approval timestamp.
- Retrieval and full-reconciliation cadence.
- Raw artifact retention and hashing rules.
- Versioned Hyderabad/HMDA boundary source.
- Versioned residential-apartment classifier.
- Source denominator and known completeness limitations.
- Failure, incident, and revocation procedure.

Approval metadata must not contain credentials. Secrets belong only in an ignored local environment or the hosting provider's secret manager.

## Coverage Measures

Every successfully processed source must calculate:

- Acquired records.
- Unique registrations.
- Classified apartment registrations.
- In-geography registrations.
- Searchable, quarantined, and excluded records.
- Resolved, partially resolved, and unresolved identities.
- Currently reviewed projects.

The public indexed count means searchable rows in one atomically published snapshot. It never includes quarantined, hidden, unresolved, or unpublished records.

## Offline Validation

Validate the checked-in policy without accessing TG-RERA:

```powershell
uv run --with-requirements backend/requirements.txt python scripts/validate_flatdna_acquisition.py
```

Verify that production automation remains blocked:

```powershell
uv run --with-requirements backend/requirements.txt python scripts/validate_flatdna_acquisition.py --require-approved
```

The second command must exit with status 1 while the policy is `UNAPPROVED`.

## Approval Change Procedure

Changing the policy requires a reviewed commit that includes the acquisition evidence, operating constraints, boundary version, classifier version, completeness basis, tests for the approved method, and an updated catalog-design receipt. Policy approval alone does not publish customer data; every ingestion result must still pass snapshot validation and atomic publication gates.
