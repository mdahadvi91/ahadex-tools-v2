/**
 * Image Resizer page. Composes breadcrumbs, hero, interactive wizard,
 * detailed informational content, related tools, and JSON-LD structured data.
 */

import Breadcrumbs from '../../components/layout/Breadcrumbs';
import AdSlot from '../../components/monetization/AdSlot';
import RelatedTools from '../../components/sections/RelatedTools';
import ShareToolCard from '../../components/tools/ShareToolCard';
import { getEnvironment } from '../../config/environment';
import { HERO as CONTENT_HERO } from './content';
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
    <div className="bg-[#faf8f5]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs />
      <Hero />
      <Wizard />
      <AdSlot slot="tool-below-workspace" />
      <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        <Content />
      </div>
      <div className="mx-auto max-w-6xl space-y-10 px-4 pb-16 sm:px-6">
        <ShareToolCard
          title={CONTENT_HERO.h1}
          path={manifest.path}
          summary={manifest.description}
        />
        <RelatedTools currentPath={manifest.path} />
      </div>
    </div>
  );
}
