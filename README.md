# AHADEX Tools

Privacy-first, browser-based file tools. Files are processed in the browser
and are never uploaded to a server.

Site: https://ahadex.online

## Status

Early setup. Root configuration only. No application code yet.

Planned first tools: Image Compressor, Image Resizer, Merge PDF.

## Requirements

- Node.js 24 (see `.nvmrc`)
- npm 11

`engine-strict=true` is set in `.npmrc`, so `npm install` fails on any
other Node version.

## Scripts

Defined in `package.json`. They work only after dependencies are installed.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run type-check` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |
| `npm test` | Run unit tests once |
| `npm run test:watch` | Run tests in watch mode |

## Environment

Copy `.env.example` to `.env`. Every `VITE_` variable is bundled into
public JavaScript, so never put secrets in them.

## Development rules

- One section at a time. A section is finished only after its files are
  implemented, validated and tested.
- No folder or file is removed, renamed or moved without approval.
- Structural changes need a new ADR and explicit approval.
- Every validator must perform a real check. A script name alone does not
  count as an implementation.
