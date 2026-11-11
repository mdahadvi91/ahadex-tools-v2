/**
 * Contact page. Static contact information only (no form backend).
 */

import { getSiteConfig } from '../config/site';

export default function Contact() {
  const site = getSiteConfig();
  return (
    <main>
      <h1>Contact</h1>
      <p>Questions, feedback, or bug reports are welcome.</p>
      <h2>Email</h2>
      <p>
        <a href="mailto:hello@ahadex.online">hello@ahadex.online</a>
      </p>
      <h2>About your data</h2>
      <p>
        {site.name} does not accept file uploads. If you send a message,
        include only the information you wish to share.
      </p>
    </main>
  );
}
