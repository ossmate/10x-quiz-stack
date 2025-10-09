import type { APIRoute } from "astro";

import { aiQuizGeneratorService } from "../../../../lib/services/ai-quiz-generator.service.ts";
import { quizService } from "../../../../lib/services/quiz.service.ts";
import { aiQuizGenerationSchema } from "../../../../lib/validation/ai-quiz-generation.schema.ts";

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
    // TODO: Add authentication when auth system is ready
    // For now, use user ID from environment variable
    const userId = import.meta.env.DEFAULT_USER_ID;

    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "Configuration Error",
          message: "DEFAULT_USER_ID is not configured. Please set it in your .env file.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

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
      console.error("AI generation failed:", error);

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

    // Step 5: Log AI usage (non-blocking)
    aiQuizGeneratorService
      .logAIUsage(locals.supabase, userId, command.ai_model, aiGenerationResult.tokensUsed)
      .catch((error) => {
        console.error("Failed to log AI usage (non-critical):", error);
      });

    // Step 6: Insert quiz into database
    let createdQuiz;
    try {
      createdQuiz = await quizService.createQuizFromAIContent(
        locals.supabase,
        userId,
        aiGenerationResult.content,
        prompt,
        command.ai_model,
        command.ai_temperature
      );
    } catch (error) {
      console.error("Database insertion failed:", error);

      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Failed to save quiz to database. Please try again.",
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
  } catch (error) {
    console.error("Unexpected error in AI quiz generation:", error);

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
