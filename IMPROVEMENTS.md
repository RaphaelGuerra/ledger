# Improvements Tracker

Purpose: central place to plan, track, and log small, high‑impact upgrades while keeping the app simple and maintainable.

## Status Overview

- Scope: MVP-quality UI with clear logic; focus on maintainability and small, testable pieces.
- Owner: @RaphaelGuerra
- Last Updated: <!-- update when making changes -->

## Backlog (Prioritized)

Architecture & Code Health
- [ ] Feature folders for `ledger` and `entradas` (opt-in) — group components/hooks/logic
- [ ] Extract `Header`, `MonthNav`, `SyncControls` from `App.jsx`
- [x] Shared number/date/stats utilities in `src/lib/`
- [ ] Add selector helpers for month filtering and sorting
- [ ] Add JSDoc typedefs for data models (LedgerItem, EntradaRow)

Tooling
- [ ] Minimal ESLint + Prettier; `npm run lint`, `npm run format`
- [ ] Add `npm run check` (build + lint)
- [ ] Vitest for `src/lib/` tests

Data & Sync
- [ ] Export/Import JSON per month (safety + portability)
- [ ] Add `nanoid` for stable IDs
- [ ] Include timestamp + version in saved payload; document “last write wins”
- [ ] Optional schema validation for API payloads

UX/Print
- [ ] Micro-components: `Toast`, `SummaryCards`, `PrintButton`
- [ ] Small a11y/keyboard polish; ensure focus flows to new rows
- [ ] Document print chunking rules in code and README

## In Progress

- Add selectors, typedefs, lint/format, and lib tests

## Done

- Refactor: shared utils (`number`, `date`, `stats`), docs update

## Decisions

- MVP keeps JS + JSDoc; TypeScript optional later (start with `src/lib/` if needed)
- Prefer pure functions for calculations; UI components stay thin
- CI will run build + lint; component tests deferred until needed

## Progress Log

- YYYY-MM-DD: Created tracker; queued selectors, typedefs, lint+format, and tests

