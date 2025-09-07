# Contributing & Release Process

This repo is now in beta. Stability and review quality matter more than speed. Do not push directly to `main` unless explicitly requested by the client.

## Branching Model

- Base branches:
  - `main`: Always releasable. Protected. Only updated via approved release PRs.
  - `develop`: Integration branch for day-to-day work. All feature PRs target `develop`.
- Working branches (from `develop`):
  - `feat/<short-scope>` for new features
  - `fix/<short-scope>` for bug fixes
  - `chore/<short-scope>` for maintenance, docs, CI, etc.

## Workflow

1. Create a branch from `develop` using the appropriate prefix.
2. Implement changes with small, focused commits.
3. Add/adjust tests as needed. If no tests are present yet, include manual test steps in the PR and consider adding Vitest/RTL (see "Testing").
4. Open a PR into `develop`. The PR must:
   - Pass CI (install + build at minimum for now)
   - Include a clear summary, scope, and testing instructions
   - Update docs if behavior/UX changes
5. After review and CI pass, squash-merge into `develop`.
6. Release: open a "Release PR" from `develop` into `main` with version bump and changelog. Merge only with explicit client approval.

## Testing

- Short term: Document manual QA steps in the PR and attach screenshots when UI changes are involved.
- Medium term (recommended): Add automated tests using Vitest + React Testing Library.
  - Example scripts to add later:
    - `test`: run unit/component tests
    - `test:watch`: watch mode
    - `coverage`: run tests with coverage
  - CI will be expanded to run tests once added.

## Code Style

- Keep PRs small and scoped to one concern.
- Favor clarity over cleverness. Add brief in-code comments where intent isn’t obvious.
- If introducing dependencies, justify them in the PR description.

## Versioning & Changelog

- Use semver in `package.json`.
- For releases, propose a version bump and include a brief changelog in the Release PR.

## Branch Protection (to enable in Git hosting)

Ask a repo admin to enable the following protections on `main` and `develop`:

- Require pull request before merging
- Require status checks to pass (CI build)
- Restrict who can push (no direct pushes)
- Optionally require reviews (1+)

## Local Commands (reference)

```bash
# start work
git checkout develop
git pull
git checkout -b feat/<short-scope>

# push your branch
git push -u origin feat/<short-scope>

# open a PR to develop; after merge, for release
git checkout develop && git pull
git checkout -b release/<x.y.z>
# bump version and prepare notes, then open PR develop -> main
```

