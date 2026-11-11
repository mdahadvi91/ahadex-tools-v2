/**
 * Site header: Menu, Logo, Title (RGB animated), Search, Settings.
 */

import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { HEADER_NAV } from '../config/navigation';
import { getSiteConfig } from '../config/site';
import IconButton from './ui/IconButton';
import Sidebar from './ui/Sidebar';
import { MenuIcon, SearchIcon, SettingsIcon } from './ui/icons';

export default function Header() {
  const site = getSiteConfig();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-3 sm:px-4">
          <IconButton label="Open menu" onClick={() => setMenuOpen(true)}>
            <MenuIcon />
          </IconButton>

          <Link to="/" aria-label={`${site.name} home`} className="flex items-center gap-2">
            <img src="/images/logo.png" alt="" width={40} height={40} className="rounded" />
            <span className="rgb-text whitespace-nowrap text-[35px] font-extrabold leading-none tracking-tight">
              {site.name}
            </span>
          </Link>

          <nav aria-label="Primary" className="ml-auto hidden md:flex">
            <ul className="flex gap-6">
              {HEADER_NAV.map((item) => (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    end={item.href === '/'}
                    className={({ isActive }) =>
                      `text-sm font-semibold transition-colors ${
                        isActive ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <IconButton
              label={searchOpen ? 'Close search' : 'Open search'}
              onClick={() => setSearchOpen((v) => !v)}
            >
              <SearchIcon />
            </IconButton>
            <IconButton label="Open settings" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-gray-200 bg-white px-4 py-2">
            <input
              type="search"
              placeholder="Search tools..."
              aria-label="Search tools"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </header>

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} side="left" title="Menu">
        <nav aria-label="Menu">
          <ul className="space-y-1">
            {HEADER_NAV.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block rounded px-3 py-2 text-sm font-semibold ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </Sidebar>

      <Sidebar
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        side="right"
        title="Settings"
      >
        <p className="text-sm text-gray-600">
          Settings are coming soon. Theme and language preferences will appear here.
        </p>
      </Sidebar>
    </>
  );
}
