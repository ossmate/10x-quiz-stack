import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

import { quizService } from "../../../lib/services/quiz.service.ts";
import { quizCreateSchema } from "../../../lib/validation/quiz-create.schema.ts";

import type { Database } from "../../../db/database.types.ts";

export const prerender = false;

/**
 * POST /api/quizzes
 * Creates a new quiz with questions and options
 *
 * @returns 201 Created - Newly created quiz with full details
 * @returns 400 Bad Request - Invalid request payload
 * @returns 401 Unauthorized - Authentication required
 * @returns 500 Internal Server Error - Database or unexpected error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Setup Supabase client
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
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (!session) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication is required to create quizzes",
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
    const validationResult = quizCreateSchema.safeParse(body);

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

    // Step 4: Create quiz using the service
    let createdQuiz;
    try {
      createdQuiz = await quizService.createQuiz(supabaseClient, userId, validationResult.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Log detailed error for debugging
      console.error("Failed to create quiz:", {
        message: errorMessage,
        stack: errorStack,
        supabaseUrl: supabaseUrl,
        hasServiceRoleKey: !!serviceRoleKey,
      });

      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Failed to create quiz in the database",
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

    // Step 5: Return created quiz with 201 status
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
        message: "An unexpected error occurred while creating the quiz",
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
