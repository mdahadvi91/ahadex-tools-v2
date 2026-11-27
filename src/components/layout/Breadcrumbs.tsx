import { Link, useLocation } from 'react-router-dom';
import { getEnvironment } from '../../config/environment';

interface Crumb {
  label: string;
  to?: string;
}

export default function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0) return null;

  const crumbs: Crumb[] = [
    { label: 'Home', to: '/' },
    ...pathSegments.map((segment, index) => {
      const to = `/${pathSegments.slice(0, index + 1).join('/')}/`;
      const label = segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return index === pathSegments.length - 1 ? { label } : { label, to };
    }),
  ];

  const env = getEnvironment();
  const origin =
    env.siteUrl && env.siteUrl.startsWith('http')
      ? env.siteUrl.replace(/\/+$/, '')
      : typeof window !== 'undefined'
        ? window.location.origin
        : 'https://ahadex.online';

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      ...(crumb.to && { item: `${origin}${crumb.to}` }),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
          {crumbs.map((crumb, index) => (
            <li key={crumb.label} className="flex items-center gap-1.5">
              {index > 0 && <span aria-hidden="true">/</span>}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-slate-900 hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-slate-900" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
