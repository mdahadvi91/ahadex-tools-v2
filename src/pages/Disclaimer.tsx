/**
 * Disclaimer page.
 */

import { getSiteConfig } from '../config/site';

export default function Disclaimer() {
  const site = getSiteConfig();
  return (
    <main>
      <h1>Disclaimer</h1>
      <p>Last updated: 11 November 2026</p>

      <h2>General information</h2>
      <p>
        The tools and information on {site.name} are provided for general informational and utility
        purposes only.
      </p>

      <h2>No professional advice</h2>
      <p>
        Nothing on {site.name} constitutes professional advice of any kind. You are responsible for
        verifying results before relying on them.
      </p>

      <h2>File integrity</h2>
      <p>
        Tools process files locally. We do not verify file contents or guarantee that output files
        are free from data loss. Always keep backups of important files.
      </p>

      <h2>External links</h2>
      <p>
        {site.name} may contain links to external websites. We are not responsible for the content
        or practices of those sites.
      </p>
    </main>
  );
}
