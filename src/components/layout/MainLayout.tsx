import type { ReactNode } from 'react';
import AdSenseManager from '../monetization/AdSenseManager';
import ToastContainer from '../ui/Toast';
import CookieConsentBanner from './CookieConsentBanner';
import Footer from './Footer';
import Header from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5] text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
      <ToastContainer />
      <CookieConsentBanner />
      <AdSenseManager />
    </div>
  );
}
