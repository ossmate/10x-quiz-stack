import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

import { aiQuizGeneratorService } from "../../../../lib/services/ai-quiz-generator.service.ts";
import { quizService } from "../../../../lib/services/quiz.service.ts";
import { aiQuizGenerationSchema } from "../../../../lib/validation/ai-quiz-generation.schema.ts";

import type { Database } from "../../../../db/database.types.ts";

export const prerender = false;

/**
 * POST /api/quizzes/ai/generate
 * Generates a new quiz using AI based on a provided prompt
 *
 * @param prompt - The user's description of the quiz to generate
 *
 * @returns 201 Created - Newly created quiz object
 * @returns 400 Bad Request - Invalid request payload
 * @returns 500 Internal Server Error - AI service or database failure
 *
 * Note: AI model and temperature are configured at the application level
 * Note: Currently uses a hardcoded user ID for development
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
    const userId = import.meta.env.DEFAULT_USER_ID || "test-user-123";

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

    // Step 6: Insert quiz into database
    let createdQuiz;
    try {
      // Test the connection before proceeding
      const { error: testError } = await supabaseClient.from("quizzes").select("id").limit(1);

      if (testError) {
        throw new Error(`Supabase connection test failed: ${testError.message}`);
      }

      createdQuiz = await quizService.createQuizFromAIContent(
        supabaseClient,
        userId,
        aiGenerationResult.content,
        prompt,
        command.ai_model,
        command.ai_temperature
      );
    } catch (error) {
      // Handle database error
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Check for specific error types
      if (errorMessage.includes("fetch failed")) {
        return new Response(
          JSON.stringify({
            error: "Database Connection Error",
            message: "Failed to connect to the database. Please check your Supabase URL and credentials.",
            details: "Network error: fetch failed. This typically means the Supabase URL is invalid or unreachable.",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Failed to save quiz to database. Please try again.",
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

    // Step 7: Return created quiz with 201 status
    return new Response(JSON.stringify(createdQuiz), {
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
