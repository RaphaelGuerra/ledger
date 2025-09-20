# Improvements Tracker

Purpose: central place to plan, track, and log small, high‑impact upgrades while keeping the app simple and maintainable.

## Status Overview

- Scope: MVP-quality UI with clear logic; focus on maintainability and small, testable pieces.
- Owner: @RaphaelGuerra
- Last Updated: 2025-09-20

## Backlog (Prioritized)

Architecture & Code Health
- [ ] Feature folders for `ledger` and `entradas` (opt-in) — group components/hooks/logic

Tooling
- [ ] Evaluate UI snapshot smoke tests once component extraction stabilizes

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

- Architecture: Feature folders for ledger/entradas (#10) — mapping ownership of shared helpers

## Issue Seeding

- To create GitHub issues for the prioritized backlog, trigger the workflow:
  - Actions → "Seed Improvement Issues" → Run workflow (dry_run=false)
  - It skips already existing issues and creates only missing ones.

## Done

- Architecture: Extracted `Header`, `MonthNav`, `SyncControls` from `App.jsx` to `components/Header.jsx` (#11)
- Architecture: Shared month filtering/sorting selectors in `src/lib/selectors.js`
- Data: Added shared JSDoc typedefs for ledger and entradas rows (`src/types.d.ts`)
- Tooling: Minimal ESLint + Prettier config with `npm run lint` / `npm run format`
- Tooling: Added `npm run check` for build+lint and Vitest coverage for `src/lib/`
- Refactor: shared utils (`number`, `date`, `stats`), docs update

## Decisions

- MVP keeps JS + JSDoc; TypeScript optional later (start with `src/lib/` if needed)
- Prefer pure functions for calculations; UI components stay thin
- CI will run build + lint; component tests deferred until needed

## Progress Log

- 2025-09-20: Wrapped selectors, typedefs, lint/test tooling, and extracted header components; next up feature folders

## Links

- [Architecture: Feature folders for ledger and entradas](https://github.com/RaphaelGuerra/ledger/issues/10) (#10)
- ✅ [Architecture: Extract App header into Header, MonthNav, SyncControls](https://github.com/RaphaelGuerra/ledger/issues/11) (#11)
- [Data: JSON Export/Import per month](https://github.com/RaphaelGuerra/ledger/issues/12) (#12)
- [Data: Use nanoid for stable IDs](https://github.com/RaphaelGuerra/ledger/issues/13) (#13)
- [Sync: Include timestamp/version and enforce last-write-wins](https://github.com/RaphaelGuerra/ledger/issues/14) (#14)
- [API: Validate payload schema on GET/PUT](https://github.com/RaphaelGuerra/ledger/issues/15) (#15)
- [UX: Extract Toast, SummaryCards, PrintButton](https://github.com/RaphaelGuerra/ledger/issues/16) (#16)
- [A11y: Keyboard focus and labels polish](https://github.com/RaphaelGuerra/ledger/issues/17) (#17)
- [Print: Document and centralize chunking rules](https://github.com/RaphaelGuerra/ledger/issues/18) (#18)
