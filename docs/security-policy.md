# Security Policy

This document defines the security rules that apply to every commit,
dependency and deployment of AHADEX Tools.

## Threat model summary

AHADEX Tools is a client-only application. There is no server that
receives files, no user accounts and no database. The main threats are:

1. **Malicious input files** - crafted images or PDFs that crash the
   browser or exploit the processing engine.
2. **Supply-chain attacks** - compromised npm dependencies.
3. **XSS via tool output** - malicious file names or content rendered
   without escaping.
4. **Privacy leaks** - accidental analytics or error reports that
   include file contents or user identifiers.
5. **CSRF-free by design** - no authenticated endpoints exist, so CSRF
   is not applicable.

See `threat-model.md` for the detailed analysis.

## File handling rules

Every file that enters the app passes through
`src/platform/security/file-policy.ts` before any engine sees it:

- Size limit enforced (25 MB image, 100 MB PDF).
- MIME type checked against the allow list in
  `src/platform/security/security-config.ts`.
- Extension checked against the allow list.
- Filename sanitized by `sanitizeFilename` to strip path separators
  and control characters.
- Batch total size and count limits enforced for multi-file operations.

Engines must not read a file until `validateSingleFile` or
`validateBatch` returns `ok: true`.

## Rendering rules

- No `innerHTML` with user-controlled content.
- No `dangerouslySetInnerHTML` unless the content is trusted static HTML
  built at compile time.
- All text rendered through `textContent` or React children.
- `src/platform/utilities/safe-dom.ts` provides the only sanctioned
  helpers for creating elements and downloading blobs.

## Dependency rules

See `src/platform/security/dependency-policy.ts` for the allow list of
licenses and the block list of compromised packages.

At every dependency update:

- Run `npm audit`.
- `critical` and `high` advisories block the update.
- `moderate` advisories are tracked in the next release notes.
- `low` advisories are informational.

## Secrets

- No secrets in the repository.
- No secrets in `VITE_*` environment variables (they ship to the browser).
- Any secret must live in a Cloudflare environment variable that is
  not prefixed with `VITE_`.

## Content Security Policy

The baseline CSP in `src/platform/security/content-security.ts` is
applied at build time via `public/_headers`. Strict CSP with nonces
is planned; until then the policy is strict but does not use nonces.

## Reporting a vulnerability

Email hello@ahadex.online with:

- Affected URL or tool
- Reproduction steps
- Observed vs expected behavior
- Optional proof of concept

We aim to respond within 72 hours.

## Related documents

- `threat-model.md`
- `privacy-policy-guidelines.md`
- `adsense-readiness.md`
