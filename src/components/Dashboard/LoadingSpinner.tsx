import { cn } from "@/lib/utils";

/**
 * Props for LoadingSpinner component
 */
interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Loading spinner component with optional message
 *
 * @param props - Component props
 * @returns LoadingSpinner component
 */
export function LoadingSpinner({ message = "Loading...", size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center py-12", className)}>
      <div
        className={cn("animate-spin rounded-full border-solid border-primary border-t-transparent", sizeClasses[size])}
        role="status"
        aria-label="Loading"
      />
      {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
