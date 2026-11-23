import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { toolRoutes } from '../../router/route-registry';
import MobileNavigation from './MobileNavigation';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-slate-100 text-slate-900'
        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5 text-slate-900 no-underline shrink-0">
          <img
            src="/hridoyvi.png"
            alt="AHADEX Tools logo"
            className="h-8 w-8 rounded-md object-contain"
          />
          <span className="text-lg font-bold tracking-tight">AHADEX Tools</span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          {toolRoutes.map((route) => (
            <NavLink key={route.path} to={route.path} className={navLinkClass}>
              {route.meta.title}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle navigation menu"
          className="md:hidden rounded-md p-2 text-slate-700 hover:bg-slate-100"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      <MobileNavigation open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
