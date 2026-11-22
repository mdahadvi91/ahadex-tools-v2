import { NavLink } from 'react-router-dom';
import { toolRoutes } from '../../router/route-registry';

interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNavigation({ open, onClose }: MobileNavigationProps) {
  if (!open) return null;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-md px-3 py-2 text-sm font-medium ${
      isActive
        ? 'bg-slate-100 text-slate-900'
        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <nav
      id="mobile-menu"
      aria-label="Mobile navigation"
      className="md:hidden border-t border-slate-200 bg-white px-4 py-3"
    >
      <div className="flex flex-col gap-1">
        <NavLink to="/" end className={navLinkClass} onClick={onClose}>
          Home
        </NavLink>
        {toolRoutes.map((route) => (
          <NavLink key={route.path} to={route.path} className={navLinkClass} onClick={onClose}>
            {route.meta.title}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
