# Contributing & Release Process (Simplified)

Two branches only:

- `main`: stable, client-facing. Protected. Merge via PR only.
- `develop`: default working branch. Push directly here for day-to-day work.

## Workflow

1. Do all work on `develop`. Small, focused commits are encouraged.
2. Optional: open short-lived branches if you want, but not required.
3. When ready for a stable cut, open a PR from `develop` → `main`.
4. Merge to `main` only with explicit client approval.

## CI

- CI runs on pushes to `develop` and PRs targeting `main`.
- Current CI: install + build via Vite. Tests can be added later.

## Testing

- Short term: Describe manual QA steps (commands, what to click, expected results) in PRs to `main`.
- Medium term (optional): Add Vitest + React Testing Library; we can expand CI to run tests.

## Branch Protection (Git hosting)

- Set default branch to `develop`.
- Protect `main`: require PR and passing CI; restrict direct pushes.
- Leave `develop` unprotected for fast iteration (recommended).

## Reference Commands

```bash
# Work on develop
git checkout develop
git pull
# commit and push directly to develop

# Prepare release PR
gh pr create -B main -H develop -t "Release: vX.Y.Z" -b "Notes"
```
