## Cash Ledger - Vison Hotel (MVP)

Single-page React app — minimal, fast, and focused on the workflow.

### Sections

- Entradas Diarias: per-date Day/Night inputs and automatic totals/media.
- Caixa e Resumo: Movimentação/Despesas together with running saldo and overall RESULTADO.

### Run locally

```bash
npm install
npm run dev
```

Environment:

- No env needed. Optional: configure Cloudflare Pages KV binding `LEDGER` for cross-browser sync.

### Sync across browsers (simple)

- Enter a Sync ID in the header. Data for the active month will auto-sync to `/api/storage/<SyncID>/<YYYY-MM>` using Cloudflare KV (Pages Functions).
- No auth: choose a private Sync ID. For privacy, prefer long, unguessable IDs.
- If not configured on your Pages project, the app still works with local-only storage.

### Build

```bash
npm run build
```

### Notes
-- Add/remove lines; saldo and resultados update in real time.
-- Read-only (protected) cells are shown with a subtle background.
-- Data persists locally per month; optional cross-browser sync using Sync ID (Cloudflare KV).
