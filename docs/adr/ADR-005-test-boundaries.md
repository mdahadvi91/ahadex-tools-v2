# ADR-005: Test Boundaries

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** AHADEX Tools maintainers

## Context

The freeze baseline declared per-tool tests (`src/tools/<slug>/tests/`)
and central tests (`tests/`). Without clear rules, contributors may
duplicate tests or miss coverage.

## Decision

Tests are split into four layers:

1. **Per-tool tests** (`src/tools/<slug>/tests/`) - unit, integration,
   security, and performance tests specific to that tool's engine and
   content. A tool test cannot import from another tool.

2. **Central integration tests** (`tests/integration/`) - cross-cutting
   contracts: routing, metadata, tool registry, analytics, error
   isolation. May import from any tool.

3. **Central E2E tests** (`tests/e2e/`) - user flows in a real browser
   via Playwright. Test files are `.spec.ts`, not `.test.ts`.

4. **Central security / accessibility / performance tests**
   (`tests/security/`, `tests/accessibility/`, `tests/performance/`) -
   cross-tool concerns that apply to every tool.

**Rule:** if a test can fail when only one tool changes, it belongs to
that tool. If it can fail when multiple tools change, it belongs in
`tests/`.

## Consequences

- **Positive:** Clear ownership, no duplicate tests, fast per-tool runs.
- **Negative:** Contributors must know which layer to add a test to.
- **Neutral:** `vitest.config.ts` includes all four layers; Playwright
  runs only `tests/e2e` and `tests/accessibility/*.spec.ts`.

## Alternatives Considered

- **Single `tests/` folder:** Rejected - loses tool isolation and
  makes per-tool tests hard to find.
- **Only per-tool tests:** Rejected - cross-cutting concerns (routing,
  metadata) have no home.

## References

- `vitest.config.ts`
- `playwright.config.ts`
- `src/tools/image-compressor/tests/`
- `tests/integration/`
