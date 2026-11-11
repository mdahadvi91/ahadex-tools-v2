# Threat Model

Detailed analysis of threats to AHADEX Tools, the assets at risk, and
the mitigations in place. Companion to `security-policy.md`.

## System overview

- **Client:** Vite + React SPA running in the user's browser.
- **Hosting:** Cloudflare Pages (static assets only).
- **No backend:** No server processes any file. No database exists.
- **No accounts:** Users are anonymous. No PII is collected by design.

## Assets

| Asset              | Sensitivity               | Where it lives            |
| ------------------ | ------------------------- | ------------------------- |
| User files         | High (user-owned content) | Browser memory only       |
| Consent preference | Low                       | First-party cookie        |
| Analytics events   | Low (aggregated)          | Third-party (GA4, opt-in) |
| Error reports      | Low (no file content)     | Third-party (opt-in)      |
| Site integrity     | Medium                    | Cloudflare Pages          |

## Threat actors

1. **Curious user** - inspects network tab; must not see file uploads.
2. **Malicious user** - crafts a file to crash or exploit the app.
3. **Supply-chain attacker** - publishes a malicious npm package.
4. **Third-party tracker** - attempts to fingerprint or track users.
5. **Adversarial crawler** - scrapes or floods the site.

## Threats and mitigations

### T1 - User file leaves the device

- **Attack:** App accidentally sends file content to a server.
- **Mitigation:** No `fetch`, `XHR` or `WebSocket` calls include file
  content. Engines run in Web Workers. Verified by reading
  `src/tools/*/engine/*.ts` - no network calls permitted.
- **Validation:** `scripts/tasks/security/validate-sensitive-data-leaks.ts`
  (planned) scans for `fetch` with file blobs.

### T2 - Malicious file crashes the app

- **Attack:** Oversized or malformed file.
- **Mitigation:** `file-policy.ts` enforces size and MIME limits before
  the engine runs. Engines use try/catch around decode.
- **Validation:** `tests/security/malformed-file.test.ts` and
  `oversized-file.test.ts`.

### T3 - Prototype pollution via JSON parse

- **Attack:** File metadata or tool options contain `__proto__` keys.
- **Mitigation:** Options parsed through explicit type guards. No
  `Object.assign` with untrusted input.
- **Validation:** `scripts/tasks/security/validate-prototype-pollution.ts`
  (planned).

### T4 - XSS via filename or metadata

- **Attack:** Filename contains `<script>` or similar.
- **Mitigation:** All filenames rendered through React children (auto
  escaped) or `setTextSafe`. No `innerHTML` with user data.
- **Validation:** `tests/security/malicious-file.test.ts`.

### T5 - Compromised dependency

- **Attack:** A package update ships malware.
- **Mitigation:** `dependency-policy.ts` block list,
  `package-lock.json` committed, `npm audit` in CI with high/critical
  blocking. No packages installed with `--force`.
- **Validation:** `.github/workflows/security.yml` runs `npm audit`
  on every PR.

### T6 - Resource exhaustion (memory/CPU)

- **Attack:** A crafted file triggers an infinite loop or memory bomb
  in the WASM engine.
- **Mitigation:** Engine workers have size limits; WASM memory cap.
  Long operations yield to UI. Browser can terminate the worker.
- **Validation:** `tests/security/memory-exhaustion.test.ts`.

### T7 - Privacy leak via analytics

- **Attack:** File name or content ends up in an analytics payload.
- **Mitigation:** `privacy-filter.ts` strips PII keys. `data-minimization.ts`
  truncates strings. Event schema forbids unknown fields.
- **Validation:** `scripts/tasks/analytics/validate-event-privacy.ts`
  (planned).

### T8 - CSP bypass via inline script

- **Attack:** User submits content that injects `<script>` if CSP is loose.
- **Mitigation:** CSP in `public/_headers` forbids `unsafe-inline` for
  scripts (only styles allowed inline for Tailwind).
- **Validation:** `scripts/tasks/security/validate-csp.ts` (planned).

## Out of scope

- Server-side attacks (there is no server).
- Account takeover (no accounts).
- Payment fraud (no payments).
- Physical attacks on user device.

## Review cadence

Revisit this document:

- When a new tool is added.
- When a new third-party SDK is added.
- Every six months regardless.

## Related documents

- `security-policy.md`
- `privacy-policy-guidelines.md`
