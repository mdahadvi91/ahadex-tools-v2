import { Link, NavLink } from 'react-router-dom';
import { detectToolCategory, detectToolVisualKind, getShortToolName } from '../../lib/tool-display';
import { toolRoutes } from '../../router/route-registry';
import ToolVectorIcon from '../tools/ToolVectorIcon';

interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNavigation({ open, onClose }: MobileNavigationProps) {
  if (!open) return null;

  const imageTools = toolRoutes.filter((r) => detectToolCategory(r) === 'image');
  const pdfTools = toolRoutes.filter((r) => detectToolCategory(r) === 'pdf');
  const documentTools = toolRoutes.filter((r) => detectToolCategory(r) === 'document');

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-3 py-2.5 text-sm font-medium ${
      isActive
        ? 'bg-brand-50 text-brand-700'
        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <nav
      id="mobile-menu"
      aria-label="Mobile navigation"
      className="border-t border-slate-200 bg-white px-4 py-4 md:hidden"
    >
      <div className="grid grid-cols-2 gap-1.5">
        <NavLink to="/" end className={navLinkClass} onClick={onClose}>
          Home
        </NavLink>
        <a
          href="/#tools"
          onClick={onClose}
          className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
        >
          All Tools
        </a>
        <NavLink to="/about/" className={navLinkClass} onClick={onClose}>
          About
        </NavLink>
        <NavLink to="/contact/" className={navLinkClass} onClick={onClose}>
          Contact
        </NavLink>
      </div>

      {imageTools.length > 0 && (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="px-2 text-xs font-semibold text-slate-600">Image Tools</p>
          <div className="mt-2 flex flex-col gap-1">
            {imageTools.map((route) => (
              <Link
                key={route.path}
                to={route.path}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 hover:text-brand-600"
              >
                <ToolVectorIcon kind={detectToolVisualKind(route)} size="xs" />
                <span>{getShortToolName(route.meta.title)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {pdfTools.length > 0 && (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="px-2 text-xs font-semibold text-slate-600">PDF Tools</p>
          <div className="mt-2 flex flex-col gap-1">
            {pdfTools.map((route) => (
              <Link
                key={route.path}
                to={route.path}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 hover:text-brand-600"
              >
                <ToolVectorIcon kind={detectToolVisualKind(route)} size="xs" />
                <span>{getShortToolName(route.meta.title)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      {documentTools.length > 0 && (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="px-2 text-xs font-semibold text-slate-600">CV &amp; Documents</p>
          <div className="mt-2 flex flex-col gap-1">
            {documentTools.map((route) => (
              <Link
                key={route.path}
                to={route.path}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 hover:text-brand-600"
              >
                <ToolVectorIcon kind={detectToolVisualKind(route)} size="xs" />
                <span>{getShortToolName(route.meta.title)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
