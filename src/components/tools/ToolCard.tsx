import { Link } from 'react-router-dom';
import type { AppRoute } from '../../router/route-types';

interface ToolCardProps {
  route: AppRoute;
  variant?: 'default' | 'compact';
}

export default function ToolCard({ route, variant = 'default' }: ToolCardProps) {
  const isCompact = variant === 'compact';

  return (
    <Link
      to={route.path}
      className={`group block rounded-xl border border-slate-200 bg-white transition-all hover:border-slate-900 hover:shadow-md ${
        isCompact ? 'p-4' : 'p-6'
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-lg bg-slate-900 text-white font-bold ${
          isCompact ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
        }`}
        aria-hidden="true"
      >
        {route.meta.title.charAt(0)}
      </div>
      <h3
        className={`mt-3 font-semibold text-slate-900 group-hover:text-slate-700 ${
          isCompact ? 'text-sm' : 'text-base'
        }`}
      >
        {route.meta.title}
      </h3>
      <p
        className={`mt-1.5 leading-relaxed text-slate-600 ${
          isCompact ? 'text-xs line-clamp-2' : 'text-xs'
        }`}
      >
        {route.meta.description}
      </p>
      <span
        className={`mt-3 inline-block font-medium text-slate-900 group-hover:underline ${
          isCompact ? 'text-xs' : 'text-xs'
        }`}
      >
        Use Tool →
      </span>
    </Link>
  );
}
