# Deployment Guide

How to deploy AHADEX Tools to Cloudflare Pages.

## Prerequisites

- Cloudflare account with the `ahadex.online` zone.
- GitHub repository connected to Cloudflare Pages.
- Node 24 LTS in CI (matches `.nvmrc`).
- `VITE_SITE_URL` set as a Cloudflare environment variable.

## Build settings (Cloudflare Pages)

| Setting                | Value                                 |
| ---------------------- | ------------------------------------- |
| Framework preset       | None                                  |
| Build command          | `npm run build`                       |
| Build output directory | `dist`                                |
| Node version           | 24                                    |
| Environment variables  | `VITE_SITE_URL=https://ahadex.online` |

## Deployment pipeline

1. Push to `main`.
2. GitHub Actions `.github/workflows/ci.yml` runs:
   - Install (with lockfile).
   - Type check.
   - Lint.
   - Build.
   - Unit and integration tests.
3. On success, Cloudflare Pages auto-deploys from `dist/`.
4. Deployment URL appears in GitHub commit status.

## DNS and domain

- Cloudflare Pages custom domain: `ahadex.online`.
- Redirect `www.ahadex.online` to `ahadex.online` (301).
- Force HTTPS is enabled.
- HSTS is set via `public/_headers`.

## Caching

Defined in `public/_headers`:

- `/assets/*` - 1 year immutable (hashed filenames).
- `/images/*` - 1 day.
- `/index.html` - must-revalidate.

## Rollback

To roll back a deployment:

1. Open Cloudflare Pages dashboard.
2. Go to "Deployments".
3. Find the last good deployment.
4. Click "Rollback to this deployment".

Rollback is instant - the previous build is always retained.

## Health check after deploy

- `/` returns 200 with the correct HTML.
- `/tools` returns 200.
- `/sitemap.xml` is reachable (once sitemap generation exists).
- `/robots.txt` is reachable.
- `/favicon.ico` is reachable.
- No CSP violations in the browser console.

## Rollback triggers

- CI failed on the last deploy.
- A runtime error appears in the error reporter within 15 minutes.
- Core Web Vitals regress on the first page load.

## Related documents

- `release-process.md`
- `disaster-recovery.md`
- `security-policy.md`
