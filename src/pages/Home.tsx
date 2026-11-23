import Sidebar from '../components/layout/Sidebar';
import AllToolsSection from '../components/sections/AllToolsSection';
import BenefitsSection from '../components/sections/BenefitsSection';
import FAQSection from '../components/sections/FAQSection';
import HeroSection from '../components/sections/HeroSection';
import HowItWorks from '../components/sections/HowItWorks';
import PopularTools from '../components/sections/PopularTools';
import RelatedTools from '../components/sections/RelatedTools';
import SEOArticle from '../components/sections/SEOArticle';
import ToolCategories from '../components/sections/ToolCategories';
import { getEnvironment } from '../config/environment';

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
        description:
          'Privacy-first browser-based image and document utilities with zero server uploads.',
      },
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: 'AHADEX Tools',
        url: `${origin}/`,
        logo: `${origin}/logo.svg`,
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
          <HowItWorks />
          <BenefitsSection />
          <SEOArticle />
          <RelatedTools />
          <FAQSection />
        </div>
      </div>
    </>
  );
}
