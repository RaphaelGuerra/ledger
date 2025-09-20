# Cash Ledger (Resumo de Caixa)

A lightweight React (Vite) web app for monthly cash summaries used by Vison Hotel. It supports fast data entry, clean print layouts, and optional cloud sync per month via Cloudflare Pages Functions + KV.

## Features
- Fast monthly workflow: daily entries, ledger summary, and totals.
- Print‑ready view: compact single‑page layout with clear tables and cards.
- Optional sync: enter a Sync ID to persist month data to Cloudflare KV; otherwise, data stays in your browser (localStorage).
- Simple, dependency‑light stack: React, Vite, ESLint, Prettier, Vitest.

## Quick Start
- Prerequisites: Node 20.x (use `nvm use 20`). The repo includes `.nvmrc` and `.node-version`.
- Install: `npm ci`
- Dev server: `npm run dev` (Vite on http://localhost:5173)
- Build: `npm run build` (outputs to `dist/`)
- Preview build: `npm run preview`

## Scripts
- `dev`: start Vite dev server
- `build`: create production build into `dist/`
- `preview`: preview the `dist/` build locally
- `lint`: run ESLint (warnings are not allowed)
- `format`: apply Prettier formatting
- `test`: run unit tests once (Vitest)
- `test:watch`: run tests in watch mode

## Tech Stack
- React 19 + Vite
- Testing: Vitest (`vitest.config.js`), optional HTML/text coverage
- Linting/Formatting: ESLint (flat config) + Prettier

## Architecture Overview
- `src/App.jsx`: top‑level state and orchestration
  - Controls active month, sync state, printing, and orchestrates sections
- `src/components/`
  - `Header.jsx`: brand, month navigation, print, Sync ID controls
  - `Ledger.jsx`: ledger editor (summary rows)
  - `EntradasDiarias.jsx`: daily entries editor
  - `PrintSheet.jsx`: print‑optimized layout
- `src/lib/`
  - `date.js`, `number.js`, `selectors.js`, `stats.js`: helpers and calculations
  - `entradas.js`: determines missing dates to add per month
  - `store.js`: localStorage and remote sync helpers

## Data & Sync
- Local persistence: `localStorage`, keyed by month (e.g., `ledger.v1.data.2025-09`).
- Sync ID: stored locally (key `ledger.v1.syncId`). Entering a non‑empty ID enables remote sync.
- Remote persistence: Cloudflare Pages Function with a KV namespace binding `LEDGER`.
  - GET `/api/storage/:user/:month` → JSON or `null`
  - PUT `/api/storage/:user/:month` with JSON body → `204 No Content` on success

Example month payload
```json
{
  "entradasRows": [
    { "date": "2025-09-01", "diarias": 0, "cozinha": 0, "bar": 0, "outros": 0 }
  ],
  "ledgerItems": [
    { "label": "Cartão", "valor": 0 }
  ]
}
```

## Deployment
This app is a static site, plus an optional Pages Function.

Cloudflare Pages (recommended)
- Build command: `npm ci && npm run build`
- Build output directory: `dist`
- Functions directory: `functions` (auto‑detected by Pages)
- KV binding: create a Pages KV namespace (e.g., `ledger-kv`) and bind it as `LEDGER`
  - Pages Project → Settings → Functions → KV namespaces → Add binding
  - Variable name: `LEDGER`
- Connect to GitHub and trigger deploys from `main` (or your chosen branch)

Other static hosts
- You can deploy `dist/` anywhere. The sync feature requires the Cloudflare function (or your own compatible endpoint) at `/api/storage/:user/:month`.

## Production
- Live app: https://YOUR-PRODUCTION-URL (replace with your domain)
- Branch: `main` (auto‑deploy on push)
- Health checks: ensure the home page loads and printing works.
- Sync: with a valid KV binding, entering a Sync ID should load/save month data.

## Screenshots
- App view: add a screenshot of the main ledger and daily entries.
- Print preview: add a screenshot or PDF of the print layout.


## Development Notes
- Node version: use `nvm use 20` for a consistent local environment.
- Large assets: the logo is optimized (`src/assets/logo.webp`). Prefer WebP for images.
- Printing: use the “Imprimir” button in the header, or the browser’s print dialog. The app switches to a print‑optimized layout automatically.

## Testing & Quality
- Unit tests: `npm test` (Vitest).
- Coverage: enabled (text + HTML). Reports generate in `coverage/`.
- Linting: `npm run lint` (ESLint v9 flat config). Formatting via `npm run format` (Prettier).

## Troubleshooting
- Sync shows “erro”: verify that your Pages Function is deployed and that the KV binding `LEDGER` exists and is accessible.
- Node engine warning: use `nvm use 20`; engines are set to `>=20` to avoid warnings on newer Node, but CI/deploy should stick to Node 20.
- Local data: clearing the browser’s site data will remove locally stored months and the Sync ID.

## License
No license file is provided. All rights reserved unless stated otherwise.
