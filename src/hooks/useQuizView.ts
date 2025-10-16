import { useState, useEffect, useCallback } from "react";
import type { QuizDetailDTO } from "../types";
import type { TabItem } from "../types/management.types";

export interface UseQuizViewOptions {
  quizId: string;
  initialTab?: string;
}

export interface UseQuizViewReturn {
  quiz: QuizDetailDTO | null;
  isLoading: boolean;
  error: string | null;
  activeTab: string;
  tabs: TabItem[];
  setActiveTab: (tabId: string) => void;
  refetch: () => Promise<void>;
  deleteQuiz: () => Promise<boolean>;
}

/**
 * Custom hook for managing quiz detail view state
 * Handles fetching, tab management, and quiz operations
 */
export function useQuizView({ quizId, initialTab = "details" }: UseQuizViewOptions): UseQuizViewReturn {
  const [quiz, setQuiz] = useState<QuizDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Define available tabs
  const tabs: TabItem[] = [
    { id: "details", label: "Details", isActive: activeTab === "details" },
    { id: "edit", label: "Edit", isActive: activeTab === "edit" },
    { id: "statistics", label: "Statistics", isActive: activeTab === "statistics" },
  ];

  // Fetch quiz data
  const fetchQuiz = useCallback(async () => {
    if (!quizId) {
      setError("Quiz ID is required");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/quizzes/${quizId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch quiz" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setQuiz(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load quiz";
      setError(errorMessage);
      setQuiz(null);
    } finally {
      setIsLoading(false);
    }
  }, [quizId]);

  // Fetch quiz on mount and when quizId changes
  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  // Handle tab change
  const handleSetActiveTab = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  // Delete quiz
  const deleteQuiz = useCallback(async (): Promise<boolean> => {
    if (!quizId) {
      return false;
    }

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to delete quiz" }));
        throw new Error(errorData.error || "Failed to delete quiz");
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete quiz";
      setError(errorMessage);
      return false;
    }
  }, [quizId]);

  return {
    quiz,
    isLoading,
    error,
    activeTab,
    tabs,
    setActiveTab: handleSetActiveTab,
    refetch: fetchQuiz,
    deleteQuiz,
  };
}
