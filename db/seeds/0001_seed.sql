-- Sample seed: one tenant, one user, minimal accounts and one balanced transaction
BEGIN;

-- Tenant & user
INSERT INTO tenants (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Tenant')
ON CONFLICT DO NOTHING;

INSERT INTO users (id, email, name) VALUES ('00000000-0000-0000-0000-00000000000a', 'demo@example.com', 'Demo User')
ON CONFLICT DO NOTHING;

INSERT INTO memberships (tenant_id, user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'admin')
ON CONFLICT DO NOTHING;

-- Accounts
WITH t AS (
  SELECT id AS tenant_id FROM tenants WHERE id = '00000000-0000-0000-0000-000000000001'
)
INSERT INTO accounts (tenant_id, code, name, type)
SELECT t.tenant_id, v.code, v.name, v.type
FROM t CROSS JOIN (VALUES
  ('1.1.1', 'Cash', 'asset'),
  ('3.1.1', 'Equity', 'equity'),
  ('4.1.1', 'Sales', 'income'),
  ('5.1.1', 'Expenses', 'expense')
) AS v(code, name, type)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- One balanced transaction: receive 100.00 into Cash from Sales
DO $$
DECLARE
  t_id UUID := '00000000-0000-0000-0000-000000000001';
  tx_id UUID;
  acc_cash UUID;
  acc_sales UUID;
BEGIN
  SELECT id INTO acc_cash FROM accounts WHERE tenant_id = t_id AND code = '1.1.1';
  SELECT id INTO acc_sales FROM accounts WHERE tenant_id = t_id AND code = '4.1.1';

  INSERT INTO transactions (tenant_id, tx_date, memo, idempotency_key)
  VALUES (t_id, CURRENT_DATE, 'Seed transaction: sale receipt', 'seed-0001')
  ON CONFLICT (tenant_id, idempotency_key) DO NOTHING
  RETURNING id INTO tx_id;

  IF tx_id IS NOT NULL THEN
    INSERT INTO transaction_lines (tenant_id, transaction_id, account_id, debit_cents, credit_cents)
    VALUES
      (t_id, tx_id, acc_cash, 10000, 0),   -- +R$ 100,00 to Cash
      (t_id, tx_id, acc_sales, 0, 10000);  -- -R$ 100,00 Sales (credit)
  END IF;
END $$;

COMMIT;

