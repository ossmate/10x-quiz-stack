import { useState, useEffect, useCallback } from "react";
import type { QuizListResponse } from "../types.ts";

/**
 * Parameters for useQuizList hook
 */
interface UseQuizListParams {
  visibility?: "public" | "private";
  page: number;
  limit?: number;
  enabled?: boolean;
}

/**
 * Return type for useQuizList hook
 */
interface UseQuizListReturn {
  data: QuizListResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing a list of quizzes with pagination
 *
 * @param params - Configuration for quiz list fetching
 * @returns Quiz list data, loading state, error state, and refetch function
 */
export function useQuizList(params: UseQuizListParams): UseQuizListReturn {
  const { visibility, page, limit = 10, enabled = true } = params;
  const [data, setData] = useState<QuizListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch quizzes from the API
   */
  const fetchQuizzes = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build query parameters
      const queryParams: Record<string, string> = {
        page: String(page),
        limit: String(limit),
        sort: "created_at",
        order: "desc",
      };

      if (visibility) {
        queryParams.visibility = visibility;
      }

      // Convert query params to URL search params
      const searchParams = new URLSearchParams(queryParams);
      const url = `/api/quizzes?${searchParams.toString()}`;

      // Debug logging
      // eslint-disable-next-line no-console
      console.log("Fetching quizzes from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      // Handle authentication errors
      if (response.status === 401) {
        window.location.href = "/login?redirect=/dashboard";
        throw new Error("Unauthorized");
      }

      // Handle other error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch quizzes" }));
        // eslint-disable-next-line no-console
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(errorData.message || `Failed to fetch quizzes (${response.status})`);
      }

      const responseData: QuizListResponse = await response.json();
      setData(responseData);

      // Debug logging for development
      // eslint-disable-next-line no-console
      console.log("Fetched quizzes:", {
        count: responseData.quizzes.length,
        page: responseData.pagination.page,
        totalPages: responseData.pagination.totalPages,
        visibility,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      // eslint-disable-next-line no-console
      console.error("Error fetching quizzes:", errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, page, limit, visibility]);

  // Fetch quizzes when parameters change
  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchQuizzes,
  };
}
