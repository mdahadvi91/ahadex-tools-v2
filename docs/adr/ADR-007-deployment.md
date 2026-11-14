# ADR-007: Deployment Platform

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** AHADEX Tools maintainers

## Context

The site is a static Vite build. It must serve globally with low
latency, support HTTPS and custom domains, and integrate with GitHub
for CI/CD.

## Decision

Deploy to **Cloudflare Pages** with the following configuration:

- Project name: `ahadex-tools-v2`
- Build command: `npm run build`
- Build output: `dist`
- Node version: 24 (from `.nvmrc`)
- Environment variables: `VITE_SITE_URL=https://ahadex.online`
- Custom domain: `ahadex.online` (+ `www.ahadex.online` 301 to apex)
- Security headers via `public/_headers`
- SPA fallback via Cloudflare built-in (no custom `_redirects` rules)

Auto-deploy triggers on push to `main`. Rollback is instant through
the Cloudflare dashboard.

## Consequences

- **Positive:** Free tier covers this site; edge caching is
  automatic; deploy is < 60 seconds; rollback is one click.
- **Negative:** Vendor-specific `_headers` and `_redirects` format;
  no server-side logic (not needed).
- **Neutral:** CI workflow (`.github/workflows/deploy.yml`) deploys
  via `cloudflare/pages-action`. Requires two GitHub secrets:
  `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

## Alternatives Considered

- **Netlify:** Rejected - slower edge in some regions.
- **Vercel:** Rejected - more expensive at scale; vendor lock-in
  stronger.
- **GitHub Pages:** Rejected - no per-header configuration, no
  atomic rollback.
- **Self-hosted (VPS):** Rejected - operational burden.

## References

- `docs/deployment-guide.md`
- `docs/disaster-recovery.md`
- `.github/workflows/deploy.yml`
- `public/_headers`
