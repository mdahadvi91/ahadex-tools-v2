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
    <section id="popular-tools" className="scroll-mt-24 border-t border-[#e6e2d8] pt-10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Popular Tools
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Quick-start workflows for everyday image optimization and PDF preparation
          </p>
        </div>
        <a href="#tools" className="text-xs font-semibold text-brand-600 hover:underline">
          Browse directory ↑
        </a>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {featured.map((route) => {
          const shortTitle = getShortToolName(route.meta.title);
          const category = detectToolCategory(route);
          const visualKind = detectToolVisualKind(route);
          return (
            <Link
              key={route.path}
              to={route.path}
              className="ahadex-card group flex min-w-0 items-center gap-3.5 rounded-xl border border-[#e6e2d8] bg-white p-4 hover:border-brand-300 hover:shadow-sm"
            >
              <ToolVectorIcon kind={visualKind} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <h3 className="font-display text-sm font-bold text-slate-900 group-hover:text-brand-600">
                    {shortTitle}
                  </h3>
                  <span aria-hidden="true" className="text-slate-400">
                    ·
                  </span>
                  <span className="shrink-0 text-xs text-slate-600">
                    {getCategoryLabel(category)}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                  {route.meta.description}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="shrink-0 text-sm text-slate-600 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-brand-600"
              >
                →
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
