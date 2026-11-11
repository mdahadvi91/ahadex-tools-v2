/**
 * Site header with logo and primary navigation.
 */

import { Link, NavLink } from 'react-router-dom';
import { HEADER_NAV } from '../config/navigation';
import { getSiteConfig } from '../config/site';

export default function Header() {
  const site = getSiteConfig();
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          to="/"
          aria-label={`${site.name} home`}
          className="flex items-center gap-2 text-lg font-bold text-gray-900"
        >
          <img src="/images/logo.png" alt="" width={36} height={36} className="rounded" />
          <span>{site.name}</span>
        </Link>
        <nav aria-label="Primary">
          <ul className="flex gap-4">
            {HEADER_NAV.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
