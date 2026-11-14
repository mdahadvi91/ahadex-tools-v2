# ADR-008: Shared UI Boundaries

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** AHADEX Tools maintainers

## Context

The freeze baseline declared `src/components/` as shared UI and
`src/tools/<slug>/` as tool-specific code. Without explicit rules,
tool-specific logic can leak into shared components, breaking the
isolation promise.

## Decision

**Shared UI** (`src/components/` and `src/components/ui/`) must:

- Be generic and reusable across tools and pages.
- Accept props, never read from tool-specific state.
- Never import from `src/tools/` or `src/pages/`.
- Never contain business logic (file processing, SEO logic).
- Be documented with a JSDoc comment explaining when to use it.

**Tool code** (`src/tools/<slug>/`) owns:

- SEO metadata, content, keywords, GEO, schema.
- Engine (compressor, resizer, merger, splitter).
- Page composition and tool-specific components (Hero, Content,
  FAQ, Tool).
- Tests specific to that tool.

**Page code** (`src/pages/`) may import from any layer but must
follow the same routing contract as tools.

## Enforcement

- `scripts/tasks/architecture/validate-import-boundaries.ts` forbids
  `src/components/*` from importing `src/tools/*`.
- `scripts/tasks/architecture/validate-tool-isolation.ts` forbids
  cross-tool imports.
- `scripts/tasks/architecture/validate-module-purity.ts` forbids
  side effects at module load in shared code.

## Consequences

- **Positive:** Tools can be developed, tested and removed without
  touching shared UI; shared components stay useful for future tools.
- **Negative:** Some duplication is accepted when two tools need
  similar logic. Prefer extracting to `src/platform/` over shared UI.
- **Neutral:** `IconButton`, `Sidebar` and `icons` in
  `src/components/ui/` were declared baseline extensions via
  ADR-002; they remain generic.

## Alternatives Considered

- **Merged components and tools:** Rejected - breaks isolation,
  makes removing a tool risky.
- **No rules (trust contributors):** Rejected - rules need
  enforcement to survive scale.

## References

- `docs/architecture.md`
- `docs/adr/ADR-002-baseline-extensions.md`
- `scripts/tasks/architecture/validate-import-boundaries.ts`
- `scripts/tasks/architecture/validate-tool-isolation.ts`
