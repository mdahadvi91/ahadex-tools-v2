import type { AppRoute } from '../../router/route-types';
import ToolCard from './ToolCard';

interface ToolGridProps {
  routes: AppRoute[];
  variant?: 'default' | 'compact';
  emptyMessage?: string;
}

export default function ToolGrid({
  routes,
  variant = 'default',
  emptyMessage = 'No tools available.',
}: ToolGridProps) {
  if (routes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {routes.map((route) => (
        <ToolCard key={route.path} route={route} variant={variant} />
      ))}
    </div>
  );
}
