# Hyderabad FlatDNA registry

`registry.json` is the sole supported Batch 0C import fixture. It contains 14
human-reviewed apartment projects and parses directly as the backend
`RegistryBundle`. It is a curated pilot, not exhaustive Hyderabad coverage.

## Curation rules

- Only projects marked `INCLUDE` in `planning-0c-evidence-review.md` may be present.
- Every UUID is generated once during curation and stored in the fixture. Loaders and
  importers never generate or derive identity from names.
- Every supported developer and project fact, active alias, and RERA reference has an
  approved claim tied to an active REAL or CURATED source.
- Builder sources support names and developer relationships. Telangana RERA sources
  support registration references. Curated location sources support the reviewed
  point and its PlotDNA locality mapping.
- TEST, SYNTHETIC, `tsrera_scraper.py`, and `data/tsrera_projects.json` evidence is
  forbidden.
- A spelling correction retains the same UUID. A split or merge requires a separate
  reviewed identity decision and must not reuse an ID for another entity.

The five DRAFT and two EXCLUDED candidates remain only in the evidence-review note;
they are not part of this fixture or import path.

`resolver-cases.json` is a reviewed 59-query evaluation corpus. It is not registry
data, is never imported, and does not approve or teach aliases. Production resolver
candidates come only from supported PostgreSQL project rows and their active,
registry-managed aliases.

## Review and import

Validate without a database:

```powershell
uv run --with-requirements backend/requirements.txt python scripts/validate_flatdna_registry.py
```

The importer is also dry-run by default. Applying requires a database URL in an
explicitly named environment variable and an exact sanitized target confirmation:

```powershell
uv run --with-requirements backend/requirements.txt python scripts/import_flatdna_registry.py
```

Use `--apply` only after reviewing `--help`. The tool has no delete, truncate,
replace-all, migration, or production-enable path. Imports use one repository
transaction and re-import the same fixture IDs idempotently.

## Project review fields

Review each project in the fixture against its canonical and normalized name,
developer UUID, active aliases, locality slug, coordinates and precision, RERA
authority/number/status, source references and retrieval time, claim reviewer/time,
and `SUPPORTED` status. The evidence-review note records unresolved candidates and
the reasons they were not seeded.
