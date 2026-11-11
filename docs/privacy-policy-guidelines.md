# Privacy Policy Guidelines

Rules for writing the published Privacy Policy page and for handling
user data anywhere in the app.

## Core principles

1. **Data minimization.** Collect nothing that is not required to
   operate the tool.
2. **No file content collection.** Files never leave the browser.
3. **Consent-first.** Analytics and ads load only after explicit
   consent.
4. **Plain language.** The policy must be readable without a lawyer.
5. **Verifiable.** Every claim in the policy must be provable from
   source code or network inspection.

## Data categories

See `src/platform/security/privacy-policy.ts` for the canonical list.

| Category         | Collected? | Retention | Purpose                  |
| ---------------- | ---------- | --------- | ------------------------ |
| File content     | Never      | None      | N/A                      |
| Consent choice   | Yes        | 365 days  | Remember your preference |
| Analytics events | Opt-in     | 90 days   | Measure usage            |
| Error reports    | Opt-in     | 30 days   | Diagnose crashes         |

## What the policy must say

- **Files** are processed locally and never uploaded.
- **Cookies** are used only for consent and (opt-in) analytics.
- **Third parties** are named: Google Analytics 4, Google AdSense.
- **Rights** are listed: withdraw consent, delete data, contact.
- **Contact** address is real and monitored.

## What the policy must not say

- Vague claims like "we care about your privacy" without specifics.
- False claims like "we do not collect any data" (analytics is data).
- Legal jargon that obscures meaning.
- Claims that cannot be verified from source code.

## Consent Mode v2

When analytics or ads are enabled, use Google Consent Mode v2 with
`analytics_storage` and `ad_storage` gated by our consent-manager.
The initial page load sends `consent: denied` until the user accepts.

## Accessibility

The policy page must:

- Have a clear heading structure (h1, h2, h3).
- Use semantic HTML (`<section>`, `<article>`).
- Meet WCAG AA color contrast.
- Be navigable by keyboard.
- Declare a language attribute on `<html>`.

## Update process

When data handling changes:

1. Update `src/platform/security/privacy-policy.ts`.
2. Update `src/pages/PrivacyPolicy.tsx`.
3. Update `src/pages/CookiePolicy.tsx` if cookies change.
4. Add a "last updated" date change.
5. Commit all changes together.

## Related documents

- `security-policy.md`
- `threat-model.md`
- `adsense-readiness.md`
