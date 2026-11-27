import { Link } from 'react-router-dom';
import { detectToolCategory, detectToolVisualKind, getShortToolName } from '../../lib/tool-display';
import { toolRoutes } from '../../router/route-registry';
import ToolVectorIcon from '../tools/ToolVectorIcon';

interface SidebarSectionLink {
  readonly href: string;
  readonly label: string;
}

const SECTION_LINKS: readonly SidebarSectionLink[] = [
  { href: '#tools', label: 'All Tools' },
  { href: '#popular-tools', label: 'Popular Tools' },
  { href: '#categories', label: 'Categories' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#benefits', label: 'Privacy & Benefits' },
  { href: '#guide', label: 'Processing Guide' },
  { href: '#faq', label: 'FAQ' },
];

export default function Sidebar() {
  const imageTools = toolRoutes.filter((r) => detectToolCategory(r) === 'image');
  const pdfTools = toolRoutes.filter((r) => detectToolCategory(r) === 'pdf');
  const documentTools = toolRoutes.filter((r) => detectToolCategory(r) === 'document');

  return (
    <aside aria-label="Tools and page sections sidebar" className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-24 space-y-5 rounded-xl border border-[#e6e2d8] bg-white p-4 shadow-xs">
        {imageTools.length > 0 && (
          <div>
            <h2 className="px-2 text-xs font-semibold tracking-wide text-slate-600">
              Image Utilities
            </h2>
            <ul className="mt-2 space-y-1">
              {imageTools.map((route) => (
                <li key={route.path}>
                  <Link
                    to={route.path}
                    className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-[#faf8f5] hover:text-brand-600"
                  >
                    <ToolVectorIcon kind={detectToolVisualKind(route)} size="xs" />
                    <span className="truncate">{getShortToolName(route.meta.title)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {pdfTools.length > 0 && (
          <div className="border-t border-[#e6e2d8] pt-4">
            <h2 className="px-2 text-xs font-semibold tracking-wide text-slate-600">
              PDF Utilities
            </h2>
            <ul className="mt-2 space-y-1">
              {pdfTools.map((route) => (
                <li key={route.path}>
                  <Link
                    to={route.path}
                    className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-[#faf8f5] hover:text-brand-600"
                  >
                    <ToolVectorIcon kind={detectToolVisualKind(route)} size="xs" />
                    <span className="truncate">{getShortToolName(route.meta.title)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {documentTools.length > 0 && (
          <div className="border-t border-[#e6e2d8] pt-4">
            <h2 className="px-2 text-xs font-semibold tracking-wide text-slate-600">
              CV &amp; Documents
            </h2>
            <ul className="mt-2 space-y-1">
              {documentTools.map((route) => (
                <li key={route.path}>
                  <Link
                    to={route.path}
                    className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-[#faf8f5] hover:text-brand-600"
                  >
                    <ToolVectorIcon kind={detectToolVisualKind(route)} size="xs" />
                    <span className="truncate">{getShortToolName(route.meta.title)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-[#e6e2d8] pt-4">
          <h2 className="px-2 text-xs font-semibold tracking-wide text-slate-600">On This Page</h2>
          <nav aria-label="Homepage sections" className="mt-2 space-y-0.5">
            {SECTION_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-[#faf8f5] hover:text-brand-600"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="border-t border-[#e6e2d8] px-2 pt-4">
          <p className="text-xs leading-relaxed text-slate-600">
            All processing runs locally in browser memory. Zero files leave your device.
          </p>
          <Link
            to="/privacy-policy/"
            className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:underline"
          >
            Read Privacy Policy
          </Link>
        </div>
      </div>
    </aside>
  );
}
