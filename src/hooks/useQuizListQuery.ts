import { useQuery } from "@tanstack/react-query";
import type { QuizListResponse, QuizStatus } from "../types";

interface UseQuizListQueryParams {
  status?: QuizStatus;
  owned?: boolean;
  page: number;
  limit?: number;
  enabled?: boolean;
  initialData?: QuizListResponse;
}

export function useQuizListQuery(params: UseQuizListQueryParams) {
  const { status, owned, page, limit = 10, enabled = true, initialData } = params;

  return useQuery({
    queryKey: ["quizzes", { status, owned, page, limit }],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort: "created_at",
        order: "desc",
      });

      if (status) queryParams.set("status", status);
      if (owned !== undefined) queryParams.set("owned", String(owned));

      const response = await fetch(`/api/quizzes?${queryParams}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch quizzes");
      }

      return response.json() as Promise<QuizListResponse>;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: false, // Don't refetch if data is fresh
    retry: 2,
    initialData,
  });
}
