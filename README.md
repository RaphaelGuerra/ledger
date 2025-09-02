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

- Create `.env.local` from `.env.example`. Required variables:
  - `VITE_API_URL`: Base URL for backend (e.g., `http://localhost:3000/api`). Used by the header status ping and any future API calls.

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
- Header shows API connectivity (uses `VITE_API_URL`).
