import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

import { quizService } from "../../../../lib/services/quiz.service.ts";
import { uuidSchema } from "../../../../lib/validation/uuid.schema.ts";
import { createSupabaseServerInstance } from "../../../../db/supabase.client.ts";

import type { Database } from "../../../../db/database.types.ts";

export const prerender = false;

/**
 * POST /api/quizzes/[id]/unpublish
 * Unpublish a quiz (change status from public/private back to draft)
 *
 * @returns 200 OK - Unpublished quiz with nested questions and options
 * @returns 400 Bad Request - Invalid quiz ID
 * @returns 401 Unauthorized - Authentication required
 * @returns 403 Forbidden - User is not the quiz owner
 * @returns 404 Not Found - Quiz not found
 * @returns 422 Unprocessable Entity - Quiz cannot be unpublished (wrong status)
 * @returns 500 Internal Server Error - Database or unexpected error
 */
export const POST: APIRoute = async ({ params, cookies, request }) => {
  try {
    // Step 1: Extract quiz ID from path parameters
    const quizId = params.id;

    if (!quizId) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Quiz ID is required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Step 2: Validate UUID format
    const validationResult = uuidSchema.safeParse(quizId);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid quiz ID format",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Step 3: Setup Supabase clients
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = import.meta.env.SUPABASE_URL;

    // Create SSR-compatible client for authentication
    const authClient = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Step 4: Check authentication using SSR client
    const {
      data: { session },
    } = await authClient.auth.getSession();
    if (!session) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication is required",
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

    // Setup service role client for database operations (bypasses RLS)
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

    let supabaseClient = authClient;
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

    // Step 5: Unpublish quiz using the service
    let unpublishedQuiz;
    try {
      unpublishedQuiz = await quizService.unpublishQuiz(supabaseClient, validationResult.data, userId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Handle specific error types
      if (errorMessage === "Quiz not found") {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Quiz not found",
          }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (errorMessage === "Forbidden") {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "You do not have permission to unpublish this quiz",
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (errorMessage.includes("Cannot unpublish quiz")) {
        return new Response(
          JSON.stringify({
            error: "Unprocessable Entity",
            message: errorMessage,
          }),
          {
            status: 422,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Log detailed error for debugging
      console.error("Failed to unpublish quiz:", {
        message: errorMessage,
        stack: errorStack,
        quizId: validationResult.data,
      });

      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Failed to unpublish quiz",
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

    // Step 6: Return unpublished quiz with 200 status
    return new Response(JSON.stringify(unpublishedQuiz), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    // Handle unexpected errors
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while unpublishing the quiz",
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
