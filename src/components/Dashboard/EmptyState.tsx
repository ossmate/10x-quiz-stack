import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Props for EmptyState component
 */
interface EmptyStateProps {
  type: "my-quizzes" | "public-quizzes";
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

/**
 * Empty state component with contextual messages and optional CTA
 *
 * @param props - Component props
 * @returns EmptyState component
 */
export function EmptyState({ type, onAction, actionLabel, className }: EmptyStateProps) {
  const isMyQuizzes = type === "my-quizzes";

  const title = isMyQuizzes ? "No quizzes yet" : "No public quizzes available";
  const description = isMyQuizzes
    ? "You haven't created any quizzes yet. Start by creating your first quiz!"
    : "There are no public quizzes available at the moment. Check back later!";
  const defaultActionLabel = isMyQuizzes ? "Create Your First Quiz" : "Refresh";

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <svg
          className="h-12 w-12 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {onAction && (
        <div className="mt-6">
          <Button onClick={onAction}>{actionLabel || defaultActionLabel}</Button>
        </div>
      )}
    </div>
  );
}
