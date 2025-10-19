import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { quizService } from "../../../../lib/services/quiz.service.ts";
import { uuidSchema } from "../../../../lib/validation/uuid.schema.ts";
import { createSupabaseServerInstance } from "../../../../db/supabase.client.ts";

import type { Database } from "../../../../db/database.types.ts";

export const prerender = false;

const visibilitySchema = z.object({
  status: z.enum(["public", "private"], {
    errorMap: () => ({ message: "Status must be either 'public' or 'private'" }),
  }),
});

/**
 * PATCH /api/quizzes/[id]/visibility
 * Toggle quiz visibility between public and private
 * Only works for already published quizzes (status is public or private)
 *
 * @returns 200 OK - Updated quiz with new visibility
 * @returns 400 Bad Request - Invalid quiz ID or request body
 * @returns 401 Unauthorized - Authentication required
 * @returns 403 Forbidden - User is not the quiz owner
 * @returns 404 Not Found - Quiz not found
 * @returns 422 Unprocessable Entity - Quiz is not published (draft or archived status)
 * @returns 500 Internal Server Error - Database or unexpected error
 */
export const PATCH: APIRoute = async ({ params, request, cookies }) => {
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
    const uuidValidationResult = uuidSchema.safeParse(quizId);

    if (!uuidValidationResult.success) {
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

    const validationResult = visibilitySchema.safeParse(body);

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

    // Step 4: Setup Supabase clients
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = import.meta.env.SUPABASE_URL;

    // Create SSR-compatible client for authentication
    const authClient = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Check authentication using SSR client
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

    // Setup service role client for database operations (bypasses RLS)
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

    // Step 5: Update quiz visibility using the service
    let updatedQuiz;
    try {
      updatedQuiz = await quizService.updateQuizVisibility(
        supabaseClient,
        uuidValidationResult.data,
        userId,
        validationResult.data.status
      );
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
            message: "You do not have permission to update this quiz",
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (errorMessage.includes("Cannot change visibility")) {
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
      console.error("Failed to update quiz visibility:", {
        message: errorMessage,
        stack: errorStack,
        quizId: uuidValidationResult.data,
      });

      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Failed to update quiz visibility",
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

    // Step 6: Return updated quiz with 200 status
    return new Response(JSON.stringify(updatedQuiz), {
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
        message: "An unexpected error occurred while updating quiz visibility",
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
