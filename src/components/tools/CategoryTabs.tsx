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
    <div
      role="tablist"
      aria-label="Tool categories"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`whitespace-nowrap shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${
              isActive
                ? 'bg-slate-900 text-white shadow-xs'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
