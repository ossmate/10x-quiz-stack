import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Props for ErrorAlert component
 */
interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * Error alert component with optional retry and dismiss actions
 *
 * @param props - Component props
 * @returns ErrorAlert component
 */
export function ErrorAlert({
  title = "Error",
  message,
  onRetry,
  onDismiss,
  retryLabel = "Retry",
  className,
}: ErrorAlertProps) {
  return (
    <div
      className={cn("rounded-lg border border-destructive bg-destructive/10 p-4 dark:bg-destructive/20", className)}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-destructive">{title}</h3>
          <p className="mt-1 text-sm text-destructive/90">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-destructive/70 hover:text-destructive focus:outline-none"
            aria-label="Dismiss error"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {onRetry && (
        <div className="mt-4">
          <Button onClick={onRetry} variant="outline" size="sm">
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
