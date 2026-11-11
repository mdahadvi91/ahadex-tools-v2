/**
 * Site footer with sections.
 */

import { Link } from 'react-router-dom';
import { FOOTER_SECTIONS } from '../config/navigation';
import { getSiteConfig } from '../config/site';

export default function Footer() {
  const site = getSiteConfig();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link
              to="/"
              className="flex items-center gap-2 text-lg font-bold text-gray-900"
            >
              <img src="/images/logo.png" alt="" width={32} height={32} className="rounded" />
              <span>{site.name}</span>
            </Link>
            <p className="mt-2 text-sm text-gray-600">{site.description}</p>
          </div>
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-900">
                {section.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 border-t border-gray-200 pt-6">
          <p className="text-center text-sm text-gray-500">
            &copy; {year} {site.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
