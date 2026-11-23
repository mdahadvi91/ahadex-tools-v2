import { Link } from 'react-router-dom';
import { detectToolCategory, getShortToolName } from '../../lib/tool-display';
import { toolRoutes } from '../../router/route-registry';

interface SidebarSectionLink {
  readonly href: string;
  readonly label: string;
}

const SECTION_LINKS: readonly SidebarSectionLink[] = [
  { href: '#popular-tools', label: 'Popular Tools' },
  { href: '#tools', label: 'All Tools' },
  { href: '#categories', label: 'Categories' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#benefits', label: 'Privacy & Benefits' },
  { href: '#guide', label: 'Processing Guide' },
  { href: '#faq', label: 'FAQ' },
];

export default function Sidebar() {
  const imageTools = toolRoutes.filter((r) => detectToolCategory(r) === 'image');
  const pdfTools = toolRoutes.filter((r) => detectToolCategory(r) === 'pdf');

  return (
    <aside aria-label="Tools and page sections sidebar" className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-24 space-y-6 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
        <div>
          <h2 className="text-xs font-semibold tracking-wide text-slate-500">Quick Navigation</h2>
          <nav aria-label="Homepage sections" className="mt-2.5 space-y-1">
            {SECTION_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-white hover:text-brand-600"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {imageTools.length > 0 && (
          <div className="border-t border-slate-200 pt-4">
            <h2 className="text-xs font-semibold tracking-wide text-slate-500">Image Utilities</h2>
            <ul className="mt-2 space-y-1">
              {imageTools.map((route) => (
                <li key={route.path}>
                  <Link
                    to={route.path}
                    className="block rounded-md px-2.5 py-1.5 text-sm text-slate-700 transition-colors hover:bg-white hover:text-brand-600"
                  >
                    {getShortToolName(route.meta.title)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {pdfTools.length > 0 && (
          <div className="border-t border-slate-200 pt-4">
            <h2 className="text-xs font-semibold tracking-wide text-slate-500">PDF Utilities</h2>
            <ul className="mt-2 space-y-1">
              {pdfTools.map((route) => (
                <li key={route.path}>
                  <Link
                    to={route.path}
                    className="block rounded-md px-2.5 py-1.5 text-sm text-slate-700 transition-colors hover:bg-white hover:text-brand-600"
                  >
                    {getShortToolName(route.meta.title)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-slate-200 pt-4">
          <p className="text-xs leading-relaxed text-slate-600">
            All processing runs locally in your browser. Files never leave your device.
          </p>
          <Link
            to="/privacy-policy/"
            className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline"
          >
            Read Privacy Policy
          </Link>
        </div>
      </div>
    </aside>
  );
}
