import { Link } from 'react-router-dom';
import { detectToolCategory, getCategoryLabel, getShortToolName } from '../../lib/tool-display';
import { toolRoutes } from '../../router/route-registry';

interface RelatedToolsProps {
  currentPath?: string;
  limit?: number;
}

export default function RelatedTools({ currentPath, limit = 4 }: RelatedToolsProps) {
  const related = toolRoutes.filter((r) => r.path !== currentPath).slice(0, limit);

  if (related.length === 0) return null;

  return (
    <section aria-label="Related Tools" className="border-t border-slate-200 pt-12">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Related Tools
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Explore complementary privacy-first utilities on AHADEX Tools
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {related.map((route) => {
          const category = detectToolCategory(route);
          return (
            <Link
              key={route.path}
              to={route.path}
              className="group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-brand-600 hover:shadow-sm"
            >
              <p className="text-xs font-medium text-slate-500">{getCategoryLabel(category)}</p>
              <h3 className="mt-1 font-display text-base font-semibold text-slate-900 group-hover:text-brand-600">
                {getShortToolName(route.meta.title)}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
                {route.meta.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
