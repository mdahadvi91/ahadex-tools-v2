import { Link } from 'react-router-dom';
import {
  detectToolCategory,
  detectToolVisualKind,
  getCategoryLabel,
  getShortToolName,
} from '../../lib/tool-display';
import { toolRoutes } from '../../router/route-registry';
import ToolVectorIcon from '../tools/ToolVectorIcon';

export default function PopularTools() {
  const featured = toolRoutes.slice(0, 4);

  if (featured.length === 0) return null;

  return (
    <section id="popular-tools" className="scroll-mt-24">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Popular Tools
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Most frequently used browser utilities for everyday image optimization
          </p>
        </div>
        <a href="#tools" className="text-xs font-semibold text-brand-600 hover:underline">
          View all tools →
        </a>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {featured.map((route) => {
          const shortTitle = getShortToolName(route.meta.title);
          const category = detectToolCategory(route);
          const visualKind = detectToolVisualKind(route);
          return (
            <Link
              key={route.path}
              to={route.path}
              className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-brand-600 hover:shadow-md"
            >
              <ToolVectorIcon kind={visualKind} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500">{getCategoryLabel(category)}</p>
                <h3 className="mt-1 font-display text-base font-semibold text-slate-900 group-hover:text-brand-600">
                  {shortTitle}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
                  {route.meta.description}
                </p>
                <span className="mt-3 inline-block text-xs font-semibold text-brand-600 group-hover:underline">
                  Use Tool →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
