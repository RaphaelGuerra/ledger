## Cash Ledger - Vison Hotel (Spreadsheet-like)

Single-page React app replicating the provided Excel sheets logic. Sections:

- Entradas Diarias: per-date Day/Night inputs and automatic totals / media.
- Entradas - Resumo: Movimentacao (Credito - Debito) and Despesas with running Saldo.
- Caixa: running ledger with protected Saldo cells.

### Run locally

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

### Notes
- All calculations are client-side and update in real-time.
- Read-only (protected) cells are shown with a subtle gray background.
- Data persists only for the current session (no storage).
