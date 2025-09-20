# Future Plans

## Print: Lançamentos Multi‑Page Continuation (Issue #19)

- Goal: When there are more than 32 lançamentos in a month, continue rendering additional columns/rows on a new page instead of truncating, while keeping the layout compact and readable.
- Next Steps:
  - Capture overflow examples (33+ lançamentos) to compare before/after layout changes.
  - Prototype second-page rendering keeping the existing 4×8 grid and controlled page breaks.
  - Validate saldo behavior (continuous vs. per-chunk) with stakeholders before coding the final approach.
- Current: We chunk lançamentos into up to 4 side‑by‑side tables with 8 rows each (max 32 rows shown); if more, a note indicates truncated count.
- Options:
  - Continue with additional rows on the next page using a second grid of up to 4 tables; insert a controlled page break before the second grid.
  - Recompute saldo per chunk (column) vs. keep global saldo (current behavior). Global saldo is consistent across the month but can look discontinuous between chunks; per‑chunk saldo restarts at 0 each chunk.
  - Repeat table headers on each additional grid for clarity.
- Acceptance Criteria:
  - Up to 32 rows fit on page 1 in at most 4 tables (8 rows each).
  - Rows 33+ render on page 2 (and beyond) with the same 4×8 pattern.
  - Page breaks do not split a row; headers are visible at the top of each table.
  - Sorting remains chronological left‑to‑right then top‑to‑bottom.
- Open Questions:
  - Keep saldo continuous across pages or restart per page/column?
  - Should we display a “continued…” footer/header between pages?

Code references: `src/components/PrintSheet.jsx` (lancChunks, print‑grid‑2/3/4 rendering) and `src/App.css` (print styles).

## Entradas: Auto‑Fill Missing Dates on Add (Issue #20)

- Goal: When adding a new Entradas date, automatically insert any missing dates prior to the new last date so the month has no gaps.
- Next Steps:
  - Audit current `EntradasDiarias` helpers to list pure utilities vs. UI-specific logic before introducing auto-fill.
  - Outline algorithm for inserting missing rows so it can be unit-tested independently of the component.
  - Confirm UX copy for any helper messaging when multiple rows are added automatically.
- Current:
  - “Adicionar Data” appends the next day after the latest visible date within the active month.
  - “Preencher Mês” fills all remaining days until month end upon request.
- Proposal:
  - On “Adicionar Data”, detect gaps within the existing set of dates for the active month and insert any missing intermediate days up to the `nextDate` being added.
  - Keep behavior within the active month only; do not cross months.
- Acceptance Criteria:
  - If the current month has dates 01, 03, 05 and the user taps “Adicionar Data”, the app creates 02, 04, and 06 (assuming 06 is the nextDate) to fill gaps.
  - Adding when there are no gaps only inserts a single next day.
  - Never creates dates beyond the last day of the active month.
  - Undo/Remove continues to work per row as today.
- Edge Cases:
  - Months with no rows yet (start at `YYYY‑MM‑01`).
  - Mixed empty rows and populated rows; preserve user‑entered data.
  - Locale and disabled state (respect `addDisabled`).

Code references: `src/components/EntradasDiarias.jsx` (visibleRows, addDateRow, fillMonth).

