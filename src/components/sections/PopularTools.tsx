import { Link } from 'react-router-dom';
import { toolRoutes } from '../../router/route-registry';

export default function PopularTools() {
  // iLovePDF-এর মতো ৪টি টুল দেখাব
  const featured = toolRoutes.slice(0, 4);

  if (featured.length === 0) return null;

  return (
    <section className="bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Popular Tools</h2>
          <p className="mt-2 text-sm text-slate-600">
            Most-used file tools — instant, private, and free
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((route) => (
            <Link
              key={route.path}
              to={route.path}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-900 hover:shadow-md"
            >
              <div className="flex items-center justify-center rounded-lg bg-blue-50 h-12 w-12 text-2xl">
                {route.meta.title.toLowerCase().includes('image') ? '🖼️' : '📄'}
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                {route.meta.title.split(' - ')[0].replace('Free ', '')}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">
                {route.meta.description}
              </p>
              <span className="mt-auto pt-4 inline-block text-xs font-medium text-slate-900 group-hover:underline">
                Use Tool →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
