import { useState, useEffect, useCallback, useMemo } from "react";
import { navigate } from "astro:transitions/client";
import type { QuizAttemptSummary, QuickStatsData, QuizAttemptsListResponse } from "../types/quiz-attempts.types";
import { z } from "zod";

interface UseQuizAttemptHistoryParams {
  quizId: string;
  userId?: string;
}

interface UseQuizAttemptHistoryReturn {
  attempts: QuizAttemptSummary[];
  quickStats: QuickStatsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const uuidSchema = z.string().uuid();

export function useQuizAttemptHistory(params: UseQuizAttemptHistoryParams): UseQuizAttemptHistoryReturn {
  const { quizId, userId } = params;
  const [attempts, setAttempts] = useState<QuizAttemptSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate UUID format
  const validationResult = uuidSchema.safeParse(quizId);
  const isValidUuid = validationResult.success;

  const fetchAttempts = useCallback(
    async (signal?: AbortSignal) => {
      // Don't fetch if no user ID or invalid UUID
      if (!userId) {
        setAttempts([]);
        setIsLoading(false);
        return;
      }

      if (!isValidUuid) {
        setError("Invalid quiz ID format");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/quizzes/${quizId}/attempts`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal,
        });

        // Handle authentication errors
        if (response.status === 401) {
          navigate(`/login?redirect=/quizzes/${quizId}`);
          throw new Error("Authentication required");
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: "Failed to fetch attempt history",
          }));

          // Map error codes to user-friendly messages
          if (response.status === 404) {
            throw new Error("Quiz not found.");
          }

          throw new Error(errorData.error || "Failed to load attempt history. Please try again.");
        }

        const data: QuizAttemptsListResponse = await response.json();

        // Transform attempts to ensure score is a percentage and time_spent is calculated
        // Legacy attempts may have raw counts instead of percentages and missing time_spent
        const transformedAttempts = (data.attempts || []).map((attempt) => {
          const transformedAttempt = { ...attempt };

          // If score is less than or equal to total_questions, it's likely a raw count
          // Convert it to percentage
          if (attempt.total_questions > 0 && attempt.score <= attempt.total_questions) {
            transformedAttempt.score = Math.round((attempt.score / attempt.total_questions) * 100);
          }

          // If time_spent is null but we have both created_at and completed_at, calculate it
          if (transformedAttempt.time_spent === null && transformedAttempt.completed_at) {
            const startTime = new Date(transformedAttempt.created_at).getTime();
            const endTime = new Date(transformedAttempt.completed_at).getTime();
            transformedAttempt.time_spent = Math.round((endTime - startTime) / 1000);
          }

          return transformedAttempt;
        });

        // Sort by date, newest first
        const sortedAttempts = transformedAttempts.sort(
          (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        );

        setAttempts(sortedAttempts);
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
        console.error("Error fetching quiz attempts:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [quizId, userId, isValidUuid]
  );

  // Compute quick stats from attempts
  const quickStats = useMemo<QuickStatsData | null>(() => {
    if (attempts.length === 0) return null;

    const scores = attempts.map((a) => a.score);
    const bestScore = Math.max(...scores);
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

    // Calculate trend (compare recent vs early attempts)
    let trend: "improving" | "declining" | "stable" = "stable";
    let trendValue = 0;

    if (attempts.length >= 2) {
      // Compare last attempt to first attempt
      const lastScore = attempts[0].score; // Newest (sorted desc)
      const firstScore = attempts[attempts.length - 1].score; // Oldest
      const diff = lastScore - firstScore;

      if (diff > 5) {
        trend = "improving";
        trendValue = diff;
      } else if (diff < -5) {
        trend = "declining";
        trendValue = diff;
      }
    }

    return {
      bestScore,
      averageScore,
      totalAttempts: attempts.length,
      trend,
      trendValue,
    };
  }, [attempts]);

  const refetch = useCallback(async () => {
    await fetchAttempts();
  }, [fetchAttempts]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchAttempts(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchAttempts]);

  return {
    attempts,
    quickStats,
    isLoading,
    error,
    refetch,
  };
}
