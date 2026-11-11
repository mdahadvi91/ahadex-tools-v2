# Performance Budgets

Build and runtime performance limits. Values are enforced by code in
`src/config/performance-budgets.ts`.

## Build budgets

Measured on `npm run build` output (gzip sizes):

| Metric | Budget | Rationale |
|---|---|---|
| Initial JS | 200 KB | Under 3s load on 3G |
| Initial total | 500 KB | Includes CSS, fonts, HTML |
| Any single asset | 200 KB | Avoids one big chunk |
| Initial chunks | 5 | Fewer HTTP requests |

If a build exceeds any budget, it must be optimized before commit. The
validator `scripts/tasks/performance/validate-bundle-size.ts` (planned)
blocks the build when exceeded.

## Runtime budgets (Core Web Vitals)

Measured in real user browsers via `platform/performance/web-vitals.ts`:

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| LCP | < 2.5s | 2.5-4.0s | > 4.0s |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |
| INP | < 200ms | 200-500ms | > 500ms |
| TTFB | < 800ms | 800-1800ms | > 1800ms |

Ratings are computed in `src/platform/performance/web-vitals.ts` and
reported via `performance-monitor.ts`.

## Third-party budget

Any third-party script (analytics, ads) counts against the total.

- Analytics (GA4): max 45 KB.
- Ads (AdSense): max 150 KB, loaded only after ad consent.
- No other third-party scripts without an ADR.

The planned validator `scripts/tasks/performance/validate-third-party-budget.ts`
checks this.

## Lazy loading

- Below-the-fold images: `loading="lazy"`.
- Route-level code splitting via `React.lazy`.
- Heavy tools loaded only on their route.
- No synchronous loading of non-critical scripts.

The planned validator `scripts/tasks/performance/validate-lazy-loading.ts`
checks for missing lazy attributes.

## Font loading

- Self-host fonts in `public/fonts/`.
- Use `font-display: swap`.
- Preload the primary font weight only.
- No Google Fonts CDN (privacy + third-party budget).

## Measurement

- Local: `npm run build` + `npx vite-bundle-visualizer`.
- Production: Vercel Analytics or Cloudflare Web Analytics (future).
- CI: Lighthouse CI via `.github/workflows/lighthouse.yml`.

## Related documents

- `architecture.md`
- `seo-strategy.md`
