import type { Tables, Enums } from "./db/database.types";

// Base Entity Types (derived from database tables)
export type Profile = Tables<"profiles">;
export type Quiz = Tables<"quizzes">;
export type Question = Tables<"questions">;
export type Answer = Tables<"answers">;
export type QuizAttempt = Tables<"quiz_attempts">;
export type AttemptAnswer = Tables<"attempt_answers">;
export type AIUsageLog = Tables<"ai_usage_logs">;

// DTOs - Data Transfer Objects

// Profile DTOs
export interface ProfileDTO {
  id: string;
  username: string;
  display_name: string; // Not in DB schema but in API plan
  avatar_url: string; // Not in DB schema but in API plan
  created_at: string;
  updated_at: string;
}

export interface ProfileCreateDTO {
  username: string;
  display_name: string;
  avatar_url?: string;
}

// Using type instead of empty interface extension to avoid linting issues
export type ProfileUpdateDTO = ProfileCreateDTO;
// Quiz DTOs
export type QuizSource = "manual" | "ai_generated";
export type QuizStatus = Enums<"quiz_status">;

export interface QuizDTO {
  id: string;
  user_id: string;
  user_email?: string; // Email of quiz creator from auth.users
  title: string;
  description: string; // Extracted from metadata
  status: QuizStatus; // Controls both publication state and visibility
  source: QuizSource; // Extracted from metadata
  ai_model?: string; // Extracted from metadata if source is ai_generated
  ai_prompt?: string; // Extracted from metadata if source is ai_generated
  ai_temperature?: number; // Extracted from metadata if source is ai_generated
  created_at: string;
  updated_at: string;
}

export interface QuizDetailDTO extends QuizDTO {
  questions?: QuestionWithOptionsDTO[];
}

export interface QuizMetadata {
  description: string;
  source: QuizSource;
  ai_model?: string;
  ai_prompt?: string;
  ai_temperature?: number;
}

export interface QuizCreateDTO {
  title: string;
  description: string;
  source: QuizSource;
  ai_model?: string;
  ai_prompt?: string;
  ai_temperature?: number;
}

export type QuizUpdateDTO = QuizCreateDTO;

export interface QuizListResponse {
  quizzes: QuizDTO[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

// Question DTOs
export interface QuestionDTO {
  id: string;
  quiz_id: string;
  content: string;
  explanation?: string; // Not directly in DB schema, might be in metadata or separate column
  position: number; // maps to order_index in DB
  status: "active" | "deleted"; // Derived from deleted_at
  created_at: string;
  updated_at: string;
}

export interface QuestionWithOptionsDTO extends QuestionDTO {
  options: OptionDTO[];
}

export interface QuestionCreateDTO {
  content: string;
  explanation?: string;
  position: number;
}

export type QuestionUpdateDTO = QuestionCreateDTO;

// Option/Answer DTOs
export interface OptionDTO {
  id: string;
  question_id: string;
  content: string;
  is_correct: boolean;
  position: number; // maps to order_index in DB
  created_at: string;
}

export interface OptionCreateDTO {
  content: string;
  is_correct: boolean;
  position: number;
}

export type OptionUpdateDTO = OptionCreateDTO;

// Quiz Attempt DTOs
export type QuizAttemptStatus = "in_progress" | "completed" | "abandoned";

export interface QuizAttemptDTO {
  id: string;
  user_id: string;
  quiz_id: string;
  status: QuizAttemptStatus; // Derived from completed_at
  score: number;
  total_questions: number;
  started_at: string; // maps to created_at
  completed_at: string | null;
}

export interface QuizAttemptCreateDTO {
  quiz_id: string;
}

export interface QuizAttemptUpdateDTO {
  status: QuizAttemptStatus;
  score: number;
  completed_at: string;
}

// Quiz Response DTOs
export interface QuizResponseDTO {
  id: string;
  quiz_attempt_id: string;
  question_id: string;
  selected_answer_id: string;
  created_at: string;
}

export interface QuizResponseCreateDTO {
  responses: {
    question_id: string;
    selected_options: string[]; // Array of option IDs
  }[];
}

// AI Quiz Generation
export interface AIQuizGenerationDTO {
  prompt: string;
}

// AI Quiz Generation Preview (response model for generate endpoint)
export interface AIGeneratedQuizPreview {
  title: string;
  description: string;
  source: QuizSource;
  ai_model: string;
  ai_prompt: string;
  ai_temperature: number;
  questions: AIGeneratedQuestionPreview[];
}

export interface AIGeneratedQuestionPreview {
  content: string;
  explanation?: string;
  position: number;
  options: AIGeneratedOptionPreview[];
}

export interface AIGeneratedOptionPreview {
  content: string;
  is_correct: boolean;
  position: number;
}

// Command Models

// AI Quiz Generation Command
// Internal command that includes app-level AI configuration
export interface GenerateAIQuizCommand {
  prompt: string;
  ai_model: string;
  ai_temperature: number;
}

// View Models

// AI Quiz Generation View State
export interface GenerationState {
  status: "idle" | "generating" | "completed" | "error";
  prompt: string;
  generatedQuiz: QuizDetailDTO | null;
  error: string | null;
  isEditing: boolean;
  isPublishing: boolean;
}

// Editable Quiz Data for forms
export interface EditableQuizData extends QuizDetailDTO {
  isDirty: boolean;
  validationErrors: {
    title?: string;
    description?: string;
    questions?: Record<
      string,
      {
        content?: string;
        options?: Record<string, string>;
      }
    >;
    general?: string[];
  };
}

// Quiz Generation Request for service layer
export interface QuizGenerationRequest {
  prompt: string;
  onSuccess: (quiz: QuizDetailDTO) => void;
  onError: (error: string) => void;
}

// Quiz Taking View Models

/**
 * State machine for quiz taking flow
 * Tracks the current phase and all necessary data for taking a quiz
 */
export interface TakingState {
  phase: "loading" | "ready" | "taking" | "submitting" | "completed" | "error";
  quiz: QuizDetailDTO | null;
  attempt: QuizAttemptDTO | null;
  currentQuestionIndex: number;
  userAnswers: Record<string, string[]>; // questionId -> selectedOptionIds[]
  score: number | null;
  error: string | null;
}

/**
 * Individual question answer for type safety
 */
export interface QuizAnswer {
  questionId: string;
  selectedOptionIds: string[];
}

/**
 * Complete results data for display after quiz completion
 */
export interface QuizResult {
  attemptId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  correctAnswers: number;
  userAnswers: Record<string, string[]>;
  quiz: QuizDetailDTO;
}

/**
 * Derived navigation state for button states
 */
export interface NavigationState {
  currentQuestionIndex: number;
  totalQuestions: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isLastQuestion: boolean;
  isFirstQuestion: boolean;
}

/**
 * Progress indicator metrics
 */
export interface ProgressInfo {
  current: number; // 1-indexed for display
  total: number;
  percentage: number; // 0-100
  answered: number; // Number of questions answered
}
