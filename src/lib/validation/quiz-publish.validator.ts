import type { QuizDetailDTO } from "../../types.ts";

export interface QuizValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates if a quiz is ready to be published
 * Checks for required questions, options, and correct answers
 *
 * @param quiz - Quiz to validate
 * @returns Validation result with errors if any
 */
export function validateQuizForPublishing(quiz: QuizDetailDTO): QuizValidationResult {
  const errors: string[] = [];

  // Check if quiz has title
  if (!quiz.title || quiz.title.trim().length === 0) {
    errors.push("Quiz must have a title");
  }

  // Check if quiz has at least one question
  if (!quiz.questions || quiz.questions.length === 0) {
    errors.push("Quiz must have at least one question");
  } else {
    // Validate each question
    quiz.questions.forEach((question, index) => {
      const questionNumber = index + 1;

      // Check if question has content
      if (!question.content || question.content.trim().length === 0) {
        errors.push(`Question ${questionNumber} must have content`);
      }

      // Check if question has options
      if (!question.options || question.options.length === 0) {
        errors.push(`Question ${questionNumber} must have at least one option`);
      } else {
        // Check if question has at least 2 options
        if (question.options.length < 2) {
          errors.push(`Question ${questionNumber} must have at least 2 options`);
        }

        // Check if at least one option is marked as correct
        const correctOptions = question.options.filter((opt) => opt.is_correct);
        if (correctOptions.length === 0) {
          errors.push(`Question ${questionNumber} must have at least one correct answer`);
        }

        // Check if all options have content
        question.options.forEach((option, optIndex) => {
          if (!option.content || option.content.trim().length === 0) {
            errors.push(`Question ${questionNumber}, option ${optIndex + 1} must have content`);
          }
        });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates if status transition is allowed
 *
 * @param currentStatus - Current quiz status
 * @param newStatus - Desired new status
 * @returns true if transition is allowed
 */
export function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  const validTransitions: Record<string, string[]> = {
    draft: ["public", "archived"],
    public: ["draft", "private", "archived"],
    private: ["draft", "public", "archived"],
    archived: ["draft"], // Can restore archived quizzes
  };

  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
}
