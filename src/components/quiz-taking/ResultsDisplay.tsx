import type { QuizResult, QuizDetailDTO } from "../../types";
import { ScoreSummary } from "./ScoreSummary";
import { QuestionReview } from "./QuestionReview";
import { ResultsActions } from "./ResultsActions";

interface ResultsDisplayProps {
  result: QuizResult;
  quiz: QuizDetailDTO;
  onRetry: () => void;
  onBackToQuiz: () => void;
  isRetrying?: boolean;
}

/**
 * Complete quiz results display
 * Shows score summary, detailed question review, and action buttons
 */
export function ResultsDisplay({ result, quiz, onRetry, onBackToQuiz, isRetrying = false }: ResultsDisplayProps) {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <ScoreSummary
        score={result.score}
        totalQuestions={result.totalQuestions}
        percentage={result.percentage}
        correctAnswers={result.correctAnswers}
      />

      <QuestionReview quiz={quiz} userAnswers={result.userAnswers} />

      <ResultsActions onRetry={onRetry} onBackToQuiz={onBackToQuiz} isRetrying={isRetrying} />
    </div>
  );
}
