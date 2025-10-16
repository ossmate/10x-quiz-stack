import type { BreadcrumbItem } from "../../types/management.types";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="mb-6 flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCurrent = item.isCurrent ?? isLast;

          return (
            <li key={`${item.path}-${index}`} className="flex items-center">
              {index > 0 && (
                <svg
                  className="mx-2 h-5 w-5 flex-shrink-0 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
              )}
              {isCurrent ? (
                <span className="text-sm font-medium text-gray-500" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <a href={item.path} className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline">
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
