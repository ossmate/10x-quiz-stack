import type { AIGeneratedQuizPreview, QuizDetailDTO, QuestionWithOptionsDTO, OptionDTO } from "../../types";

/**
 * Generate a unique temporary ID for client-side quiz elements
 * Uses crypto.randomUUID() for guaranteed uniqueness
 */
function generateUniqueId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

/**
 * Convert an AI-generated quiz preview to a full QuizDetailDTO with unique IDs
 * This is necessary because AI-generated quizzes don't include database IDs yet,
 * but the UI components require IDs for React keys and state management
 *
 * @param preview - The AI-generated quiz preview without IDs
 * @returns QuizDetailDTO with temporary unique IDs assigned to all questions and options
 */
export function convertAIPreviewToQuizDetail(preview: AIGeneratedQuizPreview): QuizDetailDTO {
  // Generate temporary quiz ID
  const quizId = generateUniqueId("temp-quiz");
  const now = new Date().toISOString();

  // Convert questions and add IDs
  const questions: QuestionWithOptionsDTO[] = preview.questions.map((questionPreview, qIndex) => {
    const questionId = generateUniqueId(`temp-question-${qIndex}`);

    // Convert options and add IDs
    const options: OptionDTO[] = questionPreview.options.map((optionPreview, optIndex) => ({
      id: generateUniqueId(`temp-option-q${qIndex}-o${optIndex}`),
      question_id: questionId,
      content: optionPreview.content,
      is_correct: optionPreview.is_correct,
      position: optionPreview.position,
      created_at: now,
    }));

    return {
      id: questionId,
      quiz_id: quizId,
      content: questionPreview.content,
      explanation: questionPreview.explanation,
      position: questionPreview.position,
      status: "active" as const,
      created_at: now,
      updated_at: now,
      options,
    };
  });

  return {
    id: quizId,
    user_id: "temp-user", // Will be replaced when quiz is published
    title: preview.title,
    description: preview.description,
    status: "draft" as const,
    source: preview.source,
    ai_model: preview.ai_model,
    ai_prompt: preview.ai_prompt,
    ai_temperature: preview.ai_temperature,
    created_at: now,
    updated_at: now,
    questions,
  };
}
