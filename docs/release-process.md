# Release Process

How a change goes from local development to production.

## Versioning

Semantic Versioning (MAJOR.MINOR.PATCH) in `package.json`.

- MAJOR: breaking change or route removal
- MINOR: new tool, new page, new feature
- PATCH: bug fix, content, performance

Pre-1.0.0 (`0.x.y`) is pre-launch. Switch to `1.0.0` when the first
tool goes live.

## Branching

- `main` - always deployable. Protected.
- `feat/<scope>` - one per section
- `hotfix/<description>` - for production bugs

## Commit flow

1. Create branch from `main`.
2. Implement in focused commits.
3. Push branch, open PR.
4. CI runs: type-check, lint, build, tests.
5. Review and approve.
6. Squash-merge into `main`.
7. Cloudflare Pages auto-deploys.

## Pre-release checklist

- Type-check passes
- Lint passes
- Production build succeeds
- Tests pass (once tests exist)
- ASCII check passes on all changed files
- No new secrets, tokens or PII
- Version bumped in `package.json` if releasing a milestone
- `README.md` updated if user-facing behavior changed

## Release tagging

After merge:
Tags are annotated. No lightweight tags.

## Post-deploy verification

Within 5 minutes of deploy:

- `/` returns 200
- `/tools` returns 200
- `/sitemap.xml` returns 200
- `/robots.txt` returns 200
- No CSP violations in console
- No JS errors in the error reporter
- Lighthouse scores within budget (see performance-budgets.md)

## Hotfix process

For critical production bugs:

1. Branch from `main` (not from the feature branch).
2. Fix the bug, add a regression test.
3. Bump PATCH version.
4. Open PR, fast-track review.
5. Merge, tag, deploy.
6. Announce on the contact email if user-visible.

## Rolling back a release

See deployment-guide.md - Cloudflare Pages supports instant rollback
to any previous deployment.

## Related documents

- deployment-guide.md
- disaster-recovery.md
- development-workflow.md
