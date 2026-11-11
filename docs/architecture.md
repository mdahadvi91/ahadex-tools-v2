# Architecture

AHADEX Tools is a privacy-first, browser-based file utility site. This
document describes how the codebase is organized and why.

## Design principles

1. **Files never leave the browser.** Every operation runs in memory.
   There is no server-side processing endpoint.
2. **Tool independence.** Each tool owns its SEO, content, engine, assets
   and tests. No cross-tool imports.
3. **Single source of truth.** The tool manifest is the only place that
   describes a tool's route, title, description and launch state.
4. **Strict module boundaries.** Shared UI stays generic. Tool-specific
   logic never enters `src/components/`.

## Directory overview

- `src/main.tsx` - entry point. Validates environment, mounts React.
- `src/App.tsx` - layout wrapper. Renders Header, routes, Footer.
- `src/router/` - route definitions and tool discovery.
- `src/pages/` - static pages (Home, About, Contact, legal pages).
- `src/components/` - shared UI. `ui/` subfolder holds generic primitives.
- `src/tools/` - one folder per tool. Each is a self-contained module.
- `src/config/` - typed configuration (site, navigation, env, budgets).
- `src/platform/` - infrastructure (analytics, security, privacy, SEO,
  performance, observability, utilities).
- `scripts/` - build-time validators and generators.
- `tests/` - shared integration, security, accessibility and performance
  tests. Tool-specific tests live next to each tool.
- `public/` - static assets served as-is.
- `docs/` - architecture and policy documents. ADRs in `docs/adr/`.

## Rendering

The site is a Vite + React single-page application. Client-side routing
handles navigation. Static hosting on Cloudflare Pages. Prerendering for
SEO is planned and gated behind an SSG proof-of-concept (see ADR-003).

## Data flow for a tool

1. User opens a tool route. The route registry discovers the tool via
   `import.meta.glob` over `src/tools/*/index.ts`.
2. The page renders the tool's `Page` component.
3. The user drops files into `Dropzone`. Files are validated by
   `platform/security/file-policy`.
4. The tool's engine runs in a Web Worker. Files never touch the network.
5. The result is returned as a Blob and downloaded via
   `platform/utilities/safe-dom.downloadBlob`.

## Environment

`VITE_SITE_URL` is required in production. The build fails if it is
missing or not a valid https URL without trailing slash. See
`src/config/environment.ts` and the build-time guard in `vite.config.ts`.

## Related documents

- `architecture-decisions.md` - index of all ADRs
- `development-workflow.md` - how work is scheduled and reviewed
- `security-policy.md` - security rules and threat model
- `performance-budgets.md` - build and runtime budgets
- `adsense-readiness.md` - monetization checklist
