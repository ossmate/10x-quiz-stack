import { useState, useEffect, useCallback } from "react";
import { navigate } from "astro:transitions/client";
import type { QuizListResponse } from "../types.ts";

interface UseQuizListParams {
  visibility?: "public" | "private";
  page: number;
  limit?: number;
  enabled?: boolean;
}

interface UseQuizListReturn {
  data: QuizListResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useQuizList(params: UseQuizListParams): UseQuizListReturn {
  const { visibility, page, limit = 10, enabled = true } = params;
  const [data, setData] = useState<QuizListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizzes = useCallback(
    async (signal?: AbortSignal) => {
      if (!enabled) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const queryParams: Record<string, string> = {
          page: String(page),
          limit: String(limit),
          sort: "created_at",
          order: "desc",
        };

        if (visibility) {
          queryParams.visibility = visibility;
        }

        const searchParams = new URLSearchParams(queryParams);
        const url = `/api/quizzes?${searchParams.toString()}`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          signal,
        });

        if (response.status === 401) {
          navigate("/login?redirect=/dashboard");
          throw new Error("Unauthorized");
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Failed to fetch quizzes" }));
          throw new Error(errorData.message || `Failed to fetch quizzes (${response.status})`);
        }

        const responseData: QuizListResponse = await response.json();
        setData(responseData);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [enabled, page, limit, visibility]
  );

  useEffect(() => {
    const abortController = new AbortController();
    fetchQuizzes(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchQuizzes]);

  const refetch = useCallback(async () => {
    await fetchQuizzes();
  }, [fetchQuizzes]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
