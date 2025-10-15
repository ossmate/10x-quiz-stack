import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Pagination wrapper component
 */
export function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

/**
 * PaginationContent component
 */
export function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("flex flex-row items-center gap-1", className)} {...props} />;
}

/**
 * PaginationItem component
 */
export function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("", className)} {...props} />;
}

/**
 * PaginationLink component
 */
interface PaginationLinkProps extends ButtonProps {
  isActive?: boolean;
}

export function PaginationLink({ className, isActive, size = "icon", ...props }: PaginationLinkProps) {
  return (
    <Button
      aria-current={isActive ? "page" : undefined}
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={cn(isActive && "border-primary", className)}
      {...props}
    />
  );
}

/**
 * PaginationPrevious component
 */
export function PaginationPrevious({ className, ...props }: ButtonProps) {
  return (
    <Button variant="ghost" size="default" className={cn("gap-1 pl-2.5", className)} {...props}>
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      <span>Previous</span>
    </Button>
  );
}

/**
 * PaginationNext component
 */
export function PaginationNext({ className, ...props }: ButtonProps) {
  return (
    <Button variant="ghost" size="default" className={cn("gap-1 pr-2.5", className)} {...props}>
      <span>Next</span>
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Button>
  );
}

/**
 * PaginationEllipsis component
 */
export function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span aria-hidden className={cn("flex h-9 w-9 items-center justify-center", className)} {...props}>
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="19" cy="12" r="1" fill="currentColor" />
        <circle cx="5" cy="12" r="1" fill="currentColor" />
      </svg>
      <span className="sr-only">More pages</span>
    </span>
  );
}
