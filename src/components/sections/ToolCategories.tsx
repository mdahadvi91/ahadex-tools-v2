import { Link } from 'react-router-dom';
import { toolRoutes } from '../../router/route-registry';

interface Category {
  key: string;
  title: string;
  description: string;
  matcher: (path: string) => boolean;
}

const CATEGORIES: Category[] = [
  {
    key: 'image',
    title: 'Image Tools',
    description: 'Compress and resize images without losing quality',
    matcher: (p) => p.startsWith('/image-'),
  },
  {
    key: 'pdf',
    title: 'PDF Tools',
    description: 'Compress, merge, and split PDF documents',
    matcher: (p) => p.startsWith('/pdf-') || p.startsWith('/merge-') || p.startsWith('/split-'),
  },
];

export default function ToolCategories() {
  const categories = CATEGORIES.map((cat) => ({
    ...cat,
    tools: toolRoutes.filter((r) => cat.matcher(r.path)),
  })).filter((c) => c.tools.length > 0);

  if (categories.length === 0) return null;

  return (
    <section className="bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Browse by Category</h2>
          <p className="mt-2 text-sm text-slate-600">
            Choose your file type to see the right tools
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {categories.map((cat) => (
            <div
              key={cat.key}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-slate-900">{cat.title}</h3>
              <p className="mt-1 text-xs text-slate-600">{cat.description}</p>
              <ul className="mt-4 space-y-2">
                {cat.tools.map((tool) => (
                  <li key={tool.path}>
                    <Link
                      to={tool.path}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <span>{tool.meta.title}</span>
                      <span className="text-slate-400">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
