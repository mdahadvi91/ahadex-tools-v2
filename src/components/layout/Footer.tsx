import { Link } from 'react-router-dom';
import { toolRoutes } from '../../router/route-registry';

const LEGAL_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/disclaimer', label: 'Disclaimer' },
  { to: '/cookie-policy', label: 'Cookie Policy' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-600">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">AHADEX Tools</p>
            <p className="mt-2 text-xs text-slate-500">
              100% browser-based file processing. Your files never leave your device — all
              compression and conversion happens locally in your browser.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">Tools</p>
            <ul className="mt-3 space-y-1.5">
              {toolRoutes.map((route) => (
                <li key={route.path}>
                  <Link to={route.path} className="text-xs hover:text-slate-900 hover:underline">
                    {route.meta.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">Company</p>
            <ul className="mt-3 space-y-1.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-xs hover:text-slate-900 hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6 text-center">
          <p className="text-xs text-slate-500">
            © {year} AHADEX. All rights reserved. Built with privacy in mind.
          </p>
        </div>
      </div>
    </footer>
  );
}
