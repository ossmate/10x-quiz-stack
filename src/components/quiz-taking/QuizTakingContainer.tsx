import { useQuizTaking } from "../../hooks/useQuizTaking";
import { LoadingSpinner } from "../Dashboard/LoadingSpinner";
import { ErrorAlert } from "../Dashboard/ErrorAlert";
import { QuizTakingContent } from "./QuizTakingContent";
import { ResultsDisplay } from "./ResultsDisplay";

interface QuizTakingContainerProps {
  quizId: string;
  currentUserId?: string;
}

/**
 * Main container component for quiz-taking view
 * Manages the complete quiz-taking flow and renders appropriate UI based on phase
 */
export function QuizTakingContainer({ quizId, currentUserId }: QuizTakingContainerProps) {
  const {
    takingState,
    currentQuestion,
    navigationState,
    progressInfo,
    selectOption,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    retryQuiz,
    result,
  } = useQuizTaking({ quizId, currentUserId });

  // Loading phase
  if (takingState.phase === "loading") {
    return <LoadingSpinner message="Loading quiz..." />;
  }

  // Error phase
  if (takingState.phase === "error") {
    return (
      <div className="container mx-auto py-8">
        <ErrorAlert
          title="Unable to Load Quiz"
          message={takingState.error || "An unexpected error occurred"}
          onRetry={() => window.location.reload()}
          retryLabel="Try Again"
        />
      </div>
    );
  }

  // Completed phase
  if (takingState.phase === "completed" && result && takingState.quiz) {
    return (
      <ResultsDisplay
        result={result}
        quiz={takingState.quiz}
        onRetry={retryQuiz}
        onBackToQuiz={() => (window.location.href = `/quizzes/${quizId}`)}
        isRetrying={false}
      />
    );
  }

  // Taking phase
  if (takingState.phase === "taking" || takingState.phase === "submitting") {
    // Validate we have all required data
    if (!takingState.quiz) {
      return (
        <div className="container mx-auto py-8">
          <ErrorAlert title="Quiz Error" message="Unable to load quiz data" onRetry={() => window.location.reload()} />
        </div>
      );
    }

    if (!takingState.attempt) {
      return (
        <div className="container mx-auto py-8">
          <ErrorAlert
            title="Unable to Start Quiz"
            message="Failed to create quiz attempt. Please try again."
            onRetry={() => window.location.reload()}
          />
        </div>
      );
    }

    if (!currentQuestion) {
      return (
        <div className="container mx-auto py-8">
          <ErrorAlert
            title="Quiz Error"
            message="Unable to load quiz questions"
            onRetry={() => window.location.reload()}
          />
        </div>
      );
    }

    return (
      <QuizTakingContent
        quiz={takingState.quiz}
        currentQuestion={currentQuestion}
        userAnswers={takingState.userAnswers}
        progressInfo={progressInfo}
        navigationState={navigationState}
        onSelectOption={selectOption}
        onNext={nextQuestion}
        onPrevious={previousQuestion}
        onSubmit={submitQuiz}
        isSubmitting={takingState.phase === "submitting"}
      />
    );
  }

  // Fallback
  return (
    <div className="container mx-auto py-8">
      <LoadingSpinner message="Loading..." />
    </div>
  );
}
