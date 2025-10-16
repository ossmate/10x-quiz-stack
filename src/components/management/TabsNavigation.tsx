import type { TabItem } from "../../types/management.types";

interface TabsNavigationProps {
  tabs: TabItem[];
  onTabChange: (tabId: string) => void;
}

export function TabsNavigation({ tabs, onTabChange }: TabsNavigationProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              tab.isActive
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
            aria-current={tab.isActive ? "page" : undefined}
            role="tab"
            aria-selected={tab.isActive}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
