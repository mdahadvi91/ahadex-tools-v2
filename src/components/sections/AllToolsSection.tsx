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
    <section id="tools" className="scroll-mt-24">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex flex-wrap items-baseline justify-center gap-2">
          <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            All Tools
          </h2>
          <span className="text-xs font-medium text-slate-600 tabular-nums">
            ({filteredRoutes.length} of {toolRoutes.length})
          </span>
        </div>

        <CategoryTabs active={category} onChange={setCategory} />

        <div className="w-full max-w-lg">
          <ToolSearch value={query} onChange={setQuery} />
        </div>
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
