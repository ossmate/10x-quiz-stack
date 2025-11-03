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
    isPublishing: false,
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
      isPublishing: false,
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

    // Sanitize questions - filter out empty questions, placeholder text, and empty options
    const sanitizedQuestions = quiz.questions
      .filter((q) => {
        const content = q.content?.trim() || "";
        // Filter out empty questions and placeholder text
        return content.length > 0 && content !== "New question";
      })
      .map((q, qIndex) => ({
        content: q.content.trim(),
        explanation: q.explanation,
        position: qIndex + 1, // Reindex positions after filtering
        options: q.options
          .filter((opt) => {
            const content = opt.content?.trim() || "";
            // Filter out empty options and placeholders like "Option 1", "Option 2", "New option"
            return content.length > 0 && !/^(Option \d+|New option)$/i.test(content);
          })
          .map((opt, optIndex) => ({
            content: opt.content.trim(),
            is_correct: opt.is_correct,
            position: optIndex + 1, // Reindex positions after filtering
          })),
      }))
      .filter((q) => q.options.length >= 2); // Remove questions with less than 2 valid options

    // Validate sanitized data
    if (sanitizedQuestions.length === 0) {
      throw new Error("Quiz must have at least one valid question with 2 or more options");
    }

    // Set publishing state
    setState((prev) => ({
      ...prev,
      isPublishing: true,
    }));

    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: quiz.title.trim(),
          description: quiz.description?.trim() || "",
          source: quiz.source || "ai_generated",
          ai_model: quiz.ai_model,
          ai_prompt: quiz.ai_prompt,
          ai_temperature: quiz.ai_temperature,
          questions: sanitizedQuestions,
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
        redirectUrl: savedQuiz.redirectUrl,
      };
    } catch (error) {
      // Reset publishing state on error
      setState((prev) => ({
        ...prev,
        isPublishing: false,
      }));
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
