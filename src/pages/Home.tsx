import Sidebar from '../components/layout/Sidebar';
import AdSlot from '../components/monetization/AdSlot';
import AllToolsSection from '../components/sections/AllToolsSection';
import BenefitsSection from '../components/sections/BenefitsSection';
import FAQSection from '../components/sections/FAQSection';
import HeroSection from '../components/sections/HeroSection';
import HowItWorks from '../components/sections/HowItWorks';
import PopularTools from '../components/sections/PopularTools';
import RelatedTools from '../components/sections/RelatedTools';
import SEOArticle from '../components/sections/SEOArticle';
import ToolCategories from '../components/sections/ToolCategories';
import ShareToolCard from '../components/tools/ShareToolCard';
import { getEnvironment } from '../config/environment';
import { getShortToolName } from '../lib/tool-display';
import { toolRoutes } from '../router/route-registry';

export default function Home() {
  const env = getEnvironment();
  const origin =
    env.siteUrl && env.siteUrl.startsWith('http')
      ? env.siteUrl.replace(/\/+$/, '')
      : 'https://ahadex.online';

  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: `${origin}/`,
        name: 'AHADEX Tools',
        inLanguage: 'en',
        publisher: { '@id': `${origin}/#organization` },
        description:
          'Privacy-first browser-based image and document utilities with zero server uploads.',
      },
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: 'AHADEX Tools',
        url: `${origin}/`,
        logo: `${origin}/logo.svg`,
        sameAs: ['https://github.com/mdahadvi91/ahadex-tools-v2'],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'contact@ahadex.online',
          availableLanguage: ['English'],
        },
      },
      {
        '@type': 'ItemList',
        name: 'AHADEX Free Browser Tools',
        numberOfItems: toolRoutes.length,
        itemListElement: toolRoutes.map((route, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: getShortToolName(route.meta.title),
          url: `${origin}${route.path}`,
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <HeroSection />
      <div className="mx-auto flex max-w-7xl items-start gap-10 px-4 py-12 sm:px-6">
        <Sidebar />
        <div className="min-w-0 flex-1 space-y-12">
          <PopularTools />
          <AllToolsSection />
          <ToolCategories />
          <AdSlot slot="home-mid" />
          <HowItWorks />
          <BenefitsSection />
          <SEOArticle />
          <ShareToolCard
            title="AHADEX Tools"
            path="/"
            summary="Free browser-based image and PDF tools with zero server uploads."
          />
          <RelatedTools />
          <FAQSection />
        </div>
      </div>
    </>
  );
}
