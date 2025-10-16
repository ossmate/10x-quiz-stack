import type { FilterOption } from "../../types/management.types";

interface SideNavigationProps {
  filters: FilterOption[];
  selectedFilter: string | null;
  onFilterChange: (filterId: string) => void;
}

export function SideNavigation({ filters, selectedFilter, onFilterChange }: SideNavigationProps) {
  return (
    <nav className="flex flex-col space-y-6" aria-label="Sidebar navigation">
      {/* Filter Section */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Filters</h3>
        <ul className="space-y-1">
          {filters.map((filter) => (
            <li key={filter.id}>
              <button
                type="button"
                onClick={() => onFilterChange(filter.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                  selectedFilter === filter.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
                aria-current={selectedFilter === filter.id ? "true" : undefined}
              >
                {filter.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick Actions Section */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Quick Actions</h3>
        <ul className="space-y-1">
          <li>
            <a
              href="/quizzes/new"
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              Create New Quiz
            </a>
          </li>
          <li>
            <a
              href="/settings"
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              Settings
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
