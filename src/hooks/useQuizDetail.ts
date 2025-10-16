import { useState, useEffect, useCallback } from "react";
import { navigate } from "astro:transitions/client";
import type { QuizDetailDTO } from "../types.ts";
import { z } from "zod";

interface UseQuizDetailParams {
  quizId: string;
  currentUserId?: string;
}

interface UseQuizDetailReturn {
  quiz: QuizDetailDTO | null;
  isLoading: boolean;
  error: string | null;
  isOwner: boolean;
  refetch: () => Promise<void>;
  deleteQuiz: () => Promise<void>;
}

const uuidSchema = z.string().uuid();

export function useQuizDetail(params: UseQuizDetailParams): UseQuizDetailReturn {
  const { quizId, currentUserId } = params;
  const [quiz, setQuiz] = useState<QuizDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Initialize to true to prevent flash of "No quiz data"
  const [error, setError] = useState<string | null>(null);

  // Validate UUID format
  const validationResult = uuidSchema.safeParse(quizId);
  const isValidUuid = validationResult.success;

  // Compute isOwner derived state
  const isOwner = quiz?.user_id === currentUserId;

  const fetchQuiz = useCallback(
    async (signal?: AbortSignal) => {
      if (!isValidUuid) {
        setError("Invalid quiz ID format");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/quizzes/${quizId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal,
        });

        // Handle authentication errors
        if (response.status === 401) {
          navigate(`/login?redirect=/quizzes/${quizId}`);
          throw new Error("Session expired. Please log in again.");
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            message: "Failed to fetch quiz",
          }));

          // Map error codes to user-friendly messages
          if (response.status === 404) {
            throw new Error("Quiz not found or you don't have access to view it.");
          }
          if (response.status === 400) {
            throw new Error("Invalid quiz ID format.");
          }

          throw new Error(errorData.message || "Failed to load quiz. Please try again.");
        }

        const quizData: QuizDetailDTO = await response.json();
        setQuiz(quizData);
      } catch (err) {
        // Don't set error for aborted requests
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        // Handle network errors
        if (err instanceof TypeError && err.message.includes("fetch")) {
          setError("Unable to connect. Please check your internet connection.");
        } else {
          const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
          setError(errorMessage);
        }

        // eslint-disable-next-line no-console
        console.error("Error fetching quiz:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [quizId, isValidUuid]
  );

  const deleteQuiz = useCallback(async () => {
    if (!isValidUuid) {
      throw new Error("Invalid quiz ID format");
    }

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      // Handle authentication errors
      if (response.status === 401) {
        navigate("/login");
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: "Failed to delete quiz",
        }));

        // Map error codes to user-friendly messages
        if (response.status === 403) {
          throw new Error("You don't have permission to delete this quiz.");
        }
        if (response.status === 404) {
          throw new Error("Quiz not found.");
        }

        throw new Error(errorData.message || "Failed to delete quiz. Please try again.");
      }

      // Success - navigate to dashboard
      navigate("/");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error deleting quiz:", err);
      throw err;
    }
  }, [quizId, isValidUuid]);

  const refetch = useCallback(async () => {
    await fetchQuiz();
  }, [fetchQuiz]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchQuiz(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchQuiz]);

  return {
    quiz,
    isLoading,
    error,
    isOwner,
    refetch,
    deleteQuiz,
  };
}
