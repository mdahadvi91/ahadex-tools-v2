import { useMemo, useState } from 'react';
import { detectToolCategory } from '../../lib/tool-display';
import { toolRoutes } from '../../router/route-registry';
import CategoryTabs, { type ToolCategory } from '../tools/CategoryTabs';
import ToolGrid from '../tools/ToolGrid';
import ToolSearch from '../tools/ToolSearch';

export default function AllToolsSection() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ToolCategory>('all');

  const filteredRoutes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return toolRoutes.filter((route) => {
      const cat = detectToolCategory(route);
      if (category !== 'all' && cat !== category) {
        return false;
      }
      if (!q) return true;
      return (
        route.meta.title.toLowerCase().includes(q) ||
        route.meta.description.toLowerCase().includes(q) ||
        route.path.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  const handleReset = () => {
    setQuery('');
    setCategory('all');
  };

  return (
    <section id="tools" className="scroll-mt-24 border-t border-slate-200 pt-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            All Tools
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Search or filter privacy-first browser tools ({filteredRoutes.length} of{' '}
            <span className="tabular-nums">{toolRoutes.length}</span> shown)
          </p>
        </div>

        <CategoryTabs active={category} onChange={setCategory} />
      </div>

      <div className="mt-5">
        <ToolSearch value={query} onChange={setQuery} />
      </div>

      <div className="mt-6">
        <ToolGrid
          routes={filteredRoutes}
          emptyMessage={`No tools matched "${query || category}".`}
          onResetFilters={handleReset}
        />
      </div>
    </section>
  );
}
