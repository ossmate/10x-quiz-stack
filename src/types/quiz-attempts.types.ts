import type { Tables } from "../db/database.types";

// Database type from Supabase
export type QuizAttemptDTO = Tables<"quiz_attempts">;

// Simplified attempt data for table display
export interface QuizAttemptSummary {
  id: string;
  quiz_id: string;
  created_at: string; // Using created_at as started_at
  completed_at: string;
  score: number; // 0-100 percentage
  total_questions: number;
  time_spent: number | null; // Duration in seconds
}

// Summary statistics across all attempts
export interface QuickStatsData {
  bestScore: number; // Highest score percentage
  averageScore: number; // Average of all scores
  totalAttempts: number; // Count of attempts
  trend: "improving" | "declining" | "stable";
  trendValue: number; // Percentage change (last vs first)
}

// Overall state for attempt history
export interface QuizAttemptHistoryState {
  attempts: QuizAttemptSummary[];
  quickStats: QuickStatsData | null;
  isLoading: boolean;
  error: string | null;
}

// API response for GET /api/quizzes/:quizId/attempts
export interface QuizAttemptsListResponse {
  attempts: QuizAttemptDTO[];
  stats: {
    best_score: number;
    average_score: number;
    total_attempts: number;
  };
}
