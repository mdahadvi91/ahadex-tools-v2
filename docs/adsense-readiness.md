# AdSense Readiness

Checklist and rules for enabling Google AdSense. Do not enable ads
until every item here is complete.

## Pre-application checklist

- [ ] Privacy Policy page is live and links to Google's Privacy Policy.
- [ ] Cookie Policy page is live and describes ad cookies.
- [ ] Terms of Service page is live.
- [ ] A certified Consent Management Platform (CMP) is integrated.
- [ ] Consent Mode v2 is configured with `ad_storage` gated by CMP.
- [ ] Site loads over HTTPS with valid certificate.
- [ ] Site is indexed by Google (Search Console verified).
- [ ] At least 15 pages of substantive, original content.
- [ ] Every tool page has "How to use" and FAQ sections.
- [ ] No pages are placeholders or "coming soon".
- [ ] No autoplay video with sound.
- [ ] No adult, violent, or copyright-infringing content.
- [ ] Contact page includes a real email address.

## CMP requirement

Google requires a Google-certified CMP for EEA/UK traffic. Choose one
from Google's certified list. The consent manager
(`src/platform/privacy/consent-manager.ts`) must gate:

- `ad_storage`
- `ad_user_data`
- `ad_personalization`

Analytics consent is separate (`analytics_storage`).

## Ad placement rules

Approved placements:

- Between the hero and the tool widget.
- After the "How it works" section.
- After the FAQ section.

Prohibited placements:

- Above the first heading on a mobile page.
- Between a tool's input and output.
- Overlapping the download button.
- Autoplay or interstitial ads.
- More than 3 ad units per page.

The planned validator `scripts/tasks/adsense/validate-ad-placement.ts`
enforces these rules.

## Ad labeling

Every ad unit must be clearly labeled:

- "Advertisement" or "Sponsored" above the unit.
- Visually distinct from content.
- Never disguised as a download button or navigation link.

## ads.txt

Once the publisher ID is issued:

- Create `public/ads.txt` with the exact line from AdSense.
- Verify at `https://ahadex.online/ads.txt`.
- The planned validator `scripts/tasks/adsense/validate-ads-txt.ts`
  checks this file's format.

Before the publisher ID exists, do not create `ads.txt`.

## Content policy

AdSense rejects sites with:

- Copied content.
- Thin content (placeholder pages).
- Misleading navigation.
- Excessive ads.
- Broken tools.

Every tool must be functional before AdSense application.

## Related documents

- `privacy-policy-guidelines.md`
- `content-guidelines.md`
- `security-policy.md`
