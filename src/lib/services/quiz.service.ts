import type { SupabaseClient } from "@supabase/supabase-js";

import type { AIGeneratedQuizContent } from "./ai-quiz-generator.service.ts";

import type { Database } from "../../db/database.types.ts";
import type { QuizDTO, QuizMetadata, QuizDetailDTO, QuizListResponse } from "../../types.ts";
import type { QuizCreateInput } from "../validation/quiz-create.schema.ts";
import type { QuizListQuery } from "../validation/quiz-list-query.schema.ts";
import { validateQuizForPublishing } from "../validation/quiz-publish.validator.ts";

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
          explanation: question.explanation || null,
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
          ai_generation_metadata: null,
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
   * Creates a new quiz using atomic database function (recommended)
   * Falls back to createQuizWithCleanup if atomic function is not available
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user creating the quiz
   * @param quizData - Quiz data from the request
   * @returns Created quiz detail DTO with questions and options
   * @throws Error if database operations fail
   */
  async createQuiz(supabase: SupabaseClientType, userId: string, quizData: QuizCreateInput): Promise<QuizDetailDTO> {
    try {
      // Try atomic approach first (requires migration 20251013000000)
      return await this.createQuizAtomic(supabase, userId, quizData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if error is due to missing function (various error message formats)
      if (
        errorMessage.includes("function create_quiz_atomic") ||
        errorMessage.includes("does not exist") ||
        errorMessage.includes("schema cache") ||
        errorMessage.includes("Could not find the function")
      ) {
        console.warn("Atomic function not available, falling back to cleanup approach");
        return await this.createQuizWithCleanup(supabase, userId, quizData);
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Creates a new quiz using atomic database function
   * Provides true transactional safety - all or nothing
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user creating the quiz
   * @param quizData - Quiz data from the request
   * @returns Created quiz detail DTO with questions and options
   * @throws Error if database operations fail
   */
  private async createQuizAtomic(
    supabase: SupabaseClientType,
    userId: string,
    quizData: QuizCreateInput
  ): Promise<QuizDetailDTO> {
    // Call the database function for atomic creation
    const { data, error } = await supabase.rpc("create_quiz_atomic", {
      p_user_id: userId,
      p_quiz_input: quizData as never,
    });

    if (error) {
      throw new Error(`Failed to create quiz atomically: ${error.message}`);
    }

    if (!data) {
      throw new Error("Quiz creation succeeded but no data was returned");
    }

    // The function returns the complete quiz structure
    return data as QuizDetailDTO;
  }

  /**
   * Creates a new quiz with cleanup on failure (fallback approach)
   * Attempts to clean up partial data if any step fails
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user creating the quiz
   * @param quizData - Quiz data from the request
   * @returns Created quiz detail DTO with questions and options
   * @throws Error if database operations fail
   */
  private async createQuizWithCleanup(
    supabase: SupabaseClientType,
    userId: string,
    quizData: QuizCreateInput
  ): Promise<QuizDetailDTO> {
    let quizId: string | null = null;
    const createdQuestionIds: string[] = [];

    try {
      // Step 1: Prepare quiz metadata
      const metadata: QuizMetadata = {
        description: quizData.description || "",
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

      quizId = quiz.id;

      // Step 3: Insert questions with their options
      const createdQuestions = [];

      for (const questionData of quizData.questions) {
        // Insert question
        const { data: question, error: questionError } = await supabase
          .from("questions")
          .insert({
            quiz_id: quiz.id,
            content: questionData.content,
            explanation: questionData.explanation || null,
            order_index: questionData.position - 1,
          })
          .select()
          .single();

        if (questionError || !question) {
          throw new Error(`Failed to create question: ${questionError?.message || "Unknown error"}`);
        }

        createdQuestionIds.push(question.id);

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
              ai_generation_metadata: null,
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
        status: quiz.status,
        source: metadata.source,
        ai_model: metadata.ai_model,
        ai_prompt: metadata.ai_prompt,
        ai_temperature: metadata.ai_temperature,
        created_at: quiz.created_at,
        updated_at: quiz.updated_at,
        questions: createdQuestions,
      };
    } catch (error) {
      // Cleanup: Attempt to delete partially created data
      // Note: This is not a true transaction, but reduces orphaned data
      console.error("Quiz creation failed, attempting cleanup...", error);

      try {
        // Delete quiz (cascade should handle questions and answers)
        if (quizId) {
          await supabase.from("quizzes").delete().eq("id", quizId);
          console.log(`Cleaned up quiz ${quizId} and related data`);
        }
      } catch (cleanupError) {
        // Log cleanup failure but don't mask original error
        console.error("Failed to cleanup partial quiz data:", cleanupError);
      }

      // Re-throw original error
      throw error;
    }
  }

  /**
   * Get quiz by ID with permission check
   * Returns quiz with nested questions and options if user has access
   *
   * @param supabase - Supabase client instance
   * @param quizId - Quiz ID to retrieve
   * @param userId - ID of the user requesting the quiz
   * @returns QuizDetailDTO if found and user has access, null otherwise
   * @throws Error if database operations fail
   */
  async getQuizById(supabase: SupabaseClientType, quizId: string, userId: string): Promise<QuizDetailDTO | null> {
    // Query quiz with nested questions and answers
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select(
        `
        *,
        questions:questions(
          *,
          answers:answers(*)
        )
      `
      )
      .eq("id", quizId)
      .is("deleted_at", null)
      .single();

    if (quizError || !quiz) {
      // Quiz not found or deleted
      return null;
    }

    // Check access permission: user is owner OR quiz is public
    const hasAccess = quiz.user_id === userId || quiz.status === "public";

    if (!hasAccess) {
      // User doesn't have permission to access this quiz
      return null;
    }

    // Extract metadata
    const metadata = (quiz.metadata as unknown as QuizMetadata) || {
      description: "",
      source: "manual",
    };

    const rawQuestions = quiz.questions;
    if (!Array.isArray(rawQuestions)) {
      return null;
    }

    const questions = rawQuestions
      .filter((q) => q && typeof q === "object" && q.deleted_at === null)
      .map((question) => {
        if (!question.id || !question.quiz_id || !question.content || typeof question.order_index !== "number") {
          return null;
        }

        const rawAnswers = question.answers;
        if (!Array.isArray(rawAnswers)) {
          return null;
        }

        const options = rawAnswers
          .filter((a) => a && typeof a === "object" && a.deleted_at === null)
          .map((answer) => {
            if (
              !answer.id ||
              !answer.question_id ||
              !answer.content ||
              typeof answer.is_correct !== "boolean" ||
              typeof answer.order_index !== "number"
            ) {
              return null;
            }

            return {
              id: answer.id,
              question_id: answer.question_id,
              content: answer.content,
              is_correct: answer.is_correct,
              position: answer.order_index + 1,
              created_at: answer.created_at,
            };
          })
          .filter((opt): opt is NonNullable<typeof opt> => opt !== null)
          .sort((a, b) => a.position - b.position);

        if (options.length === 0) {
          return null;
        }

        return {
          id: question.id,
          quiz_id: question.quiz_id,
          content: question.content,
          explanation: question.explanation || undefined,
          position: question.order_index + 1,
          status: "active" as const,
          created_at: question.created_at,
          updated_at: question.updated_at,
          options,
        };
      })
      .filter((q): q is NonNullable<typeof q> => q !== null)
      .sort((a, b) => a.position - b.position);

    if (questions.length === 0) {
      return null;
    }

    // Build QuizDetailDTO
    return {
      id: quiz.id,
      user_id: quiz.user_id,
      title: quiz.title,
      description: metadata.description,
      status: quiz.status,
      source: metadata.source,
      ai_model: metadata.ai_model,
      ai_prompt: metadata.ai_prompt,
      ai_temperature: metadata.ai_temperature,
      created_at: quiz.created_at,
      updated_at: quiz.updated_at,
      questions,
    };
  }

  /**
   * Retrieve paginated list of quizzes accessible to user
   * Returns user's own quizzes (all visibilities) and public quizzes from other users
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user requesting quizzes
   * @param query - Query parameters for pagination, sorting, and filtering
   * @returns QuizListResponse with quizzes and pagination metadata
   * @throws Error if database operations fail
   */
  async getQuizzes(supabase: SupabaseClientType, userId: string, query: QuizListQuery): Promise<QuizListResponse> {
    const { page, limit, sort, order, status, owned } = query;

    // Build query based on ownership and status filters
    let countQuery = supabase.from("quizzes").select("*", { count: "exact", head: true }).is("deleted_at", null);

    let dataQuery = supabase.from("quizzes").select("*").is("deleted_at", null);

    // Apply filters based on owned parameter
    if (owned === true) {
      // Show only quizzes owned by the user
      countQuery = countQuery.eq("user_id", userId);
      dataQuery = dataQuery.eq("user_id", userId);

      // Apply status filter if provided
      if (status) {
        countQuery = countQuery.eq("status", status);
        dataQuery = dataQuery.eq("status", status);
      }
    } else if (owned === false) {
      // Show only quizzes NOT owned by the user (must be public)
      countQuery = countQuery.neq("user_id", userId).eq("status", "public");
      dataQuery = dataQuery.neq("user_id", userId).eq("status", "public");

      // Note: status filter is redundant here but we can apply it
      if (status && status !== "public") {
        // If requesting non-public quizzes from others, return empty result
        countQuery = countQuery.eq("user_id", "00000000-0000-0000-0000-000000000000");
        dataQuery = dataQuery.eq("user_id", "00000000-0000-0000-0000-000000000000");
      }
    } else {
      // Original behavior: owned is undefined
      // User can see: their own quizzes (all statuses) OR public quizzes from others
      if (status) {
        if (status === "public") {
          // Show only public quizzes (from anyone)
          countQuery = countQuery.eq("status", "public");
          dataQuery = dataQuery.eq("status", "public");
        } else {
          // Show only quizzes with specific status owned by user
          countQuery = countQuery.eq("status", status).eq("user_id", userId);
          dataQuery = dataQuery.eq("status", status).eq("user_id", userId);
        }
      } else {
        // No status filter: show user's quizzes OR public quizzes from others
        countQuery = countQuery.or(`user_id.eq.${userId},status.eq.public`);
        dataQuery = dataQuery.or(`user_id.eq.${userId},status.eq.public`);
      }
    }

    // Count query for total items
    const { count, error: countError } = await countQuery;

    if (countError) {
      throw new Error(`Failed to count quizzes: ${countError.message}`);
    }

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const effectivePage = Math.min(Math.max(page, 1), totalPages);

    // Data query with pagination
    const { data: quizzes, error: dataError } = await dataQuery
      .order(sort, { ascending: order === "asc" })
      .range((effectivePage - 1) * limit, effectivePage * limit - 1);

    if (dataError) {
      throw new Error(`Failed to fetch quizzes: ${dataError.message}`);
    }

    // Transform database records to DTOs
    const quizDTOs: QuizDTO[] = (quizzes || []).map((quiz) => {
      const metadata = (quiz.metadata as unknown as QuizMetadata) || {
        description: "",
        source: "manual",
      };

      return this.transformQuizToDTO(quiz, metadata);
    });

    // Fetch user emails for all quizzes
    await this.enrichQuizzesWithUserEmails(supabase, quizDTOs);

    return {
      quizzes: quizDTOs,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems,
      },
    };
  }

  /**
   * Update quiz with complete replacement (atomic)
   * Only the quiz owner can perform this operation
   *
   * @param supabase - Supabase client instance
   * @param quizId - Quiz ID to update
   * @param userId - User requesting the update
   * @param quizData - New quiz data
   * @returns Updated quiz detail DTO
   * @throws Error if update fails or user lacks permission
   */
  async updateQuiz(
    supabase: SupabaseClientType,
    quizId: string,
    userId: string,
    quizData: QuizCreateInput
  ): Promise<QuizDetailDTO> {
    try {
      // Try atomic approach first (requires migration for update_quiz_atomic function)
      return await this.updateQuizAtomic(supabase, quizId, userId, quizData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if error is due to missing function
      if (
        errorMessage.includes("function update_quiz_atomic") ||
        errorMessage.includes("does not exist") ||
        errorMessage.includes("schema cache") ||
        errorMessage.includes("Could not find the function")
      ) {
        console.warn("Atomic update function not available, falling back to cleanup approach");
        return await this.updateQuizWithCleanup(supabase, quizId, userId, quizData);
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Update quiz atomically using database function
   * Provides true transactional safety - all or nothing
   *
   * @param supabase - Supabase client instance
   * @param quizId - Quiz ID to update
   * @param userId - User requesting the update
   * @param quizData - New quiz data
   * @returns Updated quiz detail DTO
   * @throws Error if update fails
   */
  private async updateQuizAtomic(
    supabase: SupabaseClientType,
    quizId: string,
    userId: string,
    quizData: QuizCreateInput
  ): Promise<QuizDetailDTO> {
    // Call the database function for atomic update
    const { data, error } = await supabase.rpc("update_quiz_atomic", {
      p_quiz_id: quizId,
      p_user_id: userId,
      p_quiz_input: quizData as never,
    });

    if (error) {
      throw new Error(`Failed to update quiz atomically: ${error.message}`);
    }

    if (!data) {
      throw new Error("Quiz update succeeded but no data was returned");
    }

    // The function returns the complete quiz structure
    return data as QuizDetailDTO;
  }

  /**
   * Update quiz with cleanup on failure (fallback approach)
   * Checks ownership and replaces all quiz data
   *
   * @param supabase - Supabase client instance
   * @param quizId - Quiz ID to update
   * @param userId - User requesting the update
   * @param quizData - New quiz data
   * @returns Updated quiz detail DTO
   * @throws Error if update fails or user lacks permission
   */
  private async updateQuizWithCleanup(
    supabase: SupabaseClientType,
    quizId: string,
    userId: string,
    quizData: QuizCreateInput
  ): Promise<QuizDetailDTO> {
    // Step 1: Check ownership
    const { data: existingQuiz, error: fetchError } = await supabase
      .from("quizzes")
      .select("id, user_id, deleted_at")
      .eq("id", quizId)
      .single();

    if (fetchError || !existingQuiz) {
      throw new Error("Quiz not found");
    }

    if (existingQuiz.deleted_at !== null) {
      throw new Error("Quiz not found");
    }

    if (existingQuiz.user_id !== userId) {
      throw new Error("Forbidden");
    }

    try {
      // Step 2: Delete old questions and answers (cascade should handle answers)
      const { error: deleteError } = await supabase.from("questions").delete().eq("quiz_id", quizId);

      if (deleteError) {
        throw new Error(`Failed to delete old questions: ${deleteError.message}`);
      }

      // Step 3: Update quiz metadata
      const metadata: QuizMetadata = {
        description: quizData.description || "",
        source: quizData.source,
        ai_model: quizData.ai_model,
        ai_prompt: quizData.ai_prompt,
        ai_temperature: quizData.ai_temperature,
      };

      const { data: updatedQuiz, error: updateError } = await supabase
        .from("quizzes")
        .update({
          title: quizData.title,
          metadata: metadata as never,
        })
        .eq("id", quizId)
        .select()
        .single();

      if (updateError || !updatedQuiz) {
        throw new Error(`Failed to update quiz: ${updateError?.message || "Unknown error"}`);
      }

      // Step 4: Insert new questions with their options
      const createdQuestions = [];

      for (const questionData of quizData.questions) {
        // Insert question
        const { data: question, error: questionError } = await supabase
          .from("questions")
          .insert({
            quiz_id: quizId,
            content: questionData.content,
            explanation: questionData.explanation || null,
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
              ai_generation_metadata: null,
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

      // Step 5: Return updated quiz with questions
      return {
        id: updatedQuiz.id,
        user_id: updatedQuiz.user_id,
        title: updatedQuiz.title,
        description: metadata.description,
        status: updatedQuiz.status,
        source: metadata.source,
        ai_model: metadata.ai_model,
        ai_prompt: metadata.ai_prompt,
        ai_temperature: metadata.ai_temperature,
        created_at: updatedQuiz.created_at,
        updated_at: updatedQuiz.updated_at,
        questions: createdQuestions,
      };
    } catch (error) {
      // Log error (data may be in inconsistent state)
      console.error("Quiz update failed:", error);
      throw error;
    }
  }

  /**
   * Soft delete a quiz
   * Only the quiz owner can perform this operation
   *
   * @param supabase - Supabase client instance
   * @param quizId - Quiz ID to delete
   * @param userId - User requesting deletion
   * @throws Error with specific message for different failure scenarios
   */
  async deleteQuiz(supabase: SupabaseClientType, quizId: string, userId: string): Promise<void> {
    // Step 1: Fetch quiz to check existence and ownership
    const { data: quiz, error: fetchError } = await supabase
      .from("quizzes")
      .select("id, user_id, deleted_at")
      .eq("id", quizId)
      .single();

    // Step 2: Handle not found or already deleted
    if (fetchError || !quiz || quiz.deleted_at !== null) {
      throw new Error("Quiz not found");
    }

    // Step 3: Check ownership
    if (quiz.user_id !== userId) {
      throw new Error("Forbidden");
    }

    // Step 4: Soft delete by setting deleted_at timestamp
    const { error: deleteError } = await supabase
      .from("quizzes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", quizId);

    if (deleteError) {
      throw new Error(`Failed to delete quiz: ${deleteError.message}`);
    }
  }

  /**
   * Publish a quiz (change status from draft to public)
   * Validates quiz is ready for publishing before changing status
   *
   * @param supabase - Supabase client instance
   * @param quizId - Quiz ID to publish
   * @param userId - User requesting the publish operation
   * @returns Updated quiz detail DTO
   * @throws Error if validation fails, quiz not found, or user lacks permission
   */
  async publishQuiz(supabase: SupabaseClientType, quizId: string, userId: string): Promise<QuizDetailDTO> {
    // Step 1: Fetch quiz to check ownership and current status
    const quiz = await this.getQuizById(supabase, quizId, userId);

    if (!quiz) {
      throw new Error("Quiz not found");
    }

    // Step 2: Check ownership
    if (quiz.user_id !== userId) {
      throw new Error("Forbidden");
    }

    // Step 3: Check current status
    if (quiz.status !== "draft") {
      throw new Error(`Cannot publish quiz with status "${quiz.status}". Only draft quizzes can be published.`);
    }

    // Step 4: Validate quiz is ready for publishing
    const validation = validateQuizForPublishing(quiz);
    if (!validation.valid) {
      throw new Error(`Quiz validation failed: ${validation.errors.join(", ")}`);
    }

    // Step 5: Update status to public
    const { data: updatedQuiz, error: updateError } = await supabase
      .from("quizzes")
      .update({ status: "public" })
      .eq("id", quizId)
      .select()
      .single();

    if (updateError || !updatedQuiz) {
      throw new Error(`Failed to publish quiz: ${updateError?.message || "Unknown error"}`);
    }

    // Step 6: Return updated quiz
    return (await this.getQuizById(supabase, quizId, userId)) as QuizDetailDTO;
  }

  /**
   * Unpublish a quiz (change status from public/private back to draft)
   *
   * @param supabase - Supabase client instance
   * @param quizId - Quiz ID to unpublish
   * @param userId - User requesting the unpublish operation
   * @returns Updated quiz detail DTO
   * @throws Error if quiz not found, user lacks permission, or invalid status
   */
  async unpublishQuiz(supabase: SupabaseClientType, quizId: string, userId: string): Promise<QuizDetailDTO> {
    // Step 1: Fetch quiz to check ownership and current status
    const quiz = await this.getQuizById(supabase, quizId, userId);

    if (!quiz) {
      throw new Error("Quiz not found");
    }

    // Step 2: Check ownership
    if (quiz.user_id !== userId) {
      throw new Error("Forbidden");
    }

    // Step 3: Check current status (can only unpublish from public or private)
    if (quiz.status !== "public" && quiz.status !== "private") {
      throw new Error(`Cannot unpublish quiz with status "${quiz.status}".`);
    }

    // Step 4: Update status to draft
    const { data: updatedQuiz, error: updateError } = await supabase
      .from("quizzes")
      .update({ status: "draft" })
      .eq("id", quizId)
      .select()
      .single();

    if (updateError || !updatedQuiz) {
      throw new Error(`Failed to unpublish quiz: ${updateError?.message || "Unknown error"}`);
    }

    // Step 5: Return updated quiz
    return (await this.getQuizById(supabase, quizId, userId)) as QuizDetailDTO;
  }

  /**
   * Enrich quizzes with user email addresses from auth.users
   * Mutates the quiz DTOs in place to add user_email field
   *
   * Note: This method requires service role permissions. For regular user sessions,
   * it will gracefully fail and quizzes will not have email addresses.
   * Consider implementing a separate user profile table if emails are critical.
   *
   * @param supabase - Supabase client instance
   * @param quizzes - Array of quiz DTOs to enrich
   */
  private async enrichQuizzesWithUserEmails(supabase: SupabaseClientType, quizzes: QuizDTO[]): Promise<void> {
    if (quizzes.length === 0) {
      return;
    }

    // Skip enrichment - admin.listUsers() requires service role key
    // which is not available in user session context.
    // User emails are not critical for quiz display, so we skip this step.
    // In the future, consider creating a public user_profiles table instead.
    return;
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
