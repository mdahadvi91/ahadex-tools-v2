# ADR-003: Static Rendering Strategy

- **Status:** Accepted (SPA); SSG deferred to POC
- **Date:** 2026-11-15
- **Deciders:** AHADEX Tools maintainers

## Context

The site must be indexable by Google and social crawlers, which
do not execute JavaScript reliably. Two rendering strategies were
considered: an SPA with client-side routing, or a pre-rendered SSG
build.

Freeze Baseline v1.0 specified that "Static rendering for SEO is
planned and gated behind an SSG proof-of-concept (see ADR-003)."

## Decision

**For v1.0, ship as an SPA on Cloudflare Pages**, with the following
mitigations:

1. `robots.txt` and `sitemap.xml` are generated at build time and
   serve real static content.
2. Per-route metadata (title, description, canonical) is applied
   client-side by the route layer using `src/platform/seo/metadata.ts`.
3. The `<html>` element carries `data-prerender-ready="false"` so
   validators can detect SPA mode.
4. Cloudflare Pages serves `index.html` for all routes via the
   built-in SPA fallback.

**POC plan:** Before adding Arabic content or launching AdSense,
test a Vite-compatible SSG integration (likely `vite-plugin-ssr` /
Vike). The POC must verify:

- React Router dynamic routes prerender correctly
- Per-route metadata is present in static HTML
- Web Workers resolve in production build
- Hydration errors are zero
- No regression to bundle size budget

**Fallback:** Astro migration if SSG POC fails. This was rejected
for v1.0 to avoid rewriting the existing Vite + React setup.

## Consequences

- **Positive:** Fast client-side navigation, SPA-typical DX, no SSG
  build complexity for v1.0.
- **Negative:** SEO relies on client-side metadata injection, which
  Google renders but social crawlers may not. Social previews may
  be generic until SSG.
- **Neutral:** Validators (`validate-prerender.ts`,
  `validate-route-output.ts`) explicitly support both modes; when
  SSG POC succeeds, they flip `data-prerender-ready` to `"true"`.

## Alternatives Considered

- **Astro from start:** Rejected - full rewrite, slower time-to-launch.
- **Next.js:** Rejected - different stack, harder Termux dev workflow.
- **Custom prerender generator:** Rejected - maintenance burden; use
  a maintained tool instead.

## References

- `docs/architecture.md`
- `docs/deployment-guide.md`
- `src/router/routes.tsx`
- `scripts/tasks/production/validate-prerender.ts`
