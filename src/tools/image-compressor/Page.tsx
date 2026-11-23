/**
 * Image Compressor page. Composes breadcrumbs, hero, interactive wizard,
 * detailed informational content, related tools, and JSON-LD structured data.
 */

import Breadcrumbs from '../../components/layout/Breadcrumbs';
import RelatedTools from '../../components/sections/RelatedTools';
import { getEnvironment } from '../../config/environment';
import Content from './Content';
import Hero from './Hero';
import { manifest } from './manifest';
import { buildSchema } from './schema';
import Wizard from './Wizard';

export default function Page() {
  const env = getEnvironment();
  const origin =
    env.siteUrl && env.siteUrl.startsWith('http')
      ? env.siteUrl.replace(/\/+$/, '')
      : 'https://ahadex.online';
  const jsonLd = buildSchema(origin);

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs />
      <Hero />
      <Wizard />
      <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        <Content />
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <RelatedTools currentPath={manifest.path} />
      </div>
    </div>
  );
}
