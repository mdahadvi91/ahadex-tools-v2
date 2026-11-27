import { Link } from 'react-router-dom';
import { detectToolVisualKind, getShortToolName } from '../../lib/tool-display';
import type { AppRoute } from '../../router/route-types';
import ToolVectorIcon from './ToolVectorIcon';

interface ToolCardProps {
  route: AppRoute;
  variant?: 'default' | 'compact';
}

export default function ToolCard({ route, variant = 'default' }: ToolCardProps) {
  const isCompact = variant === 'compact';
  const shortTitle = getShortToolName(route.meta.title);
  const visualKind = detectToolVisualKind(route);

  return (
    <Link
      to={route.path}
      className={`ahadex-card group flex min-w-0 flex-col rounded-xl border border-[#e6e2d8] bg-white shadow-xs hover:border-brand-300 hover:shadow-md ${
        isCompact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-6'
      }`}
    >
      <ToolVectorIcon kind={visualKind} size={isCompact ? 'sm' : 'md'} />

      <h3
        className={`mt-3.5 font-display font-bold leading-snug text-slate-900 transition-colors group-hover:text-brand-600 ${
          isCompact ? 'text-sm' : 'text-sm sm:text-base'
        }`}
      >
        {shortTitle}
      </h3>

      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
        {route.meta.description}
      </p>
    </Link>
  );
}
