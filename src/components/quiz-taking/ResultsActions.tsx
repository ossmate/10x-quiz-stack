import { Button } from "@/components/ui/button";

interface ResultsActionsProps {
  onRetry: () => void;
  onBackToQuiz: () => void;
  isRetrying?: boolean;
}

/**
 * Action buttons for quiz results
 * Allows user to retry quiz or return to quiz detail page
 */
export function ResultsActions({ onRetry, onBackToQuiz, isRetrying = false }: ResultsActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
      <Button onClick={onRetry} disabled={isRetrying} size="lg" className="min-w-[160px]">
        {isRetrying ? "Starting new attempt..." : "Retry Quiz"}
      </Button>
      <Button onClick={onBackToQuiz} variant="outline" size="lg" className="min-w-[160px]">
        Back to Quiz
      </Button>
    </div>
  );
}
