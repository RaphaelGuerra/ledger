Database migrations and seeds (Phase 1)

Overview
- Target: PostgreSQL 14+
- Schema: multi-tenant ledger with double-entry enforcement via trigger.

Apply migrations
- Using psql:
  - `psql "$DATABASE_URL" -f db/migrations/0001_init.sql`

Seed sample data
- Using psql:
  - `psql "$DATABASE_URL" -f db/seeds/0001_seed.sql`

Notes
- Enforces transaction balance with a deferred constraint trigger; a transaction is valid only if `SUM(debit_cents) == SUM(credit_cents)` across its lines.
- Primary keys are UUIDs; `pgcrypto` extension is enabled for `gen_random_uuid()`.
- Indexes added for common queries: `(tenant_id, tx_date DESC)`, `(tenant_id, created_at DESC)`, and `(tenant_id, account_id)`.

