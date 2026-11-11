# ADR-001: Toolchain Version Policy

- **Status:** Accepted
- **Date:** 2026-11-11
- **Deciders:** AHADEX Tools maintainers

## Context

Freeze Baseline v1.0 (2026-11-11) specified Node 24 LTS but did not
pin versions for TypeScript, Vite, React, ESLint, Prettier, Vitest or
Playwright. Version drift has already occurred once: TypeScript 7 was
attempted and failed on Termux because no Android ARM64 binary exists.

Development happens on Termux (Android ARM64). Production builds run
on Cloudflare Pages (Linux x86_64). Both environments must be able to
install, build and type-check this project.

## Decision

Pin the following versions in `package.json`:

| Tool | Version | Rationale |
|---|---|---|
| Node.js | 24.x LTS | `.nvmrc` + `engine-strict=true` |
| npm | 11.x | Bundled with Node 24 |
| TypeScript | 6.0.3 | Termux-compatible; TS 7 has no Android ARM64 binary |
| React | 19.x | Latest stable |
| Vite | latest stable major | Latest security patches |
| ESLint | 9.x | Flat config format |
| Prettier | 3.x | Stable |
| Vitest | latest stable | Latest |
| Playwright | latest stable | Latest |

Patch and minor versions within a pinned major are allowed via `^` or
`~` ranges in `package.json`. Major version upgrades require a new ADR.

## TypeScript Upgrade Path

TypeScript 7 will be adopted only when one of the following is true:

1. Microsoft publishes `@typescript/typescript-android-arm64`.
2. typescript-eslint supports TypeScript 7's API (`peerDependencies`
   no longer contains `<7.0.0`).
3. Development moves off Termux.

Until then, TypeScript 6.0.3 is the required and only supported version.

## Consequences

- `npm ci` in CI reproduces the exact lockfile.
- `.nvmrc` + `engine-strict=true` enforce Node 24 LTS on install.
- Any dependency upgrade crossing a major version requires a new ADR
  with:
  - peer dependency compatibility audit
  - Termux compatibility check (if applicable)
  - build + type-check + test verification
  - rollback plan
- `npm audit` moderate severity findings are tracked but do not block
  releases. Critical and high severity findings block releases.

## Alternatives Considered

- **Unpinned (always `@latest`):** rejected - non-reproducible builds,
  version drift like the TypeScript 7 incident.
- **Exact version pins everywhere:** rejected - friction on patch
  updates, prevents security patches from flowing in automatically.
- **Manual review on every patch bump:** rejected - unsustainable for a
  small team.

## References

- TypeScript 7 release: https://devblogs.microsoft.com/typescript/
  (native compiler; Android ARM64 package not published as of 2026-11)
- typescript-eslint 8 peer range: `typescript >=4.8.4 <6.1.0`
