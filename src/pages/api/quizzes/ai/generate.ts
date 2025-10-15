import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

import { aiQuizGeneratorService } from "../../../../lib/services/ai-quiz-generator.service.ts";
import { aiQuizGenerationSchema } from "../../../../lib/validation/ai-quiz-generation.schema.ts";
import { getDefaultUserId } from "../../../../lib/utils/auth.ts";
import type { AIGeneratedQuizPreview, QuizVisibility, QuizSource } from "../../../../types.ts";

import type { Database } from "../../../../db/database.types.ts";

export const prerender = false;

/**
 * POST /api/quizzes/ai/generate
 * Generates a quiz preview using AI based on a provided prompt
 *
 * NOTE: This endpoint returns a PREVIEW of the generated quiz without saving it to the database.
 * The user can review the generated content and save it separately using POST /api/quizzes.
 *
 * @param prompt - The user's description of the quiz to generate
 *
 * @returns 201 Created - Preview of newly generated quiz (not persisted)
 * @returns 400 Bad Request - Invalid request payload
 * @returns 401 Unauthorized - Authentication required
 * @returns 422 Unprocessable Entity - AI generated invalid content
 * @returns 503 Service Unavailable - AI service error
 * @returns 500 Internal Server Error - Unexpected error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Create a Supabase client with service role key for database operations
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    let supabaseClient = locals.supabase;

    // Check if Supabase URL is available
    if (!supabaseUrl) {
      return new Response(
        JSON.stringify({
          error: "Configuration Error",
          message: "Supabase URL is not configured. Please check your environment variables.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Use service role key if available to bypass RLS
    if (serviceRoleKey) {
      try {
        supabaseClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new Response(
          JSON.stringify({
            error: "Database Configuration Error",
            message: "Failed to create Supabase client with service role key.",
            details: errorMessage,
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    // TESTING: Authentication check disabled for easier development
    // In production, uncomment and use these lines instead:
    /*
    // Check for authentication
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (!session) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication is required to generate quizzes",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const userId = session.user.id;
    */

    // For testing: Use the default user ID from environment
    const userId = getDefaultUserId();

    // User ID should be available from the session at this point

    // Step 2: Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Step 3: Validate input against schema
    const validationResult = aiQuizGenerationSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation Failed",
          message: "Invalid request payload",
          details: errors,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { prompt } = validationResult.data;

    // Step 4: Generate quiz content using AI service
    const command = aiQuizGeneratorService.createCommand(prompt);
    let aiGenerationResult;

    try {
      aiGenerationResult = await aiQuizGeneratorService.generateQuizContent(command);
    } catch (error) {
      // Handle AI generation error
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Check for specific error types
      if (errorMessage.includes("OPENROUTER_API_KEY")) {
        return new Response(
          JSON.stringify({
            error: "Configuration Error",
            message: "AI service is not properly configured. Please contact support.",
          }),
          {
            status: 503,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (errorMessage.includes("OpenRouter API error")) {
        return new Response(
          JSON.stringify({
            error: "AI Service Error",
            message: "The AI service is temporarily unavailable. Please try again later.",
            details: errorMessage,
          }),
          {
            status: 503,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (errorMessage.includes("validation failed") || errorMessage.includes("Invalid JSON")) {
        return new Response(
          JSON.stringify({
            error: "AI Response Error",
            message: "The AI generated invalid content. Please try rephrasing your prompt or try again.",
          }),
          {
            status: 422,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Generic AI error
      return new Response(
        JSON.stringify({
          error: "AI Generation Failed",
          message: "Failed to generate quiz content. Please try again.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Log AI usage (non-blocking)
    aiQuizGeneratorService
      .logAIUsage(supabaseClient, userId, command.ai_model, aiGenerationResult.tokensUsed)
      .catch(() => {
        // Silently handle non-critical logging errors
      });

    // Step 6: Create a quiz preview from the AI generated content
    const quizPreview: AIGeneratedQuizPreview = {
      title: aiGenerationResult.content.title,
      description: aiGenerationResult.content.description || "",
      visibility: "private" as QuizVisibility,
      source: "ai_generated" as QuizSource,
      ai_model: command.ai_model,
      ai_prompt: prompt,
      ai_temperature: command.ai_temperature,
      questions: aiGenerationResult.content.questions.map((q, qIndex) => ({
        content: q.content,
        explanation: q.explanation,
        position: qIndex + 1,
        options: q.options.map((opt, optIndex) => ({
          content: opt.content,
          is_correct: opt.is_correct,
          position: optIndex + 1,
        })),
      })),
    };

    // Step 7: Return quiz preview with 201 status
    return new Response(JSON.stringify(quizPreview), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    // Handle unexpected errors
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while generating the quiz",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
