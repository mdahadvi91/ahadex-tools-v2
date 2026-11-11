# ADR-002: Baseline Extensions

- **Status:** Accepted
- **Date:** 2026-11-11
- **Deciders:** AHADEX Tools maintainers

## Context

Freeze Baseline v1.0 (2026-11-11) declared a fixed file tree. During
implementation, files were added that the baseline did not name.
Removing them would degrade architecture or break functionality.

## Decision

Add the following files to the baseline. All are treated as frozen
once committed.

| File                                     | Reason                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `src/components/ui/IconButton.tsx`       | Accessible icon button. Header menu/settings need it.                                                                    |
| `src/components/ui/Sidebar.tsx`          | Slide-in drawer with Escape close.                                                                                       |
| `src/components/ui/icons.tsx`            | Centralized inline SVG icons.                                                                                            |
| `src/pages/Tools.tsx`                    | `/tools` route needs its own page component.                                                                             |
| `src/platform/analytics/adapter.ts`      | Provider abstraction. Prevents vendor lock and enables Noop in tests.                                                    |
| `scripts/orchestrators/_group-runner.ts` | Shared runner for 17 group orchestrators. Without it, 17 identical 20-line files would need to be maintained separately. |

## Consequences

- Baseline v1.2 includes these files.
- Future ADRs may add more, but each must be justified by a concrete
  functional need.
- Shared UI boundaries remain: IconButton, Sidebar, icons stay generic.
- The analytics adapter keeps consent, filtering and events in
  analytics.ts; adapters only implement `init`, `track`, `pageView`.
- The group runner keeps every orchestrator to a 5-line wrapper and
  centralizes log, report, and exit-code logic.

## Alternatives Considered

- **Remove extras to match baseline literally:** rejected because
  Header navigation would break, analytics would be vendor-locked, and
  group orchestrators would duplicate logic 17 times.
- **Edit baseline document without an ADR:** rejected; violates the
  freeze protocol.
