import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import MobileNavigation from './MobileNavigation';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap shrink-0 text-sm font-medium transition-colors ${
      isActive
        ? 'text-brand-600 underline decoration-2 underline-offset-8'
        : 'text-slate-600 hover:text-slate-900 hover:underline hover:decoration-slate-300 hover:underline-offset-8'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-slate-900 no-underline"
        >
          <img
            src="/logo.svg"
            alt="AHADEX Tools logo"
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 object-contain"
          />
          <span className="font-display text-lg font-bold tracking-tight text-slate-900">
            AHADEX Tools
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-6 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <a
            href="/#tools"
            className="whitespace-nowrap shrink-0 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 hover:underline hover:decoration-slate-300 hover:underline-offset-8"
          >
            All Tools
          </a>
          <a
            href="/#categories"
            className="whitespace-nowrap shrink-0 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 hover:underline hover:decoration-slate-300 hover:underline-offset-8"
          >
            Categories
          </a>
          <NavLink to="/about/" className={navLinkClass}>
            About
          </NavLink>
          <NavLink to="/contact/" className={navLinkClass}>
            Contact
          </NavLink>
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <a
            href="/#tools"
            className="hidden whitespace-nowrap shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 md:inline-flex"
          >
            Browse Tools
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
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
      </div>

      <MobileNavigation open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
