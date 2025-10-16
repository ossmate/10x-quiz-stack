import type { QuizDetailDTO, QuestionWithOptionsDTO, ProgressInfo, NavigationState } from "../../types";
import { QuizTakingHeader } from "./QuizTakingHeader";
import { QuestionDisplay } from "./QuestionDisplay";
import { QuizNavigationControls } from "./QuizNavigationControls";

interface QuizTakingContentProps {
  quiz: QuizDetailDTO;
  currentQuestion: QuestionWithOptionsDTO;
  userAnswers: Record<string, string[]>;
  progressInfo: ProgressInfo;
  navigationState: NavigationState;
  onSelectOption: (questionId: string, optionId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Main quiz-taking interface component
 * Renders the active quiz with header, current question, and navigation controls
 */
export function QuizTakingContent({
  quiz,
  currentQuestion,
  userAnswers,
  progressInfo,
  navigationState,
  onSelectOption,
  onNext,
  onPrevious,
  onSubmit,
  isSubmitting,
}: QuizTakingContentProps) {
  const currentSelectedOptions = userAnswers[currentQuestion.id] || [];

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <QuizTakingHeader quiz={quiz} progressInfo={progressInfo} />

      <QuestionDisplay
        question={currentQuestion}
        questionNumber={progressInfo.current}
        selectedOptionIds={currentSelectedOptions}
        onSelectOption={(optionId) => onSelectOption(currentQuestion.id, optionId)}
        disabled={isSubmitting}
      />

      <QuizNavigationControls
        navigationState={navigationState}
        onPrevious={onPrevious}
        onNext={onNext}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
