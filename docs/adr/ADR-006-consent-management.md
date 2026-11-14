# ADR-006: Consent Management

- **Status:** Accepted (policy); provider deferred
- **Date:** 2026-11-15
- **Deciders:** AHADEX Tools maintainers

## Context

The site runs analytics (GA4) and will run AdSense. Both require
informed consent in the EU, UK and California. Google requires a
Google-certified CMP for EEA traffic.

## Decision

**Policy:** no third-party script runs before consent. Analytics
and ads each have their own consent flag:

- `analytics` - GA4, aggregate usage events
- `ads` - AdSense, personalization signals

Consent is stored in a single first-party cookie (`ahx_consent`)
managed by `src/platform/privacy/consent-manager.ts`. The runtime
enforces gating via `isGranted('analytics')` and `isGranted('ads')`
before any third-party call.

**Provider:** a Google-certified CMP (OneTrust, Cookiebot, Termly or
Osano) is required before AdSense activation. Selection is deferred;
the consent-manager interface is stable and the CMP will plug into
it.

**Consent Mode v2:** when GA4 loads, it initializes with
`consent: denied` until the user grants. This is enforced by the
adapter in `src/platform/analytics/adapter.ts`.

## Consequences

- **Positive:** Privacy by default; passes GDPR / CPRA baseline;
  ready for AdSense CMP requirement.
- **Negative:** No analytics until the user grants, so traffic
  metrics undercount.
- **Neutral:** Validators check that no third-party domain is
  referenced outside consent-gated code.

## Alternatives Considered

- **Soft consent (opt-out):** Rejected - non-compliant in EU.
- **Server-side anonymization:** Rejected - no server in this project.
- **Skip analytics entirely:** Rejected - need data to improve the
  product.

## References

- `src/platform/privacy/consent-manager.ts`
- `src/platform/privacy/cookie-manager.ts`
- `docs/privacy-policy-guidelines.md`
- `docs/adsense-readiness.md`
