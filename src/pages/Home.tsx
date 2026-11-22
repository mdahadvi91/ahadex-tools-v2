import HeroSection from '../components/sections/HeroSection';
import PopularTools from '../components/sections/PopularTools';
import ToolCategories from '../components/sections/ToolCategories';
import BenefitsSection from '../components/sections/BenefitsSection';
import HowItWorks from '../components/sections/HowItWorks';
import SEOArticle from '../components/sections/SEOArticle';
import FAQSection from '../components/sections/FAQSection';

export default function Home() {
  return (
    <>
      <HeroSection />
      <PopularTools />
      <ToolCategories />
      <BenefitsSection />
      <HowItWorks />
      <SEOArticle />
      <FAQSection />
    </>
  );
}
