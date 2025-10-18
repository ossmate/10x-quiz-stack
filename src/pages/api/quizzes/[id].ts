import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

import { quizService } from "../../../lib/services/quiz.service.ts";
import { uuidSchema } from "../../../lib/validation/uuid.schema.ts";
import { quizCreateSchema } from "../../../lib/validation/quiz-create.schema.ts";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

import type { Database } from "../../../db/database.types.ts";

export const prerender = false;

/**
 * GET /api/quizzes/[id]
 * Retrieve detailed information about a single quiz with questions and options
 *
 * @returns 200 OK - Quiz with nested questions and options
 * @returns 400 Bad Request - Invalid quiz ID format
 * @returns 401 Unauthorized - Authentication required
 * @returns 404 Not Found - Quiz not found or user lacks access
 * @returns 500 Internal Server Error - Database or unexpected error
 */
export const GET: APIRoute = async ({ params, cookies, request }) => {
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

    // Step 5: Fetch quiz using the service
    let quiz;
    try {
      quiz = await quizService.getQuizById(supabaseClient, validationResult.data, userId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Log detailed error for debugging
      console.error("Failed to fetch quiz:", {
        message: errorMessage,
        stack: errorStack,
        quizId: validationResult.data,
      });

      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Failed to retrieve quiz",
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

    // Step 6: Check if quiz was found and user has access
    if (!quiz) {
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

    // Step 7: Return quiz with 200 status
    return new Response(JSON.stringify(quiz), {
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
        message: "An unexpected error occurred while retrieving the quiz",
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

/**
 * PUT /api/quizzes/[id]
 * Update an existing quiz with complete replacement of all data
 *
 * @returns 200 OK - Updated quiz with nested questions and options
 * @returns 400 Bad Request - Invalid quiz ID or request payload
 * @returns 401 Unauthorized - Authentication required
 * @returns 403 Forbidden - User is not the quiz owner
 * @returns 404 Not Found - Quiz doesn't exist
 * @returns 500 Internal Server Error - Database or unexpected error
 */
export const PUT: APIRoute = async ({ params, request, cookies }) => {
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

    // Step 5: Update quiz using the service
    let updatedQuiz;
    try {
      updatedQuiz = await quizService.updateQuiz(
        supabaseClient,
        uuidValidationResult.data,
        userId,
        validationResult.data
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

      // Log detailed error for debugging
      console.error("Failed to update quiz:", {
        message: errorMessage,
        stack: errorStack,
        quizId: uuidValidationResult.data,
      });

      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Failed to update quiz",
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
        message: "An unexpected error occurred while updating the quiz",
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

/**
 * DELETE /api/quizzes/[id]
 * Soft delete a quiz by setting the deleted_at timestamp
 *
 * @returns 204 No Content - Quiz successfully deleted
 * @returns 400 Bad Request - Invalid quiz ID format
 * @returns 401 Unauthorized - Authentication required
 * @returns 403 Forbidden - User is not the quiz owner
 * @returns 404 Not Found - Quiz doesn't exist or already deleted
 * @returns 500 Internal Server Error - Database or unexpected error
 */
export const DELETE: APIRoute = async ({ params, request, cookies }) => {
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

    // Step 4: Delete quiz using the service
    try {
      await quizService.deleteQuiz(supabaseClient, validationResult.data, userId);
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
            message: "You do not have permission to delete this quiz",
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Log detailed error for debugging
      console.error("Failed to delete quiz:", {
        message: errorMessage,
        stack: errorStack,
        quizId: validationResult.data,
      });

      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Failed to delete quiz",
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

    // Step 5: Return 204 No Content (successful deletion)
    return new Response(null, { status: 204 });
  } catch {
    // Handle unexpected errors
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while deleting the quiz",
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
