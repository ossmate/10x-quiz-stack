import { Button } from "@/components/ui/button";
import type { NavigationState } from "../../types";

interface QuizNavigationControlsProps {
  navigationState: NavigationState;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit?: boolean; // Optional: check if all questions answered
}

/**
 * Navigation controls for quiz-taking
 * Shows Previous, Next, and Submit buttons based on current position
 * Handles button states (disabled, loading) appropriately
 */
export function QuizNavigationControls({
  navigationState,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting,
  canSubmit = true,
}: QuizNavigationControlsProps) {
  const { isFirstQuestion, isLastQuestion } = navigationState;

  return (
    <div className="flex justify-between mt-8 gap-4">
      <Button
        onClick={onPrevious}
        disabled={isFirstQuestion || isSubmitting}
        variant="outline"
        size="lg"
        className="min-w-[120px]"
      >
        Previous
      </Button>

      {!isLastQuestion ? (
        <Button onClick={onNext} disabled={isSubmitting} size="lg" className="min-w-[120px]">
          Next
        </Button>
      ) : (
        <Button onClick={onSubmit} disabled={isSubmitting || !canSubmit} size="lg" className="min-w-[120px]">
          {isSubmitting ? "Submitting..." : "Submit Quiz"}
        </Button>
      )}
    </div>
  );
}
