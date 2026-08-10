# Database environments

## Architecture decision

PropertyDNA is one application with two domain modules:

```text
PropertyDNA
  PlotDNA
  FlatDNA
```

There is one authoritative persistent database: the existing Supabase PostgreSQL
project. PlotDNA and FlatDNA must use that same project. FlatDNA adds reviewed
`flat_*` objects to the existing database; it does not have a second production
database.

Hosting responsibilities are separate from database ownership:

- Vercel hosts the frontend and must not receive PostgreSQL credentials.
- Render hosts the FastAPI backend.
- Supabase hosts the persistent application PostgreSQL database and its REST API.
- Neon project `plotdna-flatdna-test` is disposable PostgreSQL test infrastructure
  only. It is not a runtime dependency and must not be configured on Render or
  Vercel.

## Environment variable roles

| Variable | Role | Allowed environments |
| --- | --- | --- |
| `DATABASE_URL` | Canonical server-side PostgreSQL connection for the application. FlatDNA already reads this through `settings.DATABASE_URL`. In production it must point to the shared Supabase project. | Render production; explicitly configured local development; approved migration operations |
| `SUPABASE_URL` | Supabase HTTP API project URL used by the narrow brochure/score writer. It must identify the same Supabase project as `DATABASE_URL`; it is not a second database. | Render production; explicitly configured local development |
| `SUPABASE_KEY` | Server-side Supabase API credential paired with `SUPABASE_URL`. Never expose it to the frontend or commit it. | Render production; explicitly configured local development |
| `FLATDNA_TEST_DATABASE_URL` | Disposable PostgreSQL target for FlatDNA integration and migration apply/down/reapply tests. Tests may destroy objects in this database. | Local/CI test processes only |
| `FLATDNA_PRODUCTION_DATABASE_URL` | Redundant operator variable. Runtime code does not read it. Do not add it to application settings or deployment configuration. | Transitional operator use only; retire after `DATABASE_URL` is verified on Render and in operational commands |
| `ENTITLEMENTS_DB_PATH` | Optional path for the current local-first SQLite entitlement/payment store. It is not a FlatDNA datastore or the target persistent architecture. | Local development and the existing transitional runtime only |
| `ANALYTICS_EVENTS_PATH` | Optional path for the current JSONL analytics store. | Local/transitional runtime only |
| `CUSTOM_REPORT_LEADS_PATH` | Optional path for the current JSONL report-lead store. | Local/transitional runtime only |

`SUPABASE_URL`/`SUPABASE_KEY` use the Supabase HTTP API, while `DATABASE_URL` uses
PostgreSQL directly. Two access methods do not imply two production databases.

## Production

- Render owns backend runtime secrets.
- `DATABASE_URL` points to the existing PropertyDNA/PlotDNA/FlatDNA Supabase
  PostgreSQL project.
- `SUPABASE_URL` and `SUPABASE_KEY`, when configured, point to that same project.
- FlatDNA remains disabled until its production-readiness checks, additive migration,
  and registry import are separately approved.
- Never configure `FLATDNA_TEST_DATABASE_URL` or the Neon test project on Render.
- Never run the down migration against persistent Supabase production.

## Local development

- Keep database variables blank by default and keep FlatDNA disabled.
- Use a local/disposable PostgreSQL target for database work whenever possible.
- Connect to shared Supabase only for an explicitly intended task, with the minimum
  required privilege and a read-only session for inspection.
- Store secrets only in ignored local environment files or the hosting provider's
  secret manager. Do not commit `.env` files or paste credentials into documentation,
  commands, logs, test fixtures, or frontend variables.

The SQLite entitlement/payment store and JSONL analytics/lead stores are existing
MVP persistence paths. They are not alternatives for FlatDNA and are not the final
authoritative persistence architecture. Moving them into Supabase requires a separate
reviewed schema/data-migration task; this architecture cleanup does not change them.

## Integration and migration testing

- Set `FLATDNA_TEST_DATABASE_URL` only to a disposable PostgreSQL database.
- The Neon project `plotdna-flatdna-test` may be used for these tests.
- Migration apply/down/reapply, destructive constraint checks, and cleanup proofs run
  only against this disposable target.
- Tests create isolated schemas and must leave no test objects behind.
- Application runtime, import scripts, and deployed services must never fall back to
  Neon.

## Runtime rule

FlatDNA runtime uses `DATABASE_URL`, exactly like any other backend code that needs a
direct PostgreSQL connection. `FLATDNA_TEST_DATABASE_URL` remains test-only.
`FLATDNA_PRODUCTION_DATABASE_URL` is not part of the final architecture.

Before retiring `FLATDNA_PRODUCTION_DATABASE_URL`, verify without exposing values
that Render's `DATABASE_URL` reaches the intended Supabase project, confirm the
production search path and migration target schema, and update any private operator
automation that still names the redundant variable.

Before deleting `plotdna-flatdna-test`, confirm no CI/local workflow still depends on
it, provision another disposable PostgreSQL target if the integration suite still
needs one, run the full FlatDNA PostgreSQL suite against that replacement, and remove
the old Neon credentials from local/CI secret stores.
