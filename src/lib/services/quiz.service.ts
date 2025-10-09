import type { SupabaseClient } from "@supabase/supabase-js";

import type { AIGeneratedQuizContent } from "./ai-quiz-generator.service.ts";

import type { Database } from "../../db/database.types.ts";
import type { QuizDTO, QuizMetadata } from "../../types.ts";

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Service for managing quiz database operations
 */
export class QuizService {
  /**
   * Creates a new quiz in the database from AI-generated content
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user creating the quiz
   * @param aiContent - AI-generated quiz content
   * @param prompt - Original prompt used for generation
   * @param aiModel - AI model used for generation
   * @param aiTemperature - Temperature parameter used
   * @returns Created quiz DTO
   * @throws Error if database operations fail
   */
  async createQuizFromAIContent(
    supabase: SupabaseClientType,
    userId: string,
    aiContent: AIGeneratedQuizContent,
    prompt: string,
    aiModel: string,
    aiTemperature: number
  ): Promise<QuizDTO> {
    // Step 1: Prepare quiz metadata
    const metadata: QuizMetadata = {
      description: aiContent.description,
      visibility: "private", // Default to private for new AI-generated quizzes
      source: "ai_generated",
      ai_model: aiModel,
      ai_prompt: prompt,
      ai_temperature: aiTemperature,
    };

    // Step 2: Insert quiz record
    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        user_id: userId,
        title: aiContent.title,
        metadata: metadata as never,
        status: "draft", // New quizzes start as drafts
      })
      .select()
      .single();

    if (quizError || !quizData) {
      throw new Error(`Failed to create quiz: ${quizError?.message || "Unknown error"}`);
    }

    // Step 3: Insert questions and answers
    for (let i = 0; i < aiContent.questions.length; i++) {
      const question = aiContent.questions[i];

      // Insert question
      const { data: questionData, error: questionError } = await supabase
        .from("questions")
        .insert({
          quiz_id: quizData.id,
          content: question.content,
          order_index: i,
        })
        .select()
        .single();

      if (questionError || !questionData) {
        throw new Error(`Failed to create question ${i + 1}: ${questionError?.message || "Unknown error"}`);
      }

      // Insert answer options
      for (let j = 0; j < question.options.length; j++) {
        const option = question.options[j];

        const { error: answerError } = await supabase.from("answers").insert({
          question_id: questionData.id,
          content: option.content,
          is_correct: option.is_correct,
          order_index: j,
          generated_by_ai: true,
          ai_generation_metadata: {
            explanation: question.explanation,
          } as never,
        });

        if (answerError) {
          throw new Error(`Failed to create answer ${j + 1} for question ${i + 1}: ${answerError.message}`);
        }
      }
    }

    // Step 4: Transform database record to DTO
    return this.transformQuizToDTO(quizData, metadata);
  }

  /**
   * Transforms a database quiz record to QuizDTO
   *
   * @param quizData - Quiz record from database
   * @param metadata - Quiz metadata
   * @returns QuizDTO
   */
  private transformQuizToDTO(
    quizData: Database["public"]["Tables"]["quizzes"]["Row"],
    metadata: QuizMetadata
  ): QuizDTO {
    return {
      id: quizData.id,
      user_id: quizData.user_id,
      title: quizData.title,
      description: metadata.description,
      visibility: metadata.visibility,
      status: quizData.status,
      source: metadata.source,
      ai_model: metadata.ai_model,
      ai_prompt: metadata.ai_prompt,
      ai_temperature: metadata.ai_temperature,
      created_at: quizData.created_at,
      updated_at: quizData.updated_at,
    };
  }
}

// Export singleton instance
export const quizService = new QuizService();
