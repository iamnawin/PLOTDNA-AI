# Backend SQL migrations

FlatDNA uses explicit reviewed PostgreSQL up/down migrations. Migration 0001 is additive, creates no registry rows, and does not modify existing PlotDNA persistence.

Keep `ENABLE_FLAT_DNA=false` while applying or rolling back Batch 0B.

## Disposable PostgreSQL validation

Set a SQLAlchemy PostgreSQL URL for a disposable database:

```powershell
$env:FLATDNA_TEST_DATABASE_URL = "postgresql+psycopg2://postgres:flatdna_test@localhost:55432/plotdna_flatdna_0b"
Push-Location backend
uv run --with-requirements requirements.txt python -m unittest tests.test_flatdna_postgres_integration -v
Pop-Location
```

The integration test creates a unique schema, applies the up migration, verifies constraints, rolls back with the down migration, proves cleanup, and reapplies the migration. It never uses SQLite.

## Manual apply and rollback

Apply with migration credentials and stop on the first SQL error:

```powershell
psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f backend\migrations\0001_flatdna_registry.up.sql
```

Before rollback, keep the feature flag off and export any FlatDNA data. Migration 0001 can be rolled back directly only while no later FlatDNA migration depends on it:

```powershell
psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f backend\migrations\0001_flatdna_registry.down.sql
```

The down migration drops only the Batch 0B trigger objects and seven `flat_*` tables in reverse dependency order.

## Batch 0C curated registry

Migration 0001 remains unchanged and creates no data. Batch 0C registry data is
loaded separately from `data/cities/hyderabad/flatdna/registry.json` only after the
read-only validator and importer dry-run succeed. The importer uses the existing
repository transaction, fixture-owned UUIDs, and has no delete or migration mode.
