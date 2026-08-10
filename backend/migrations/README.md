# Backend SQL migrations

FlatDNA uses explicit reviewed PostgreSQL up/down migrations. Migration 0001 is additive, creates no registry rows, and does not modify existing PlotDNA persistence.

See [`docs/database-environments.md`](../../docs/database-environments.md) for the
authoritative environment model. Production FlatDNA uses the application's existing
`DATABASE_URL`, which points to the shared Supabase project. There is no second
FlatDNA production database.

Keep `ENABLE_FLAT_DNA=false` while applying or rolling back Batch 0B.

## Disposable PostgreSQL validation

Set `FLATDNA_TEST_DATABASE_URL` to a disposable database only. The Neon project
`plotdna-flatdna-test` may fill this role, but it is never a runtime database:

```powershell
$env:FLATDNA_TEST_DATABASE_URL = "postgresql+psycopg2://postgres:flatdna_test@localhost:55432/plotdna_flatdna_0b"
Push-Location backend
uv run --with-requirements requirements.txt python -m unittest tests.test_flatdna_postgres_integration -v
Pop-Location
```

The integration test creates a unique schema, applies the up migration, verifies constraints, rolls back with the down migration, proves cleanup, and reapplies the migration. It never uses SQLite. Never set this variable to the persistent Supabase project.

## Production apply

Only after separate production approval, apply with migration credentials for the
canonical Supabase `DATABASE_URL` and stop on the first SQL error:

```powershell
psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f backend\migrations\0001_flatdna_registry.up.sql
```

Do not run the down migration against persistent Supabase production. Destructive
down/reapply verification belongs only in the disposable
`FLATDNA_TEST_DATABASE_URL` workflow above. The checked-in down migration exists for
that test/rollback proof and drops the Batch 0B trigger objects and seven `flat_*`
tables in reverse dependency order.

## Batch 0C curated registry

Migration 0001 remains unchanged and creates no data. Batch 0C registry data is
loaded separately from `data/cities/hyderabad/flatdna/registry.json` only after the
read-only validator and importer dry-run succeed. The importer uses the existing
repository transaction, fixture-owned UUIDs, and has no delete or migration mode.
