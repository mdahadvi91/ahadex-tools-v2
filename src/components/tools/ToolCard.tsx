import { Link } from 'react-router-dom';
import {
  detectToolCategory,
  detectToolVisualKind,
  getCategoryLabel,
  getShortToolName,
} from '../../lib/tool-display';
import type { AppRoute } from '../../router/route-types';
import ToolVectorIcon from './ToolVectorIcon';

interface ToolCardProps {
  route: AppRoute;
  variant?: 'default' | 'compact';
}

export default function ToolCard({ route, variant = 'default' }: ToolCardProps) {
  const isCompact = variant === 'compact';
  const shortTitle = getShortToolName(route.meta.title);
  const category = detectToolCategory(route);
  const visualKind = detectToolVisualKind(route);

  return (
    <Link
      to={route.path}
      className={`group flex flex-col rounded-xl border border-slate-200 bg-white transition-all hover:border-brand-600 hover:shadow-md ${
        isCompact ? 'p-4' : 'p-5'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <ToolVectorIcon kind={visualKind} size={isCompact ? 'sm' : 'md'} />
        <span className="text-xs font-medium text-slate-500">{getCategoryLabel(category)}</span>
      </div>

      <h3
        className={`mt-4 font-display font-semibold leading-snug text-slate-900 group-hover:text-brand-600 ${
          isCompact ? 'text-sm' : 'text-base'
        }`}
      >
        {shortTitle}
      </h3>

      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">
        {route.meta.description}
      </p>

      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-semibold text-brand-600 group-hover:underline">
        Open Tool <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
