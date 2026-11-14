# ADR-004: Web Worker Processing

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** AHADEX Tools maintainers

## Context

File processing (image decode, resize, re-encode) is CPU-intensive.
Running it on the main thread blocks the UI: scrolls stutter, clicks
delay, and the browser appears frozen for large images.

## Decision

All heavy file processing runs in a **Web Worker**, using Vite's
`?worker` import suffix to bundle the worker as a separate chunk.

The engine module (`engine/index.ts`) wraps the Worker in a
Promise-based API:

- `createEngine()` returns an instance.
- `engine.compress(input)` posts a message and returns a Promise.
- `engine.dispose()` terminates the Worker and rejects pending calls.

The worker file (`engine/worker.ts`) is a dedicated module that
handles `compress`, `ping`, and future message kinds. It has no
network access, no DOM, no storage.

## Consequences

- **Positive:** UI stays responsive; bundle splits so the worker loads
  only on tool pages; engine logic is testable in isolation.
- **Negative:** Message passing adds serialization cost (structured
  clone). Large ArrayBuffers are transferred, not copied, via
  `Transferable` when supported.
- **Neutral:** Validators check that every `createEngine()` has a
  matching `dispose()` and that worker files have a message handler.

## Alternatives Considered

- **Main thread with `requestIdleCallback`:** Rejected - still blocks
  during idle windows; poor UX for large files.
- **WASM on main thread:** Rejected - same blocking issue.
- **Service worker:** Rejected - service workers are for caching,
  not CPU work.

## References

- `src/tools/image-compressor/engine/worker.ts`
- `src/tools/image-compressor/engine/index.ts`
- `scripts/tasks/production/validate-worker-lifecycle.ts`
