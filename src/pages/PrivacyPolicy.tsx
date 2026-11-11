/**
 * Privacy Policy page.
 */

import { getSiteConfig } from '../config/site';

export default function PrivacyPolicy() {
  const site = getSiteConfig();
  return (
    <main>
      <h1>Privacy Policy</h1>
      <p>Last updated: 11 November 2026</p>

      <h2>Your files</h2>
      <p>
        All file processing on {site.name} happens entirely in your browser. Files are never
        uploaded to any server. When you close the tab, your files are gone.
      </p>

      <h2>What we collect</h2>
      <p>
        We collect minimal, aggregated analytics only if you grant consent. Analytics data does not
        include file names, file contents or IP addresses beyond what your browser sends in standard
        HTTP requests.
      </p>

      <h2>Cookies</h2>
      <p>
        We use a single first-party cookie to remember your consent choice. No tracking cookies are
        set without your explicit consent.
      </p>

      <h2>Third parties</h2>
      <p>
        When analytics is enabled, we use Google Analytics 4. When ads are enabled (after AdSense
        approval), Google may set cookies subject to your consent.
      </p>

      <h2>Your rights</h2>
      <p>
        You can change or withdraw consent at any time using the cookie banner controls. You may
        request deletion of any data we hold by contacting us.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:hello@ahadex.online">hello@ahadex.online</a>
      </p>
    </main>
  );
}
