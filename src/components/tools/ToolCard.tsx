import { Link } from 'react-router-dom';
import type { AppRoute } from '../../router/route-types';

interface ToolCardProps {
  route: AppRoute;
  variant?: 'default' | 'compact';
}

function getShortTitle(title: string): string {
  const parts = title.split('-');
  if (parts.length > 1) {
    return parts[0].replace('Free ', '').trim(); // আগের কোডে ভুল ছিল, এবার ঠিক করা হলো
  }
  return title.replace('Free ', '').trim();
}

export default function ToolCard({ route, variant = 'default' }: ToolCardProps) {
  const isCompact = variant === 'compact';
  const shortTitle = getShortTitle(route.meta.title);

  return (
    <Link
      to={route.path}
      className={`group flex flex-col rounded-xl border border-slate-200 bg-white transition-all hover:border-slate-900 hover:shadow-md ${
        isCompact ? 'p-3' : 'p-4 sm:p-5'
      }`}
    >
      <div className={`flex items-center justify-center rounded-lg bg-blue-50 ${isCompact ? 'h-8 w-8 text-base' : 'h-10 w-10 sm:h-12 sm:w-12 text-xl sm:text-2xl'}`}>
        {shortTitle.toLowerCase().includes('image') ? '🖼️' : shortTitle.toLowerCase().includes('pdf') ? '📄' : '⚙️'}
      </div>
      <h3 className={`mt-3 font-semibold text-slate-900 leading-tight group-hover:text-slate-700 ${isCompact ? 'text-sm' : 'text-sm sm:text-base'}`}>
        {shortTitle}
      </h3>
      <p className={`mt-2 leading-relaxed text-slate-500 line-clamp-3 ${isCompact ? 'text-[11px]' : 'text-[11px] sm:text-xs'}`}>
        {route.meta.description}
      </p>
      <span className="mt-auto pt-3 inline-block text-xs font-medium text-slate-900 group-hover:underline">
        Use Tool →
      </span>
    </Link>
  );
}
