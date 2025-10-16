import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  current: number; // 1-indexed for display
  total: number;
  answered: number;
  percentage: number; // 0-100
  className?: string;
}

/**
 * Visual progress indicator for quiz-taking
 * Shows current question, total questions, answered count, and progress bar
 */
export function ProgressIndicator({ current, total, answered, percentage, className }: ProgressIndicatorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          Question {current} of {total}
        </span>
        <span>{answered} answered</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Quiz progress: ${percentage.toFixed(0)}%`}
        />
      </div>
    </div>
  );
}
