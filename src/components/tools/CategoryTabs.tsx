export type ToolCategory = 'all' | 'image' | 'pdf';

interface CategoryTab {
  key: ToolCategory;
  label: string;
}

const TABS: CategoryTab[] = [
  { key: 'all', label: 'All Tools' },
  { key: 'image', label: 'Image Tools' },
  { key: 'pdf', label: 'PDF Tools' },
];

interface CategoryTabsProps {
  active: ToolCategory;
  onChange: (category: ToolCategory) => void;
}

export default function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <div role="tablist" aria-label="Tool categories" className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
