/**
 * Terms of Service page.
 */

import { getSiteConfig } from '../config/site';

export default function Terms() {
  const site = getSiteConfig();
  return (
    <main>
      <h1>Terms of Service</h1>
      <p>Last updated: 11 November 2026</p>

      <h2>Acceptance</h2>
      <p>
        By using {site.name}, you agree to these terms. If you do not agree, do not use the service.
      </p>

      <h2>Service description</h2>
      <p>
        {site.name} provides browser-based file tools. All processing runs locally in your browser.
        We do not store, transmit or have access to your files.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You agree not to use {site.name} for unlawful purposes, to process files you do not have the
        right to process, or to attempt to compromise the service.
      </p>

      <h2>No warranty</h2>
      <p>
        The service is provided "as is" without warranty of any kind. We do not guarantee that tools
        will be error-free or fit for any specific purpose.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, {site.name} is not liable for any indirect,
        incidental or consequential damages arising from your use of the service.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. Continued use after changes constitutes acceptance of the updated
        terms.
      </p>
    </main>
  );
}
