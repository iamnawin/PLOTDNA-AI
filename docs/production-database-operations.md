# PropertyDNA production database operations

This workflow operates only on the persistent PropertyDNA Supabase PostgreSQL
database. Neon remains disposable test infrastructure. FlatDNA feature flags stay
off until a separate release decision.

## One-time local configuration

Manually create this gitignored file from the repository root:

```text
.local-secrets/production.env
```

Its only required entry is:

```dotenv
DATABASE_URL=<Supabase PostgreSQL Session Pooler URL>
```

Never commit this file or paste its value into commands, logs, issues, or chat. The
operator reads it directly; inherited PowerShell, Codex, Windows User, and
`FLATDNA_PRODUCTION_DATABASE_URL` variables are not used.

## Operator workflow

Run commands from the repository root:

```powershell
python backend/scripts/propertydna_db.py inspect
python backend/scripts/propertydna_db.py inspect --diagnose
python backend/scripts/propertydna_db.py migrate --confirm-production
python backend/scripts/propertydna_db.py registry-dry-run
python backend/scripts/propertydna_db.py registry-import --confirm-production
python backend/scripts/propertydna_db.py verify
```

Always review `inspect` before `migrate` and `registry-dry-run` before
`registry-import`.

Use `inspect --diagnose` when inspection cannot connect. It emits only a safe
diagnostic category, never the URL, password, host credentials, or raw database
exception.

Diagnostic categories are:

- `SECRET_FILE_MISSING`
- `DATABASE_URL_MISSING`
- `INVALID_DATABASE_URL`
- `DNS_RESOLUTION_FAILED`
- `CONNECTION_TIMEOUT`
- `CONNECTION_REFUSED`
- `SSL_ERROR`
- `AUTHENTICATION_FAILED`
- `DATABASE_NOT_FOUND`
- `ROLE_NOT_FOUND`
- `UNKNOWN_DATABASE_ERROR`

## Safety behavior

- `inspect`, `registry-dry-run`, and registry planning use read-only PostgreSQL
  transactions.
- `migrate` runs only `backend/migrations/0001_flatdna_registry.up.sql` and refuses
  collisions or a target schema other than `public`.
- `registry-import` validates the committed registry, rejects unexpected FlatDNA
  rows, and uses the existing transactional repository upsert.
- Both write commands require `--confirm-production`.
- No down, rollback, delete, truncate, or arbitrary-SQL command exists.
- Database URLs, passwords, and raw connection errors are never printed.
- `verify` checks exact accepted counts, all 14 stable UUIDs, and `SUPPORTED` status.

These commands do not enable `ENABLE_FLAT_DNA` or `VITE_ENABLE_FLAT_DNA` and do not
modify Vercel or Render configuration.

## Catalog migration boundary

`backend/migrations/0002_flatdna_catalog.up.sql` defines the additive catalog
persistence foundation, but it is not enabled in the production operator during
Phase 2. It may be contract-tested locally and applied only to a disposable
PostgreSQL target identified by `FLATDNA_TEST_DATABASE_URL`.

Production migration-chain support remains a Phase 4 deliverable. Before the
operator can apply migration `0002`, Phase 4 must prove ordered migration history,
apply/down/reapply behavior, preservation of the existing 14 reviewed project and
registration UUIDs, atomic publication rollback, and safe handling of partially
migrated environments. Do not run migration `0002` manually against Supabase.
