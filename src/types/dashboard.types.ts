import type { QuizDTO } from "../types.ts";

/**
 * Tab identifier type for dashboard navigation
 */
export type TabType = "my-quizzes" | "public-quizzes";

/**
 * Pagination metadata from API responses
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

/**
 * State for a single quiz list with loading and error states
 */
export interface QuizListData {
  quizzes: QuizDTO[];
  pagination: PaginationMetadata;
  isLoading: boolean;
  error: string | null;
}

/**
 * Overall dashboard view state
 */
export interface DashboardViewState {
  activeTab: TabType;
  myQuizzes: QuizListData;
  publicQuizzes: QuizListData;
  currentUserId: string;
}

/**
 * Enhanced quiz data for display with computed properties
 */
export interface QuizCardViewModel extends QuizDTO {
  formattedCreatedAt: string;
  questionCount?: number;
  isOwned: boolean;
}

/**
 * Query parameters for fetching quiz lists
 */
export interface QuizListQuery {
  page?: number;
  limit?: number;
  sort?: "created_at" | "title" | "updated_at";
  order?: "asc" | "desc";
  visibility?: "public" | "private";
}
