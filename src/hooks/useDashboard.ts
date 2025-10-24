import { useState, useEffect, useCallback } from "react";
import { useQuizListQuery } from "./useQuizListQuery.ts";
import type { TabType } from "../types/dashboard.types.ts";
import type { QuizListResponse } from "../types.ts";

/**
 * Return type for useDashboard hook
 */
interface UseDashboardReturn {
  activeTab: TabType;
  myQuizzes: ReturnType<typeof useQuizListQuery>;
  publicQuizzes: ReturnType<typeof useQuizListQuery>;
  currentUserId: string | null;
  setActiveTab: (tab: TabType) => void;
  goToPage: (page: number) => void;
  refetchMyQuizzes: () => Promise<void>;
  refetchPublicQuizzes: () => Promise<void>;
  dismissError: (tab: TabType) => void;
}

interface UseDashboardProps {
  initialMyQuizzes?: QuizListResponse;
}

/**
 * Main dashboard state management hook
 * Coordinates tab switching, pagination, and data fetching for both quiz lists
 *
 * @param props - Dashboard props including optional initial data for SSR
 * @returns Dashboard state and actions
 */
export function useDashboard(props: UseDashboardProps = {}): UseDashboardReturn {
  const { initialMyQuizzes } = props;
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

  // Fetch My Quizzes using server-side filtering (owned=true)
  const myQuizzesQuery = useQuizListQuery({
    owned: true,
    page: myQuizzesPage,
    limit: 10,
    enabled: true,
    initialData: initialMyQuizzes,
  });

  // Fetch Public Quizzes - only enabled when tab is active (lazy loading)
  const publicQuizzesQuery = useQuizListQuery({
    status: "public",
    page: publicQuizzesPage,
    limit: 10,
    enabled: activeTab === "public-quizzes",
  });

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
        const maxPage = myQuizzesQuery.data?.pagination.totalPages || 1;
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
    [activeTab, myQuizzesQuery.data?.pagination.totalPages, publicQuizzesQuery.data?.pagination.totalPages]
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
   * Triggers a refetch to clear the error and retry
   */
  const dismissError = useCallback(
    (tab: TabType) => {
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
    myQuizzes: myQuizzesQuery,
    publicQuizzes: publicQuizzesQuery,
    currentUserId,
    setActiveTab: handleTabChange,
    goToPage,
    refetchMyQuizzes,
    refetchPublicQuizzes,
    dismissError,
  };
}
