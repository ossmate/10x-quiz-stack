import { useState, useCallback } from "react";
import type { GenerationState, AIQuizGenerationDTO, QuizDetailDTO } from "../../types";
import { AIQuizClientService } from "../../lib/services/ai-quiz-client.service";

/**
 * Custom hook for managing AI quiz generation workflow
 * Handles state transitions and API integration for quiz generation
 */
export function useAIQuizGeneration() {
  // Initialize state
  const [state, setState] = useState<GenerationState>({
    status: "idle",
    prompt: "",
    generatedQuiz: null,
    error: null,
    isEditing: false,
  });

  /**
   * Generate a quiz using the provided prompt
   */
  const generateQuiz = useCallback(async (data: AIQuizGenerationDTO) => {
    // Update state to show loading
    setState((prev) => ({
      ...prev,
      status: "generating",
      prompt: data.prompt,
      error: null,
    }));

    // Call the service to generate the quiz
    await AIQuizClientService.generateQuiz({
      prompt: data.prompt,
      onSuccess: (quiz) => {
        setState((prev) => ({
          ...prev,
          status: "completed",
          generatedQuiz: quiz,
          error: null,
        }));
      },
      onError: (errorMessage) => {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: errorMessage,
        }));
      },
    });
  }, []);

  /**
   * Reset the generation state to idle
   */
  const resetGeneration = useCallback(() => {
    setState({
      status: "idle",
      prompt: "",
      generatedQuiz: null,
      error: null,
      isEditing: false,
    });
  }, []);

  /**
   * Toggle editing mode for the generated quiz
   */
  const toggleEdit = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isEditing: !prev.isEditing,
    }));
  }, []);

  /**
   * Update the generated quiz with edited content
   */
  const updateGeneratedQuiz = useCallback((updatedQuiz: QuizDetailDTO) => {
    setState((prev) => ({
      ...prev,
      generatedQuiz: updatedQuiz,
      isEditing: false,
    }));
  }, []);

  /**
   * Handle publishing of a generated quiz
   * Saves the quiz to the database via API
   */
  const publishQuiz = useCallback(async (quiz: QuizDetailDTO) => {
    // Validate quiz data before publishing
    if (!quiz.title?.trim()) {
      throw new Error("Quiz title is required");
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      throw new Error("Quiz must have at least one question");
    }

    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: quiz.title,
          description: quiz.description || "",
          visibility: quiz.visibility || "private",
          source: quiz.source || "ai_generated",
          ai_model: quiz.ai_model,
          ai_prompt: quiz.ai_prompt,
          ai_temperature: quiz.ai_temperature,
          questions: quiz.questions.map((q) => ({
            content: q.content,
            explanation: q.explanation,
            position: q.position,
            options: q.options.map((opt) => ({
              content: opt.content,
              is_correct: opt.is_correct,
              position: opt.position,
            })),
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to publish the quiz");
      }

      const savedQuiz = await response.json();
      return {
        success: true,
        quizId: savedQuiz.id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to publish the quiz";
      throw new Error(message);
    }
  }, []);

  return {
    state,
    generateQuiz,
    resetGeneration,
    toggleEdit,
    updateGeneratedQuiz,
    publishQuiz,
  };
}
