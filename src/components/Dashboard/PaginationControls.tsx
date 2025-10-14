import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

/**
 * Props for PaginationControls component
 */
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/**
 * Generate array of page numbers to display with ellipsis
 * Shows first page, last page, current page, and pages around current
 *
 * @param currentPage - Current active page
 * @param totalPages - Total number of pages
 * @returns Array of page numbers or "..." for ellipsis
 */
function generatePageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = [];

  // If 7 or fewer pages, show all
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Always show first page
  pages.push(1);

  // Calculate range around current page
  const leftSiblingIndex = Math.max(currentPage - 1, 2);
  const rightSiblingIndex = Math.min(currentPage + 1, totalPages - 1);

  const shouldShowLeftEllipsis = leftSiblingIndex > 2;
  const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

  // Left ellipsis
  if (shouldShowLeftEllipsis) {
    pages.push("...");
  }

  // Pages around current page
  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    pages.push(i);
  }

  // Right ellipsis
  if (shouldShowRightEllipsis) {
    pages.push("...");
  }

  // Always show last page
  pages.push(totalPages);

  return pages;
}

/**
 * Pagination controls component with page numbers and next/previous buttons
 *
 * @param props - Component props
 * @returns PaginationControls component
 */
export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  disabled = false,
}: PaginationControlsProps) {
  const isPrevDisabled = currentPage <= 1 || disabled;
  const isNextDisabled = currentPage >= totalPages || disabled;

  const pages = generatePageNumbers(currentPage, totalPages);

  const handlePageChange = (page: number) => {
    if (disabled) return;
    if (page < 1 || page > totalPages) return;
    if (page === currentPage) return;
    onPageChange(page);
  };

  // Don't render pagination if only one page
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={isPrevDisabled}
              aria-label="Go to previous page"
            />
          </PaginationItem>

          {pages.map((page, index) => (
            <PaginationItem key={`${page}-${index}`}>
              {page === "..." ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => handlePageChange(Number(page))}
                  isActive={page === currentPage}
                  disabled={disabled}
                  aria-label={`Go to page ${page}`}
                  aria-current={page === currentPage ? "page" : undefined}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={isNextDisabled}
              aria-label="Go to next page"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <p className="text-xs text-muted-foreground">
        Showing page {currentPage} of {totalPages} ({totalItems} {totalItems === 1 ? "item" : "items"} total)
      </p>
    </div>
  );
}
