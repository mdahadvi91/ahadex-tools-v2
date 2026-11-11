# Development Workflow

This document defines how work moves from idea to frozen code.

## One section at a time

The project is divided into named sections (paths). A section is
finished only after every file in it is:

1. Implemented.
2. Type-checked (`npm run type-check`).
3. Linted (`npm run lint`).
4. ASCII-only (no Unicode characters in any source file).
5. Committed and pushed.

No work begins on the next section until the current one is complete.

## File lifecycle

Every file follows the same lifecycle:

1. Draft - write the file.
2. Verify - `npm run type-check && npm run lint`.
3. ASCII check - `grep -P '[^\x00-\x7F]' <file>` must return nothing.
4. Commit - one focused commit per file or small group of related files.
5. Push - push to `origin/main` after every commit.

## Commit messages

Use conventional commit prefixes:

- `feat(<scope>): <description>` - new functionality
- `fix(<scope>): <description>` - bug fix
- `chore(<scope>): <description>` - tooling, config
- `docs(<scope>): <description>` - documentation
- `refactor(<scope>): <description>` - internal change, same behavior
- `test(<scope>): <description>` - test additions

## Sections in order

1. Root files
2. `docs/`
3. `public/`
4. `src/` root files (`main.tsx`, `App.tsx`, `index.css`, `vite-env.d.ts`)
5. `src/components/` (Header, Footer, `ui/`)
6. `src/pages/`
7. `src/router/`
8. `src/config/`
9. `src/platform/` (analytics, security, seo, privacy, performance,
   observability, utilities)
10. `src/tools/`
11. `scripts/`
12. `tests/`
13. `.github/`

## Freeze rule

A committed section is frozen. Changing it later requires:

- A new ADR in `docs/adr/`.
- Update to `docs/architecture-decisions.md`.
- Explicit approval recorded in the ADR.

## Code review checklist

Before freezing a section:

- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds (production build)
- [ ] Every file is ASCII-only
- [ ] No `console.log` left in production code (unless intentional logging)
- [ ] Every exported function has a JSDoc comment
- [ ] No hardcoded secrets, URLs, or file paths outside config
- [ ] Each tool has its own manifest, page, engine and tests

## Related documents

- `architecture.md`
- `architecture-decisions.md`
- `release-process.md`
