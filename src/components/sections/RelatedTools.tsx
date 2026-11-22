import { Link } from 'react-router-dom';
import { toolRoutes } from '../../router/route-registry';

interface RelatedToolsProps {
  currentPath?: string;
  limit?: number;
}

export default function RelatedTools({ currentPath, limit = 4 }: RelatedToolsProps) {
  const related = toolRoutes.filter((r) => r.path !== currentPath).slice(0, limit);

  if (related.length === 0) return null;

  return (
    <section className="bg-white px-4 py-12 border-t border-slate-200">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Related Tools</h2>
        <p className="mt-1 text-xs text-slate-600">Other free tools you might find useful</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((route) => (
            <Link
              key={route.path}
              to={route.path}
              className="group rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-slate-900 hover:shadow-sm"
            >
              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">
                {route.meta.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 line-clamp-2">
                {route.meta.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
