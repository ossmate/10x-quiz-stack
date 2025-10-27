import { useState, useEffect } from "react";
import { navigate } from "astro:transitions/client";
import type { QuizDetailDTO, QuizResult } from "../../types";
import { LoadingSpinner } from "../Dashboard/LoadingSpinner";
import { ErrorAlert } from "../Dashboard/ErrorAlert";
import { ResultsDisplay } from "./ResultsDisplay";

interface AttemptResultsContainerProps {
  attemptId: string;
  quizId: string;
}

interface AttemptDetailsResponse {
  attempt: {
    id: string;
    quiz_id: string;
    user_id: string;
    score: number;
    total_questions: number;
    time_spent: number | null;
    created_at: string;
    completed_at: string;
  };
  quiz: QuizDetailDTO;
  userAnswers: Record<string, string[]>;
}

/**
 * Container for displaying past quiz attempt results
 * Fetches attempt data and renders the results view
 */
export function AttemptResultsContainer({ attemptId, quizId }: AttemptResultsContainerProps) {
  const [state, setState] = useState<{
    phase: "loading" | "loaded" | "error";
    data: AttemptDetailsResponse | null;
    error: string | null;
  }>({
    phase: "loading",
    data: null,
    error: null,
  });

  useEffect(() => {
    const fetchAttemptData = async () => {
      try {
        const response = await fetch(`/api/attempts/${attemptId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (response.status === 401) {
          navigate(`/login?redirect=/quizzes/${quizId}/results?attemptId=${attemptId}`);
          return;
        }

        if (response.status === 403) {
          setState({
            phase: "error",
            data: null,
            error: "You don't have permission to view this attempt.",
          });
          return;
        }

        if (response.status === 404) {
          setState({
            phase: "error",
            data: null,
            error: "Attempt not found.",
          });
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: "Failed to load attempt",
          }));
          throw new Error(errorData.error || "Failed to load attempt details");
        }

        const data: AttemptDetailsResponse = await response.json();

        setState({
          phase: "loaded",
          data,
          error: null,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        setState({
          phase: "error",
          data: null,
          error: errorMessage,
        });

        // eslint-disable-next-line no-console
        console.error("Error fetching attempt details:", err);
      }
    };

    fetchAttemptData();
  }, [attemptId, quizId]);

  // Loading phase
  if (state.phase === "loading") {
    return <LoadingSpinner message="Loading results..." />;
  }

  // Error phase
  if (state.phase === "error") {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <ErrorAlert
          title="Unable to Load Results"
          message={state.error || "An unexpected error occurred"}
          onRetry={() => window.location.reload()}
          retryLabel="Try Again"
        />
      </div>
    );
  }

  // Loaded phase
  if (state.phase === "loaded" && state.data) {
    const { attempt, quiz, userAnswers } = state.data;

    // Calculate percentage
    const percentage = attempt.total_questions > 0 ? (attempt.score / attempt.total_questions) * 100 : 0;

    // Build QuizResult object
    const result: QuizResult = {
      attemptId: attempt.id,
      score: Math.round((attempt.score / 100) * attempt.total_questions), // Convert percentage back to count for display
      totalQuestions: attempt.total_questions,
      percentage: attempt.score, // This is already a percentage from the API
      correctAnswers: Math.round((attempt.score / 100) * attempt.total_questions),
      userAnswers,
      quiz,
    };

    return (
      <ResultsDisplay
        result={result}
        quiz={quiz}
        onRetry={() => navigate(`/quizzes/${quizId}/take`)}
        onBackToQuiz={() => navigate(`/quizzes/${quizId}`)}
        isRetrying={false}
      />
    );
  }

  // Fallback
  return <LoadingSpinner message="Loading..." />;
}
