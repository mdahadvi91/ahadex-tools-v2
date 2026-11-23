import { Link, NavLink } from 'react-router-dom';
import { getShortToolName } from '../../lib/tool-display';
import { toolRoutes } from '../../router/route-registry';

interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNavigation({ open, onClose }: MobileNavigationProps) {
  if (!open) return null;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-md px-3 py-2.5 text-sm font-medium ${
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
      <div className="flex flex-col gap-1">
        <NavLink to="/" end className={navLinkClass} onClick={onClose}>
          Home
        </NavLink>
        <a
          href="/#tools"
          onClick={onClose}
          className="block rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
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

      {toolRoutes.length > 0 && (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="px-3 text-xs font-semibold text-slate-500">Available Tools</p>
          <div className="mt-1.5 flex flex-col gap-1">
            {toolRoutes.map((route) => (
              <Link
                key={route.path}
                to={route.path}
                onClick={onClose}
                className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                {getShortToolName(route.meta.title)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
