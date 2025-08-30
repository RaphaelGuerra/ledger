# Ledger Evolution Plan

This document outlines a phased roadmap to transform the current BRL-only ledger prototype into a multi-tenant, auditable, production-grade web application. The plan assumes migration from the existing Vite React scaffold to a **Next.js App Router** base with an Edge/Node runtime split.

## Core Design Decisions
- Amounts stored as **BIGINT centavos**.
- Rates/percentages stored as **DECIMAL(9,6)** and rounded half-even to cents.
- Enforce **double-entry invariant**: `SUM(debit) == SUM(credit)` per transaction.
- Edge runtime for cacheable reads/analytics; Node runtime for DB I/O & writes.
- Validation with shared **Zod schemas**.
- All writes are **idempotent** (unique key per request).
- **PostgreSQL with Row Level Security** for multi-tenancy.
- UI built with **Tailwind** + lightweight component layer (btn, btn-primary, chip, card, glass, shimmer, grain).
- Reporting via server-side **PDF generation** (streaming where possible).

---

## Phase 0 – Foundations & Money Types
### Goals
- Lock monetary semantics.
- Unify schemas and improve developer experience.

### Tasks
- **Money utilities**:
  - `toCentavos(brlString)`
  - `fromCentavos(i64)`
  - `applyRate(amountCents, rateDecimal, rounding='bankers')`
- **Shared Zod schemas**:
  - `Account`
  - `TxLine { accountId, debitCents: bigint, creditCents: bigint }`
  - `TransactionCreate { idempotencyKey, date: 'YYYY-MM-DD', memo?, lines[] }`
- **Fetch wrapper** with JSON handling, `AbortController`, timeout, retry (exponential backoff + jitter).
- **Env schema loader**, `.env.example`, and one-command dev script.

### Code Snippet
```ts
export function toCentavos(brl: string): bigint {
  // Parse 'R$ 10,50' → 1050n
}

export const TxLine = z.object({
  accountId: z.string(),
  debitCents: z.bigint().nonnegative(),
  creditCents: z.bigint().nonnegative(),
});
```

### Acceptance Criteria
- Unit tests for conversions and rounding.
- Unbalanced posting test fails.
- CI runs lint, type-check, and tests.

### Risks
- Incorrect rounding rules could propagate errors.
- Shared types must remain in sync between client and server.

### Runbook
- `npm install`
- `npm run dev` for local development.

---

## Phase 1 – Data Model & Migrations (Postgres)
### Goals
- Create normalized schema with invariants and indexes.

### Tasks
- DDL tables and migrations:
  - `tenants`, `users`, `memberships`, `accounts`, `transactions`, `transaction_lines`, `audit_log`.
- Add indexes `(tenant_id, tx_date DESC)`, `(tenant_id, account_id)`, `(tenant_id, created_at DESC)`.
- Seed script to populate chart of accounts and sample balanced transactions.

### Code Snippet
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants,
  code TEXT,
  name TEXT,
  type TEXT,
  active BOOLEAN DEFAULT true,
  UNIQUE (tenant_id, code)
);
```

### Acceptance Criteria
- Migrations apply cleanly.
- Constraints enforce non-negative debit/credit and no zero lines.
- Seed script produces balanced transactions.

### Risks
- Migration ordering errors causing downtime.
- RLS misconfiguration may expose data.

### Runbook
- `npm run db:migrate`
- `npm run db:seed`

---

## Phase 2 – API Surface (Node writes, Edge reads)
### Goals
- Typed, validated endpoints with idempotency and keyset pagination.

### Tasks
- `POST /api/transactions` (Node): validate with Zod, check balance, transactional insert, audit log.
- `GET /api/transactions` (Node): filters, keyset pagination on `(tx_date, id)`.
- `GET /api/accounts` (Node): list/create/deactivate with role checks.
- `GET /api/analytics/snapshot` (Edge): summaries for today/MTD/YTD, cache 15–60s with tag invalidation.

### Code Snippet
```ts
export async function POST(req: Request) {
  const body = TransactionCreate.parse(await req.json());
  // Insert transaction & lines inside a DB transaction
}
```

### Acceptance Criteria
- Contract tests for endpoints.
- Repeating POST with same idempotency key returns same transaction.
- Pagination stable across inserts.

### Risks
- Improper idempotency may cause duplicates.
- Keyset pagination must handle concurrent inserts.

### Runbook
- `npm run dev` to exercise API routes.
- Use `curl` or Postman for manual testing.

---

## Phase 3 – Auth, Tenancy, Security
### Goals
- Isolate tenants and enforce roles while securing inputs and headers.

### Tasks
- Integrate authentication provider (NextAuth/Clerk/Auth0) → session `{ tenantId, userId, role }`.
- Enable **RLS**; set `app.user_id/app.tenant_id` per request; policies on accounts, transactions, lines, audit.
- Middleware: role guards, body size clamp, IP/user rate limits, basic WAF rules.
- Security headers: CSP, HSTS, COOP/COEP, CSRF for state-changing form posts.

### Acceptance Criteria
- Cross-tenant access blocked.
- Rate limits return HTTP 429.
- Secrets not exposed to client.

### Risks
- Misconfigured RLS allowing data leaks.
- Auth provider lock-in or cost.

### Runbook
- Rotate API keys via provider dashboard.
- Review RLS policies quarterly.

---

## Phase 4 – UI & UX (Tailwind + Components)
### Goals
- Fast, accessible surfaces for daily input and review.

### Tasks
- Adopt `globals.css` with component classes (`btn`, `btn-primary`, `chip`, `card`, `glass`, `shimmer`, `grain`).
- Transactions view using **TanStack Table** + virtualization; filters, inline edit or drawer, CSV export.
- Forms with **React Hook Form** + Zod; inline errors; "post & continue" flow; currency mask → centavos.
- Accessibility: semantic tables, labels, keyboard navigation.

### Acceptance Criteria
- 10k-row table scrolls smoothly.
- Lighthouse accessibility score ≥ 90.
- Form inputs validated client/server.

### Risks
- Large datasets may still cause rendering jank.
- Accessibility regressions during UI changes.

### Runbook
- `npm run build && npm run preview` to test production bundle.

---

## Phase 5 – Reporting (PDF)
### Goals
- Reliable PDF statements and summaries.

### Tasks
- Server-side PDF generation behind `/api/reports/*` (Node) using `@react-pdf/renderer`, `Puppeteer`, or `PDFKit`.
- Templates: Trial Balance, General Ledger (by account/date range), Journal.
- Streaming responses; optional S3 upload with signed URLs.

### Acceptance Criteria
- PDFs generated under load.
- Totals match DB queries.
- Snapshot links expire correctly.

### Risks
- Headless browser dependencies may bloat serverless bundles.
- Large reports could exceed function memory limits.

### Runbook
- Monitor `/tmp` space during PDF generation.
- Rotate S3 credentials regularly.

---

## Phase 6 – Observability & SLOs
### Goals
- Visibility into correctness and latency; alerting.

### Tasks
- Structured logs (request id, tenant, actor, route, latency, status) with redaction.
- Metrics: req/s, p50/p95 latency, DB time, error rate; integrate Sentry for error tracking.
- Alerts: error budget burn, saturation, slow queries.

### Acceptance Criteria
- Dashboards live with real-time data.
- Synthetic test failure triggers alert.
- Slow query identified and indexed.

### Risks
- Excessive logging can impact performance.
- Alert fatigue from noisy thresholds.

### Runbook
- Review dashboards weekly.
- Archive logs older than 30 days.

---

## Phase 7 – Hardening & Ops
### Goals
- Safe deploys, backups, resilience.

### Tasks
- CI: type/lint/test gates; migration check; preview deploys.
- Backups & PITR; restore runbook; seed & smoke tests.
- Chaos drills: simulate DB/queue/edge failures; verify graceful degradation & idempotent recovery.

### Acceptance Criteria
- Backup restore validated regularly.
- CI pipeline green.
- Induced failure handled without unbalanced postings.

### Risks
- Backup strategy may not meet RPO/RTO.
- Chaos drills could impact production if misconfigured.

### Runbook
- Monthly restore rehearsal using latest backup.
- Post-mortem template for incident reviews.

---

## Hosting Guidance
- **Primary choice**: Vercel for Next.js app with region aligned to the PostgreSQL provider (e.g., Vercel Postgres, Supabase, or RDS in the same region).
- **Alternative**: Fly.io or AWS for combined app + DB deployment; ensure low-latency connectivity between Node runtime and database.

---

## Checklists
### Stability
- Monetary amounts stored as BIGINT centavos; no floats.
- Unbalanced transactions rejected atomically; invariant tested.
- Idempotent writes with `(tenant_id, idempotency_key)` unique.
- Input sizes clamped; outbound timeouts & retries.

### Scalability
- Read/write split (Edge vs Node).
- Keyset pagination for listings.
- Proper indexes; no N+1 queries.
- Caching for snapshots/analytics.

### Security
- AuthN/AuthZ enforced; roles mapped to routes.
- Tenant isolation via RLS or strict app checks.
- Secrets not shipped to client; CSP/HSTS/CSRF configured.

### DX & Ops
- Shared Zod types; one-command dev.
- Tests (unit/contract/e2e smoke).
- Structured logs + metrics + alerts.
- `.env.example`, seed data, runbooks.

---

## Minimal Runbooks
- **Local Setup**: `npm install`, `npm run dev`.
- **Lint**: `npm run lint`.
- **Database Migration**: `npm run db:migrate` (after adding migration scripts).
- **Deployment**: `git push` triggers CI and deployment (configured in later phases).
