-- Phase 1 – Data Model & Migrations (Postgres)
-- Creates core tables, indexes, and a balance constraint trigger.

BEGIN;

-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tenants and users
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memberships (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

-- Chart of accounts
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset','liability','equity','income','expense')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

-- Transactions (headers)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tx_date DATE NOT NULL,
  memo TEXT,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key)
);

-- Transaction lines (postings)
CREATE TABLE IF NOT EXISTS transaction_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id),
  debit_cents BIGINT NOT NULL CHECK (debit_cents >= 0),
  credit_cents BIGINT NOT NULL CHECK (credit_cents >= 0),
  CHECK (NOT (debit_cents > 0 AND credit_cents > 0)),
  CHECK (debit_cents <> 0 OR credit_cents <> 0)
);

-- Balance enforcement: sum(debit) == sum(credit) per transaction
CREATE OR REPLACE FUNCTION enforce_transaction_balance() RETURNS TRIGGER AS $$
DECLARE
  d BIGINT;
  c BIGINT;
BEGIN
  SELECT COALESCE(SUM(debit_cents),0), COALESCE(SUM(credit_cents),0)
    INTO d, c
  FROM transaction_lines tl
  WHERE tl.transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id);

  IF d <> c THEN
    RAISE EXCEPTION 'transaction % not balanced: debit=% credit=%', COALESCE(NEW.transaction_id, OLD.transaction_id), d, c;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_tx_balance ON transaction_lines;
CREATE CONSTRAINT TRIGGER trg_enforce_tx_balance
AFTER INSERT OR UPDATE OR DELETE ON transaction_lines
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_transaction_balance();

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  diff JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tx_tenant_date ON transactions (tenant_id, tx_date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_tenant_created ON transactions (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lines_tenant_account ON transaction_lines (tenant_id, account_id);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_created ON audit_log (tenant_id, created_at DESC);

COMMIT;

