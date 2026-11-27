import { Link } from 'react-router-dom';
import { toolRoutes } from '../../router/route-registry';
import ToolCard from '../tools/ToolCard';

interface RelatedToolsProps {
  currentPath?: string;
  limit?: number;
}

export default function RelatedTools({ currentPath, limit = 4 }: RelatedToolsProps) {
  const related = toolRoutes.filter((r) => r.path !== currentPath).slice(0, limit);

  if (related.length === 0) return null;

  const isToolPage = Boolean(currentPath);

  return (
    <section aria-label="Related Tools" className="border-t border-[#e6e2d8] pt-12">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Related Tools
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Explore more free, zero-upload utilities on AHADEX Tools
          </p>
        </div>
        {isToolPage && (
          <Link to="/#tools" className="text-xs font-semibold text-brand-600 hover:underline">
            View all tools →
          </Link>
        )}
      </div>

      <div
        className={`mt-6 grid grid-cols-2 gap-3 sm:gap-5 ${
          isToolPage ? 'lg:grid-cols-4' : 'sm:grid-cols-2'
        }`}
      >
        {related.map((route) => (
          <ToolCard key={route.path} route={route} variant={isToolPage ? 'compact' : 'default'} />
        ))}
      </div>
    </section>
  );
}
