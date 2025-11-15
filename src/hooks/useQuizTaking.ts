import { useState, useEffect, useCallback, useMemo } from "react";
import { navigate } from "astro:transitions/client";
import { z } from "zod";
import { getDemoQuizById } from "../data/demoQuizzes";
import type {
  QuizDetailDTO,
  QuizAttemptDTO,
  QuestionWithOptionsDTO,
  TakingState,
  QuizResult,
  NavigationState,
  ProgressInfo,
} from "../types";

interface UseQuizTakingParams {
  quizId: string;
  currentUserId?: string;
  isDemo?: boolean;
}

interface UseQuizTakingReturn {
  // State
  takingState: TakingState;
  currentQuestion: QuestionWithOptionsDTO | null;
  navigationState: NavigationState;
  progressInfo: ProgressInfo;
  isDemoMode: boolean;

  // Actions
  selectOption: (questionId: string, optionId: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  submitQuiz: () => Promise<void>;
  retryQuiz: () => Promise<void>;

  // Computed
  result: QuizResult | null;
}

const uuidSchema = z.string().uuid();

/**
 * Custom hook for managing quiz-taking flow
 * Handles quiz loading, attempt creation, answer tracking, submission, and results
 */
export function useQuizTaking(params: UseQuizTakingParams): UseQuizTakingReturn {
  const { quizId, currentUserId, isDemo = false } = params;

  // Demo mode is when isDemo is true (regardless of authentication status)
  // Signed-in users can still take demo quizzes without creating attempts
  const isDemoMode = isDemo;

  // Validate UUID format
  const validationResult = uuidSchema.safeParse(quizId);
  const isValidUuid = validationResult.success;

  // Core state
  const [takingState, setTakingState] = useState<TakingState>({
    phase: "loading",
    quiz: null,
    attempt: null,
    currentQuestionIndex: 0,
    userAnswers: {},
    score: null,
    error: null,
  });

  /**
   * Calculate score by comparing user answers to correct answers
   */
  const calculateScore = useCallback((quiz: QuizDetailDTO, userAnswers: Record<string, string[]>): number => {
    if (!quiz.questions) {
      return 0;
    }

    let correctCount = 0;

    quiz.questions.forEach((question) => {
      const userSelectedIds = userAnswers[question.id] || [];
      const correctOptionIds = question.options.filter((opt) => opt.is_correct).map((opt) => opt.id);

      // Check if user's answer matches correct answer(s)
      const isCorrect =
        userSelectedIds.length === correctOptionIds.length &&
        userSelectedIds.every((id) => correctOptionIds.includes(id));

      if (isCorrect) {
        correctCount++;
      }
    });

    return correctCount;
  }, []);

  /**
   * Select or deselect an option for a question
   * Currently supports single-answer only (replaces previous selection)
   */
  const selectOption = useCallback((questionId: string, optionId: string) => {
    setTakingState((prev) => {
      // For single-answer questions, replace the selection
      return {
        ...prev,
        userAnswers: {
          ...prev.userAnswers,
          [questionId]: [optionId],
        },
      };
    });
  }, []);

  /**
   * Navigate to next question
   */
  const nextQuestion = useCallback(() => {
    setTakingState((prev) => {
      if (!prev.quiz?.questions) {
        return prev;
      }

      const maxIndex = prev.quiz.questions.length - 1;
      if (prev.currentQuestionIndex < maxIndex) {
        return {
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
        };
      }
      return prev;
    });
  }, []);

  /**
   * Navigate to previous question
   */
  const previousQuestion = useCallback(() => {
    setTakingState((prev) => {
      if (prev.currentQuestionIndex > 0) {
        return {
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex - 1,
        };
      }
      return prev;
    });
  }, []);

  /**
   * Submit quiz answers and calculate score
   */
  const submitQuiz = useCallback(async () => {
    try {
      // Use functional update to get current state
      await new Promise<void>((resolve, reject) => {
        setTakingState((prev) => {
          const { quiz, userAnswers } = prev;

          if (!quiz) {
            reject(new Error("Quiz data is missing"));
            return prev;
          }

          // Calculate score
          const calculatedScore = calculateScore(quiz, userAnswers);

          // For demo mode, just calculate score locally without API calls
          if (isDemoMode) {
            resolve();
            return {
              ...prev,
              phase: "completed",
              score: calculatedScore,
            };
          }

          // Set to submitting for non-demo mode
          resolve();
          return {
            ...prev,
            phase: "submitting",
          };
        });
      });

      // If demo mode, we're done
      if (isDemoMode) {
        return;
      }

      // For regular quizzes, continue with API calls
      const currentState = await new Promise<typeof takingState>((resolve) => {
        setTakingState((prev) => {
          resolve(prev);
          return prev;
        });
      });

      const { quiz, attempt, userAnswers } = currentState;

      if (!quiz) {
        throw new Error("Quiz data is missing");
      }

      const calculatedScore = calculateScore(quiz, userAnswers);

      // For regular quizzes, save to database
      if (!attempt) {
        throw new Error("Attempt data is missing");
      }

      // Transform userAnswers to API format
      const responses = Object.entries(userAnswers).map(([questionId, selectedOptionIds]) => ({
        question_id: questionId,
        selected_options: selectedOptionIds,
      }));

      // Submit responses
      const responsesResponse = await fetch(`/api/attempts/${attempt.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ responses }),
      });

      if (responsesResponse.status === 401) {
        navigate(`/login?redirect=/quizzes/${quizId}/take`);
        return;
      }

      if (!responsesResponse.ok) {
        const errorData = await responsesResponse.json().catch(() => ({
          message: "Failed to submit responses",
        }));

        throw new Error(errorData.message || "Failed to submit answers. Please try again.");
      }

      // Update attempt with score (as raw count, not percentage)
      const updateResponse = await fetch(`/api/quizzes/${quizId}/attempts/${attempt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: "completed",
          score: calculatedScore,
          completed_at: new Date().toISOString(),
        }),
      });

      if (updateResponse.status === 401) {
        navigate(`/login?redirect=/quizzes/${quizId}/take`);
        return;
      }

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({
          message: "Failed to update attempt",
        }));

        throw new Error(errorData.message || "Failed to save score. Please try again.");
      }

      // Set state to 'completed'
      setTakingState((prev) => ({
        ...prev,
        phase: "completed",
        score: calculatedScore,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setTakingState((prev) => ({
        ...prev,
        phase: "error",
        error: errorMessage,
      }));

      // eslint-disable-next-line no-console
      console.error("Error submitting quiz:", err);
    }
  }, [quizId, calculateScore, isDemoMode]);

  /**
   * Retry quiz by creating a new attempt
   */
  const retryQuiz = useCallback(async () => {
    setTakingState((prev) => ({
      ...prev,
      phase: "loading",
      error: null,
    }));

    try {
      if (!takingState.quiz) {
        throw new Error("Quiz data is missing");
      }

      // For demo mode, just reset state without creating an attempt
      if (isDemoMode) {
        setTakingState((prev) => ({
          phase: "taking",
          quiz: prev.quiz,
          attempt: null,
          currentQuestionIndex: 0,
          userAnswers: {},
          score: null,
          error: null,
        }));
        return;
      }

      // Create new attempt for regular quizzes
      const attemptResponse = await fetch(`/api/quizzes/${quizId}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quiz_id: quizId }),
      });

      if (attemptResponse.status === 401) {
        navigate(`/login?redirect=/quizzes/${quizId}/take`);
        return;
      }

      if (!attemptResponse.ok) {
        const errorData = await attemptResponse.json().catch(() => ({
          message: "Failed to create quiz attempt",
        }));

        throw new Error(errorData.message || "Failed to start new attempt. Please try again.");
      }

      const attempt: QuizAttemptDTO = await attemptResponse.json();

      // Reset state
      setTakingState((prev) => ({
        phase: "taking",
        quiz: prev.quiz,
        attempt,
        currentQuestionIndex: 0,
        userAnswers: {},
        score: null,
        error: null,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setTakingState((prev) => ({
        ...prev,
        phase: "error",
        error: errorMessage,
      }));

      // eslint-disable-next-line no-console
      console.error("Error retrying quiz:", err);
    }
  }, [quizId, takingState.quiz, isDemoMode]);

  // Computed: Current question
  const currentQuestion = useMemo(() => {
    if (!takingState.quiz?.questions) {
      return null;
    }
    return takingState.quiz.questions[takingState.currentQuestionIndex] || null;
  }, [takingState.quiz, takingState.currentQuestionIndex]);

  // Computed: Navigation state
  const navigationState = useMemo<NavigationState>(() => {
    const totalQuestions = takingState.quiz?.questions?.length || 0;
    const { currentQuestionIndex } = takingState;

    return {
      currentQuestionIndex,
      totalQuestions,
      canGoPrevious: currentQuestionIndex > 0,
      canGoNext: currentQuestionIndex < totalQuestions - 1,
      isLastQuestion: currentQuestionIndex === totalQuestions - 1,
      isFirstQuestion: currentQuestionIndex === 0,
    };
  }, [takingState]);

  // Computed: Progress info
  const progressInfo = useMemo<ProgressInfo>(() => {
    const totalQuestions = takingState.quiz?.questions?.length || 0;
    const current = takingState.currentQuestionIndex + 1; // 1-indexed
    const answered = Object.keys(takingState.userAnswers).filter(
      (questionId) => takingState.userAnswers[questionId].length > 0
    ).length;
    const percentage = totalQuestions > 0 ? (current / totalQuestions) * 100 : 0;

    return {
      current,
      total: totalQuestions,
      percentage,
      answered,
    };
  }, [takingState.quiz, takingState.currentQuestionIndex, takingState.userAnswers]);

  // Computed: Result
  const result = useMemo<QuizResult | null>(() => {
    // For demo mode, attempt can be null
    if (takingState.phase !== "completed" || !takingState.quiz || takingState.score === null) {
      return null;
    }

    // For non-demo mode, require attempt
    if (!isDemoMode && !takingState.attempt) {
      return null;
    }

    const totalQuestions = takingState.quiz.questions?.length || 0;
    const percentage = totalQuestions > 0 ? (takingState.score / totalQuestions) * 100 : 0;

    return {
      attemptId: takingState.attempt?.id || "demo",
      score: takingState.score,
      totalQuestions,
      percentage,
      correctAnswers: takingState.score,
      userAnswers: takingState.userAnswers,
      quiz: takingState.quiz,
    };
  }, [takingState, isDemoMode]);

  // Initialize quiz on mount - only run once per quizId change
  useEffect(() => {
    // For demo quizzes, skip UUID validation
    if (!isDemo && !isValidUuid) {
      setTakingState({
        phase: "error",
        quiz: null,
        attempt: null,
        currentQuestionIndex: 0,
        userAnswers: {},
        score: null,
        error: "Invalid quiz ID format",
      });
      return;
    }

    // Reset state when quizId changes and start loading
    setTakingState({
      phase: "loading",
      quiz: null,
      attempt: null,
      currentQuestionIndex: 0,
      userAnswers: {},
      score: null,
      error: null,
    });

    // Define async function inside effect to avoid stale closure
    const fetchQuizAndCreateAttempt = async () => {
      try {
        let quiz: QuizDetailDTO;

        // For demo quizzes, load from demo data
        if (isDemo) {
          const demoQuiz = getDemoQuizById(quizId);
          if (!demoQuiz) {
            throw new Error("Demo quiz not found.");
          }

          // Transform demo quiz to QuizDetailDTO format
          quiz = {
            id: demoQuiz.id,
            title: demoQuiz.title,
            description: demoQuiz.description,
            user_id: "demo",
            user_email: "demo@example.com",
            status: "public",
            source: "manual",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            questions: demoQuiz.questions.map((q, qIdx) => ({
              id: q.id,
              quiz_id: demoQuiz.id,
              content: q.question,
              position: qIdx,
              status: "active",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              options: q.options.map((opt, idx) => ({
                id: opt.id,
                question_id: q.id,
                content: opt.text,
                is_correct: opt.isCorrect,
                position: idx,
                created_at: new Date().toISOString(),
              })),
            })),
          };
        } else {
          // Fetch regular quiz details from API
          const quizResponse = await fetch(`/api/quizzes/${quizId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });

          if (quizResponse.status === 401) {
            navigate(`/login?redirect=/quizzes/${quizId}/take`);
            return;
          }

          if (!quizResponse.ok) {
            const errorData = await quizResponse.json().catch(() => ({
              message: "Failed to load quiz",
            }));

            // eslint-disable-next-line no-console
            console.error("Quiz fetch error:", {
              status: quizResponse.status,
              quizId,
              errorData,
            });

            if (quizResponse.status === 404) {
              throw new Error("Quiz not found or you don't have access to it.");
            }
            if (quizResponse.status === 400) {
              throw new Error("Invalid quiz ID.");
            }

            throw new Error(errorData.message || "Failed to load quiz. Please try again.");
          }

          quiz = await quizResponse.json();
        }

        // eslint-disable-next-line no-console
        console.log("Quiz fetched successfully:", {
          id: quiz.id,
          title: quiz.title,
          questionCount: quiz.questions?.length || 0,
          isDemo,
        });

        // Validate quiz has questions
        if (!quiz.questions || quiz.questions.length === 0) {
          throw new Error("This quiz has no questions to take.");
        }

        // For demo mode, skip attempt creation
        if (isDemoMode) {
          setTakingState({
            phase: "taking",
            quiz,
            attempt: null,
            currentQuestionIndex: 0,
            userAnswers: {},
            score: null,
            error: null,
          });
          return;
        }

        // Create quiz attempt for regular quizzes or authenticated users taking demos
        const attemptResponse = await fetch(`/api/quizzes/${quizId}/attempts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ quiz_id: quizId }),
        });

        if (attemptResponse.status === 401) {
          navigate(`/login?redirect=/quizzes/${quizId}/take`);
          return;
        }

        if (!attemptResponse.ok) {
          const errorData = await attemptResponse.json().catch(() => ({
            message: "Failed to create quiz attempt",
          }));

          throw new Error(errorData.message || "Failed to start quiz. Please try again.");
        }

        const attempt: QuizAttemptDTO = await attemptResponse.json();

        // Set state to 'taking'
        setTakingState({
          phase: "taking",
          quiz,
          attempt,
          currentQuestionIndex: 0,
          userAnswers: {},
          score: null,
          error: null,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        setTakingState((prev) => ({
          ...prev,
          phase: "error",
          error: errorMessage,
        }));

        // eslint-disable-next-line no-console
        console.error("Error starting quiz:", err);
      }
    };

    fetchQuizAndCreateAttempt();
  }, [quizId, isValidUuid, isDemo, isDemoMode]); // Only depend on quizId and isValidUuid

  return {
    takingState,
    currentQuestion,
    navigationState,
    progressInfo,
    isDemoMode,
    selectOption,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    retryQuiz,
    result,
  };
}
