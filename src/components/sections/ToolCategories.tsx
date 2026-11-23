import { Link } from 'react-router-dom';
import { detectToolCategory, getShortToolName } from '../../lib/tool-display';
import { toolRoutes } from '../../router/route-registry';

interface CategoryDefinition {
  readonly key: 'image' | 'pdf';
  readonly title: string;
  readonly description: string;
}

const CATEGORIES: readonly CategoryDefinition[] = [
  {
    key: 'image',
    title: 'Image Optimization & Sizing',
    description:
      'Compress and resize JPG, PNG, WebP, GIF, and AVIF files directly inside your browser.',
  },
  {
    key: 'pdf',
    title: 'PDF Document Utilities',
    description: 'Compress, merge, and split PDF documents locally without uploading to servers.',
  },
];

export default function ToolCategories() {
  const populatedCategories = CATEGORIES.map((cat) => ({
    ...cat,
    tools: toolRoutes.filter((r) => detectToolCategory(r) === cat.key),
  })).filter((c) => c.tools.length > 0);

  if (populatedCategories.length === 0) return null;

  return (
    <section id="categories" className="scroll-mt-24 border-t border-slate-200 pt-12">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Browse by Category
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Select a file category to jump directly to the utility you need
        </p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {populatedCategories.map((cat) => (
          <div key={cat.key} className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-display text-lg font-semibold text-slate-900">{cat.title}</h3>
              <span className="text-xs font-medium text-slate-500 tabular-nums">
                {cat.tools.length} {cat.tools.length === 1 ? 'tool' : 'tools'}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{cat.description}</p>
            <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
              {cat.tools.map((tool) => (
                <li key={tool.path}>
                  <Link
                    to={tool.path}
                    className="flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 hover:text-brand-600"
                  >
                    <span>{getShortToolName(tool.meta.title)}</span>
                    <span className="text-slate-400" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
