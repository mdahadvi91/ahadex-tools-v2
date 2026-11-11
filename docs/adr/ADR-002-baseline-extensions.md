# ADR-002: Baseline Extensions

- **Status:** Accepted
- **Date:** 2026-11-11
- **Deciders:** AHADEX Tools maintainers

## Context

Freeze Baseline v1.0 (2026-11-11) declared a fixed file tree. During
implementation, five files were added that the baseline did not name.
Removing them would degrade architecture or break functionality.

## Decision

Add the following files to the baseline. All must be treated as frozen
once committed.

| File | Reason |
|---|---|
| `src/components/ui/IconButton.tsx` | Reusable accessible icon-only button. Header menu/settings buttons require it. |
| `src/components/ui/Sidebar.tsx` | Slide-in drawer with Escape close and backdrop. Replaces Modal for navigation menus; single responsibility. |
| `src/components/ui/icons.tsx` | Centralized inline SVG icons. Keeps Header free of hand-rolled SVG. |
| `src/pages/Tools.tsx` | `/tools` route needs its own page component; the baseline listed only `/tools` navigation but no page file. |
| `src/platform/analytics/adapter.ts` | Provider abstraction. Without it analytics.ts is hard-locked to GA4. Needed for Noop provider in tests and for future provider swaps. |

## Consequences

- Baseline v1.1 includes these five files. Future ADRs may add more,
  but each must be justified by a concrete functional need.
- Shared UI boundaries remain: IconButton, Sidebar, icons are generic;
  no tool-specific logic enters them (see ADR-008).
- The analytics adapter keeps consent, filtering and events in
  analytics.ts; adapters only implement `init`, `track` and `pageView`.

## Alternatives Considered

- **Remove extras to match baseline literally:** rejected because
  Header navigation would break and analytics would be vendor-locked.
- **Edit baseline document without an ADR:** rejected; violates the
  freeze protocol.
