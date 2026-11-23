import type { AppRoute } from '../../router/route-types';
import ToolCard from './ToolCard';

interface ToolGridProps {
  routes: AppRoute[];
  variant?: 'default' | 'compact';
  emptyMessage?: string;
  onResetFilters?: () => void;
}

export default function ToolGrid({
  routes,
  variant = 'default',
  emptyMessage = 'No matching tools found.',
  onResetFilters,
}: ToolGridProps) {
  if (routes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
        <p className="text-sm text-slate-600">{emptyMessage}</p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
          >
            Reset Search &amp; Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {routes.map((route) => (
        <ToolCard key={route.path} route={route} variant={variant} />
      ))}
    </div>
  );
}
