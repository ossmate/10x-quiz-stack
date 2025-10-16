import type { QuizDetailDTO } from "../../types";

/**
 * Calculate the quiz score by comparing user answers to correct answers
 * @param quiz - The quiz with questions and options
 * @param userAnswers - Map of question IDs to selected option IDs
 * @returns Number of correctly answered questions
 */
export function calculateScore(quiz: QuizDetailDTO, userAnswers: Record<string, string[]>): number {
  if (!quiz.questions) {
    return 0;
  }

  let correctCount = 0;

  quiz.questions.forEach((question) => {
    const userSelectedIds = userAnswers[question.id] || [];
    const correctOptionIds = question.options.filter((opt) => opt.is_correct).map((opt) => opt.id);

    // Check if user's answer matches correct answer(s)
    // For single correct answer: user must select exactly that option
    // For multiple correct answers: user must select all correct options
    const isCorrect =
      userSelectedIds.length === correctOptionIds.length &&
      userSelectedIds.every((id) => correctOptionIds.includes(id));

    if (isCorrect) {
      correctCount++;
    }
  });

  return correctCount;
}

/**
 * Convert a position number to an option letter (A, B, C, D, etc.)
 * @param position - Zero-indexed position (0 = A, 1 = B, etc.)
 * @returns Letter corresponding to the position
 */
export function getOptionLetter(position: number): string {
  return String.fromCharCode(65 + position);
}

/**
 * Check if a question has been answered
 * @param userAnswers - Map of question IDs to selected option IDs
 * @param questionId - The question ID to check
 * @returns True if at least one option is selected for the question
 */
export function isAnswerComplete(userAnswers: Record<string, string[]>, questionId: string): boolean {
  const selectedOptions = userAnswers[questionId];
  return Array.isArray(selectedOptions) && selectedOptions.length > 0;
}

/**
 * Count how many questions have been answered
 * @param userAnswers - Map of question IDs to selected option IDs
 * @returns Number of questions with at least one selected option
 */
export function getAnsweredCount(userAnswers: Record<string, string[]>): number {
  return Object.keys(userAnswers).filter((questionId) => isAnswerComplete(userAnswers, questionId)).length;
}

/**
 * Check if all questions in a quiz have been answered
 * @param quiz - The quiz with questions
 * @param userAnswers - Map of question IDs to selected option IDs
 * @returns True if all questions have at least one selected option
 */
export function areAllQuestionsAnswered(quiz: QuizDetailDTO, userAnswers: Record<string, string[]>): boolean {
  if (!quiz.questions || quiz.questions.length === 0) {
    return false;
  }

  return quiz.questions.every((question) => isAnswerComplete(userAnswers, question.id));
}
