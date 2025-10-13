import type { QuizDetailDTO, QuizGenerationRequest } from "../../types";
import { aiQuizGeneratorService, type AIGeneratedQuizContent } from "./ai-quiz-generator.service";

/**
 * Client-side wrapper for the AI Quiz Generator Service
 * Handles the API communication and error handling for the frontend
 */
export class AIQuizClientService {
  /**
   * Generate a quiz using AI based on a prompt
   * @param request The quiz generation request with prompt and callbacks
   * @returns A promise that resolves when the request completes
   */
  public static async generateQuiz(request: QuizGenerationRequest): Promise<void> {
    const { prompt, onSuccess, onError } = request;

    try {
      // Validate prompt
      if (!prompt || prompt.trim().length === 0) {
        throw new Error("Prompt cannot be empty");
      }

      if (prompt.length > 1000) {
        throw new Error("Prompt is too long. Maximum 1000 characters allowed");
      }

      // Create the command
      const command = aiQuizGeneratorService.createCommand(prompt.trim());

      // Make API request
      const response = await fetch("/api/quizzes/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: command.prompt }),
      });

      // Handle non-successful responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      // Parse response
      const quiz = (await response.json()) as QuizDetailDTO;

      // Validate quiz data
      this.validateQuizResponse(quiz);

      // Call success callback
      onSuccess(quiz);
    } catch (error) {
      // Handle errors
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred while generating the quiz";

      console.error("Quiz generation error:", error);

      // Call error callback
      onError(errorMessage);
    }
  }

  /**
   * Validate the quiz response from the API
   * @param quiz The quiz response to validate
   * @throws Error if the quiz data is invalid
   */
  private static validateQuizResponse(quiz: QuizDetailDTO): void {
    // Basic validation of required fields
    if (!quiz) {
      throw new Error("Invalid quiz data received from the API");
    }

    if (!quiz.title) {
      throw new Error("Generated quiz is missing a title");
    }

    if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      throw new Error("Generated quiz has no questions");
    }

    // Validate each question has content and options
    quiz.questions.forEach((question, index) => {
      if (!question.content) {
        throw new Error(`Question ${index + 1} is missing content`);
      }

      if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
        throw new Error(`Question ${index + 1} has insufficient options (minimum 2 required)`);
      }

      // Validate each question has exactly one correct answer
      const correctOptionsCount = question.options.filter((option) => option.is_correct).length;
      if (correctOptionsCount !== 1) {
        throw new Error(`Question ${index + 1} must have exactly one correct answer`);
      }
    });
  }
}
