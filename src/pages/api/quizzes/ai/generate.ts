import type { APIRoute } from "astro";
import { aiQuizGeneratorService } from "../../../../lib/services/ai-quiz-generator.service.ts";
import { AIQuotaService } from "../../../../lib/services/ai-quota.service.ts";
import { aiQuizGenerationSchema } from "../../../../lib/validation/ai-quiz-generation.schema.ts";
import type { AIGeneratedQuizPreview, QuizSource } from "../../../../types.ts";

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
    // Get supabase client from middleware (RLS enforced)
    const supabaseClient = locals.supabase;

    // Check for authentication
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
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

    const userId = user.id;

    // Step 2: Check quota before generation
    const quotaService = new AIQuotaService();
    const canGenerate = await quotaService.canGenerateQuiz(supabaseClient, userId);

    if (!canGenerate) {
      const quota = await quotaService.getUserQuota(supabaseClient, userId);
      return new Response(
        JSON.stringify({
          error: "Quota Limit Reached",
          message: `You have reached your limit of ${quota.limit} AI-generated quizzes.`,
          quota: quota,
        }),
        {
          status: 429, // Too Many Requests
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Step 3: Parse and validate request body
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

    // Step 4: Validate input against schema
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

    // Step 5: Generate quiz content using AI service
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

    // Step 7: Create a quiz preview from the AI generated content
    const quizPreview: AIGeneratedQuizPreview = {
      title: aiGenerationResult.content.title,
      description: aiGenerationResult.content.description || "",
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

    // Step 8: Return quiz preview with 201 status
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
