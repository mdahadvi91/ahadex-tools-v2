/**
 * Cookie Policy page.
 */

import { getSiteConfig } from '../config/site';

export default function CookiePolicy() {
  const site = getSiteConfig();
  return (
    <main>
      <h1>Cookie Policy</h1>
      <p>Last updated: 11 November 2026</p>

      <h2>What cookies we use</h2>
      <p>
        {site.name} uses a single first-party cookie to store your consent choices. This cookie is
        required for the site to remember your preferences.
      </p>

      <h2>Analytics cookies</h2>
      <p>
        If you grant analytics consent, Google Analytics 4 may set cookies to measure site usage.
        These are disabled by default and only active after you grant consent.
      </p>

      <h2>Advertising cookies</h2>
      <p>
        If AdSense is enabled and you grant advertising consent, Google may set cookies for ad
        personalization. These are disabled by default.
      </p>

      <h2>Managing your choices</h2>
      <p>
        You can update or withdraw consent at any time using the cookie banner. Clearing site
        cookies will reset your preferences.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:hello@ahadex.online">hello@ahadex.online</a>
      </p>
    </main>
  );
}
