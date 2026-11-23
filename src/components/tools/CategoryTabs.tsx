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
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1"
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
            className={`whitespace-nowrap shrink-0 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
              isActive ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
