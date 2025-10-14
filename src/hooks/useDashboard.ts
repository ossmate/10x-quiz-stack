import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuizList } from "./useQuizList.ts";
import type { TabType } from "../types/dashboard.types.ts";

/**
 * Return type for useDashboard hook
 */
interface UseDashboardReturn {
  activeTab: TabType;
  myQuizzes: ReturnType<typeof useQuizList>;
  publicQuizzes: ReturnType<typeof useQuizList>;
  currentUserId: string | null;
  setActiveTab: (tab: TabType) => void;
  goToPage: (page: number) => void;
  refetchMyQuizzes: () => Promise<void>;
  refetchPublicQuizzes: () => Promise<void>;
  dismissError: (tab: TabType) => void;
}

/**
 * Main dashboard state management hook
 * Coordinates tab switching, pagination, and data fetching for both quiz lists
 *
 * @returns Dashboard state and actions
 */
export function useDashboard(): UseDashboardReturn {
  const [activeTab, setActiveTab] = useState<TabType>("my-quizzes");
  const [myQuizzesPage, setMyQuizzesPage] = useState(1);
  const [publicQuizzesPage, setPublicQuizzesPage] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/session");

        if (!response.ok) {
          throw new Error("Failed to get session");
        }

        const data = await response.json();

        if (data.user && data.user.id) {
          setCurrentUserId(data.user.id);
          // Debug logging
          // eslint-disable-next-line no-console
          console.log("Dashboard initialized with user:", data.user.id);
        } else {
          throw new Error("No user in session");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to get user";
        // eslint-disable-next-line no-console
        console.error("Failed to fetch user session:", errorMessage);
        // In production, redirect to login
        // window.location.href = '/login?redirect=/dashboard';
      }
    };

    fetchUser();
  }, []);

  // Fetch My Quizzes (all quizzes, will be filtered by user_id on backend)
  const myQuizzesQuery = useQuizList({
    page: myQuizzesPage,
    limit: 10,
    enabled: activeTab === "my-quizzes" && currentUserId !== null,
  });

  // Fetch Public Quizzes
  const publicQuizzesQuery = useQuizList({
    visibility: "public",
    page: publicQuizzesPage,
    limit: 10,
    enabled: activeTab === "public-quizzes",
  });

  // Filter My Quizzes by current user ID (client-side filtering)
  // Note: This is a temporary solution until backend adds 'owned=true' parameter
  const filteredMyQuizzes = useMemo(() => {
    if (!myQuizzesQuery.data || !currentUserId) {
      return myQuizzesQuery;
    }

    const filteredQuizzes = myQuizzesQuery.data.quizzes.filter((quiz) => quiz.user_id === currentUserId);

    // Debug logging for development
    // eslint-disable-next-line no-console
    console.log("Filtering My Quizzes:", {
      totalQuizzes: myQuizzesQuery.data.quizzes.length,
      currentUserId,
      filteredCount: filteredQuizzes.length,
      sampleUserIds: myQuizzesQuery.data.quizzes.slice(0, 3).map((q) => q.user_id),
    });

    return {
      ...myQuizzesQuery,
      data: {
        ...myQuizzesQuery.data,
        quizzes: filteredQuizzes,
        pagination: {
          ...myQuizzesQuery.data.pagination,
          totalItems: filteredQuizzes.length,
          totalPages: Math.ceil(filteredQuizzes.length / (myQuizzesQuery.data.pagination.limit || 10)),
        },
      },
    };
  }, [myQuizzesQuery, currentUserId]);

  /**
   * Handle tab change
   */
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  /**
   * Navigate to a specific page for the active tab
   */
  const goToPage = useCallback(
    (page: number) => {
      if (activeTab === "my-quizzes") {
        const maxPage = filteredMyQuizzes.data?.pagination.totalPages || 1;
        if (page < 1 || page > maxPage) {
          return;
        }
        setMyQuizzesPage(page);
      } else {
        const maxPage = publicQuizzesQuery.data?.pagination.totalPages || 1;
        if (page < 1 || page > maxPage) {
          return;
        }
        setPublicQuizzesPage(page);
      }
    },
    [activeTab, filteredMyQuizzes.data?.pagination.totalPages, publicQuizzesQuery.data?.pagination.totalPages]
  );

  /**
   * Refetch My Quizzes
   */
  const refetchMyQuizzes = useCallback(async () => {
    await myQuizzesQuery.refetch();
  }, [myQuizzesQuery]);

  /**
   * Refetch Public Quizzes
   */
  const refetchPublicQuizzes = useCallback(async () => {
    await publicQuizzesQuery.refetch();
  }, [publicQuizzesQuery]);

  /**
   * Dismiss error for a specific tab
   * Note: This doesn't clear the error state as it's managed by useQuizList
   * User will need to retry to clear the error
   */
  const dismissError = useCallback(
    (tab: TabType) => {
      // Error dismissal logic can be implemented here if needed
      // For now, errors are cleared on retry via refetch
      if (tab === "my-quizzes") {
        refetchMyQuizzes();
      } else {
        refetchPublicQuizzes();
      }
    },
    [refetchMyQuizzes, refetchPublicQuizzes]
  );

  return {
    activeTab,
    myQuizzes: filteredMyQuizzes,
    publicQuizzes: publicQuizzesQuery,
    currentUserId,
    setActiveTab: handleTabChange,
    goToPage,
    refetchMyQuizzes,
    refetchPublicQuizzes,
    dismissError,
  };
}
