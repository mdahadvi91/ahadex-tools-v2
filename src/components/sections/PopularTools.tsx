import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { toolRoutes } from '../../router/route-registry';

type Kind = 'merge' | 'split' | 'compress' | 'resize' | 'image' | 'pdf';

function detectKind(title: string): Kind {
  const t = title.toLowerCase();
  if (t.includes('merge')) return 'merge';
  if (t.includes('split')) return 'split';
  if (t.includes('compress')) return 'compress';
  if (t.includes('resiz')) return 'resize';
  if (/image|jpg|jpeg|png|webp|photo/.test(t)) return 'image';
  return 'pdf';
}

const gradients: Record<Kind, [string, string, string]> = {
  merge: ['#ffb347', '#ff6a3d', '#e11d48'],
  split: ['#f9a8d4', '#ec4899', '#be185d'],
  compress: ['#6ee7b7', '#10b981', '#047857'],
  resize: ['#c4b5fd', '#8b5cf6', '#5b21b6'],
  image: ['#7dd3fc', '#3b82f6', '#1d4ed8'],
  pdf: ['#fca5a5', '#ef4444', '#b91c1c'],
};

const glow: Record<Kind, string> = {
  merge: 'rgba(249,115,22,0.45)',
  split: 'rgba(236,72,153,0.45)',
  compress: 'rgba(16,185,129,0.45)',
  resize: 'rgba(139,92,246,0.45)',
  image: 'rgba(59,130,246,0.45)',
  pdf: 'rgba(239,68,68,0.45)',
};

const stroke = {
  fill: 'none',
  stroke: '#fff',
  strokeWidth: 5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const glyph: Record<Kind, ReactNode> = {
  merge: (
    <>
      <rect x="12" y="12" width="26" height="26" rx="7" fill="#fff" fillOpacity="0.55" />
      <rect x="26" y="26" width="26" height="26" rx="7" fill="#fff" />
      <path d="M34 39h10M39 34v10" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  split: (
    <>
      <rect x="11" y="13" width="19" height="36" rx="6" fill="#fff" />
      <rect x="34" y="17" width="19" height="36" rx="6" fill="#fff" fillOpacity="0.7" />
      <path d="M32 10v44" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 5" />
    </>
  ),
  compress: (
    <>
      <path d="M32 11v15M25 19l7 7 7-7" {...stroke} />
      <path d="M32 53V38M25 45l7-7 7 7" {...stroke} />
      <path d="M13 32h11M40 32h11" {...stroke} strokeWidth={4} />
    </>
  ),
  resize: (
    <>
      <rect x="11" y="27" width="24" height="24" rx="6" fill="#fff" fillOpacity="0.9" />
      <path d="M30 34L51 13M39 13h12v12" {...stroke} />
    </>
  ),
  image: (
    <>
      <rect x="12" y="13" width="40" height="38" rx="9" fill="#fff" fillOpacity="0.28" stroke="#fff" strokeWidth="4" />
      <circle cx="25" cy="25" r="4.5" fill="#fff" />
      <path d="M17 46l10-12 7 8 6-6 8 10z" fill="#fff" />
    </>
  ),
  pdf: (
    <>
      <path
        d="M21 9h17l11 11v28a6 6 0 0 1-6 6H21a6 6 0 0 1-6-6V15a6 6 0 0 1 6-6z"
        fill="#fff"
      />
      <path d="M38 9v11h11z" fill="#000" fillOpacity="0.18" />
      <text
        x="32"
        y="44"
        textAnchor="middle"
        fontSize="12"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        fill={gradients.pdf[2]}
      >
        PDF
      </text>
    </>
  ),
};

function IconDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <defs>
        {(Object.keys(gradients) as Kind[]).map((k) => (
          <linearGradient key={k} id={`tool-g-${k}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradients[k][0]} />
            <stop offset="55%" stopColor={gradients[k][1]} />
            <stop offset="100%" stopColor={gradients[k][2]} />
          </linearGradient>
        ))}
        <linearGradient id="tool-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id="tool-glyph-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="1.8" floodColor="#000" floodOpacity="0.3" />
        </filter>
      </defs>
    </svg>
  );
}

function ToolIcon({ title }: { title: string }) {
  const kind = detectKind(title);
  return (
    <div
      className="h-16 w-16 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110"
      style={{ filter: `drop-shadow(0 10px 12px ${glow[kind]})` }}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        <rect width="64" height="64" rx="18" fill={`url(#tool-g-${kind})`} />
        <path
          d="M0 18A18 18 0 0 1 18 0h28a18 18 0 0 1 18 18v10c-14 8-34 8-64 0z"
          fill="url(#tool-gloss)"
        />
        <rect x="1" y="1" width="62" height="62" rx="17" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
        <g filter="url(#tool-glyph-shadow)">{glyph[kind]}</g>
      </svg>
    </div>
  );
}

export default function PopularTools() {
  const featured = toolRoutes.slice(0, 4);

  if (featured.length === 0) return null;

  return (
    <section className="bg-slate-50 px-4 py-16">
      <IconDefs />
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Popular Tools</h2>
          <p className="mt-2 text-sm text-slate-600">
            Most-used file tools — instant, private, and free
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((route) => (
            <Link
              key={route.path}
              to={route.path}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
            >
              <ToolIcon title={route.meta.title} />
              <h3 className="mt-5 text-sm sm:text-base font-semibold text-slate-900 leading-tight">
                {route.meta.title.split(' - ')[0].replace('Free ', '')}
              </h3>
              <p className="mt-2 text-[11px] sm:text-xs leading-relaxed text-slate-500 line-clamp-2">
                {route.meta.description}
              </p>
              <span className="mt-auto pt-4 inline-block text-xs font-medium text-slate-900 group-hover:underline">
                Use Tool →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
