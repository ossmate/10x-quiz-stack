import type { SupabaseClient } from "@supabase/supabase-js";

import type { AIGeneratedQuizContent } from "./ai-quiz-generator.service.ts";

import type { Database } from "../../db/database.types.ts";
import type { QuizDTO, QuizMetadata, QuizDetailDTO } from "../../types.ts";
import type { QuizCreateInput } from "../validation/quiz-create.schema.ts";

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
   * Creates a new quiz from user-provided data
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user creating the quiz
   * @param quizData - Quiz data from the request
   * @returns Created quiz detail DTO with questions and options
   * @throws Error if database operations fail
   */
  async createQuiz(supabase: SupabaseClientType, userId: string, quizData: QuizCreateInput): Promise<QuizDetailDTO> {
    // Step 1: Prepare quiz metadata
    const metadata: QuizMetadata = {
      description: quizData.description || "",
      visibility: quizData.visibility,
      source: quizData.source,
      ai_model: quizData.ai_model,
      ai_prompt: quizData.ai_prompt,
      ai_temperature: quizData.ai_temperature,
    };

    // Step 2: Insert quiz record
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        user_id: userId,
        title: quizData.title,
        metadata: metadata as never,
        status: "draft",
      })
      .select()
      .single();

    if (quizError || !quiz) {
      throw new Error(`Failed to create quiz: ${quizError?.message || "Unknown error"}`);
    }

    // Step 3: Insert questions with their options
    const createdQuestions = [];

    for (const questionData of quizData.questions) {
      // Insert question
      const { data: question, error: questionError } = await supabase
        .from("questions")
        .insert({
          quiz_id: quiz.id,
          content: questionData.content,
          order_index: questionData.position - 1,
        })
        .select()
        .single();

      if (questionError || !question) {
        throw new Error(`Failed to create question: ${questionError?.message || "Unknown error"}`);
      }

      // Insert options for this question
      const createdOptions = [];

      for (const optionData of questionData.options) {
        const { data: option, error: optionError } = await supabase
          .from("answers")
          .insert({
            question_id: question.id,
            content: optionData.content,
            is_correct: optionData.is_correct,
            order_index: optionData.position - 1,
            generated_by_ai: quizData.source === "ai_generated",
            ai_generation_metadata:
              quizData.source === "ai_generated" && questionData.explanation
                ? ({ explanation: questionData.explanation } as never)
                : null,
          })
          .select()
          .single();

        if (optionError || !option) {
          throw new Error(`Failed to create option: ${optionError?.message || "Unknown error"}`);
        }

        createdOptions.push({
          id: option.id,
          question_id: option.question_id,
          content: option.content,
          is_correct: option.is_correct,
          position: optionData.position,
          created_at: option.created_at,
        });
      }

      createdQuestions.push({
        id: question.id,
        quiz_id: question.quiz_id,
        content: question.content,
        explanation: questionData.explanation,
        position: questionData.position,
        status: "active" as const,
        created_at: question.created_at,
        updated_at: question.updated_at,
        options: createdOptions,
      });
    }

    // Step 4: Return complete quiz with questions
    return {
      id: quiz.id,
      user_id: quiz.user_id,
      title: quiz.title,
      description: metadata.description,
      visibility: metadata.visibility,
      status: quiz.status,
      source: metadata.source,
      ai_model: metadata.ai_model,
      ai_prompt: metadata.ai_prompt,
      ai_temperature: metadata.ai_temperature,
      created_at: quiz.created_at,
      updated_at: quiz.updated_at,
      questions: createdQuestions,
    };
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
