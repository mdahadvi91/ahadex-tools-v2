/**
 * About page.
 */

import { getSiteConfig } from '../config/site';

export default function About() {
  const site = getSiteConfig();
  return (
    <main>
      <h1>About {site.name}</h1>
      <p>{site.description}</p>
      <h2>How it works</h2>
      <p>
        All tools run entirely in your browser. Files are never uploaded to a server. Your data
        stays on your device.
      </p>
      <h2>Why we built this</h2>
      <p>
        Most online file tools require uploading your files to remote servers.
        {site.name} takes a different approach: processing happens locally, so your files never
        leave your device.
      </p>
    </main>
  );
}
