import { Link } from 'react-router-dom';
import { getShortToolName } from '../../lib/tool-display';
import { openConsentPreferences } from '../../platform/consent';
import { toolRoutes } from '../../router/route-registry';

const LEGAL_LINKS = [
  { to: '/about/', label: 'About Us' },
  { to: '/contact/', label: 'Contact Us' },
  { to: '/privacy-policy/', label: 'Privacy Policy' },
  { to: '/terms/', label: 'Terms of Service' },
  { to: '/disclaimer/', label: 'Disclaimer' },
  { to: '/cookie-policy/', label: 'Cookie Policy' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link to="/" className="font-display text-base font-bold text-slate-900 no-underline">
              AHADEX Tools
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600">
              Privacy-first browser utilities. Every image and PDF operation runs locally on your
              device with zero server uploads.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-wide text-slate-900">Tools</h2>
            <ul className="mt-3 space-y-2">
              {toolRoutes.map((route) => (
                <li key={route.path}>
                  <Link
                    to={route.path}
                    className="text-sm text-slate-600 hover:text-brand-600 hover:underline"
                  >
                    {getShortToolName(route.meta.title)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-wide text-slate-900">
              Company &amp; Legal
            </h2>
            <ul className="mt-3 space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-600 hover:text-brand-600 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => openConsentPreferences()}
                  className="text-sm text-slate-600 hover:text-brand-600 hover:underline"
                >
                  Privacy &amp; Cookie Settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>© {year} AHADEX Tools. All rights reserved.</p>
          <p>Client-side processing · Zero server file storage</p>
        </div>
      </div>
    </footer>
  );
}
