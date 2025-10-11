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
   * In a real implementation, this would save the quiz to the database
   */
  const publishQuiz = useCallback(async (quiz: QuizDetailDTO) => {
    try {
      // In a real implementation, this would call an API to save the quiz
      console.log("Publishing quiz:", quiz);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // For now, just return success and the quiz ID
      return {
        success: true,
        quizId: quiz.id || `quiz-${Date.now()}`,
      };
    } catch (error) {
      console.error("Error publishing quiz:", error);
      throw new Error("Failed to publish the quiz");
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
