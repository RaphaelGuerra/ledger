## Cash Ledger - Vison Hotel (Spreadsheet-like)

Single-page React app replicating the provided Excel sheets logic.

### Sections

- Entradas Diarias: per-date Day/Night inputs and automatic totals / media.
- Caixa e Resumo (Unified Ledger): single place for Movimentacao and Despesas with running saldo and overall RESULTADO.

### Run locally

```bash
npm install
npm run dev
```

Environment:

- Optional (for DB validation CI only): create `.env.local` from `.env.example` to run migrations/seeds.

### Sync across browsers (simple)

- Enter a Sync ID in the header. Data for the active month will auto-sync to `/api/storage/<SyncID>/<YYYY-MM>` using Cloudflare KV (Pages Functions).
- No auth: choose a private Sync ID. For privacy, prefer long, unguessable IDs.
- If not configured on your Pages project, the app still works with local-only storage.

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Notes
- Unified ledger supports tabs: Tudo, Movimentacao, Despesas.
- Add/remove lines; saldo and resultados update in real time.
- Read-only (protected) cells are shown with a subtle background.
- Data persists only for the current session (no storage).
  
- Money utilities and Zod schemas enforce balanced transactions.
  
