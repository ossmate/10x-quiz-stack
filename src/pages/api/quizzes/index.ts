import type { APIRoute } from "astro";

import { quizService } from "../../../lib/services/quiz.service.ts";
import { quizCreateSchema } from "../../../lib/validation/quiz-create.schema.ts";
import { quizListQuerySchema } from "../../../lib/validation/quiz-list-query.schema.ts";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

export const prerender = false;

/**
 * GET /api/quizzes
 * Retrieve a paginated list of quizzes accessible to the authenticated user
 *
 * @returns 200 OK - List of quizzes with pagination metadata
 * @returns 400 Bad Request - Invalid query parameters
 * @returns 401 Unauthorized - Authentication required
 * @returns 500 Internal Server Error - Database or unexpected error
 */
export const GET: APIRoute = async ({ url, cookies, request }) => {
  try {
    // Step 1: Create SSR-compatible client for authentication
    const supabaseClient = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Step 2: Check authentication using SSR client
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (!session) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication is required to access quizzes",
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

    // Step 3: Parse and validate query parameters
    // Note: Convert null to undefined for optional fields
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      sort: url.searchParams.get("sort"),
      order: url.searchParams.get("order"),
      status: url.searchParams.get("status") || undefined,
      owned: url.searchParams.get("owned") || undefined,
    };

    const validationResult = quizListQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      // Log validation errors for debugging
      // eslint-disable-next-line no-console
      console.error("Query validation failed:", {
        queryParams,
        errors,
      });

      return new Response(
        JSON.stringify({
          error: "Validation Failed",
          message: "Invalid query parameters",
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

    // Step 4: Fetch quizzes using the service
    let quizListResponse;
    try {
      quizListResponse = await quizService.getQuizzes(supabaseClient, userId, validationResult.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Log detailed error for debugging
      console.error("Failed to fetch quizzes:", {
        message: errorMessage,
        stack: errorStack,
      });

      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Failed to retrieve quizzes from database",
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

    // Step 5: Return quiz list with 200 status
    return new Response(JSON.stringify(quizListResponse), {
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
        message: "An unexpected error occurred while retrieving quizzes",
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
 * POST /api/quizzes
 * Creates a new quiz with questions and options
 *
 * @returns 201 Created - Newly created quiz with full details
 * @returns 400 Bad Request - Invalid request payload
 * @returns 401 Unauthorized - Authentication required
 * @returns 500 Internal Server Error - Database or unexpected error
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Step 1: Create SSR-compatible client for authentication
    const supabaseClient = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Step 2: Check authentication using SSR client
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

    // Step 5: Create quiz using the service
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

    // Step 6: Return created quiz with 201 status and redirect URL
    return new Response(
      JSON.stringify({
        ...createdQuiz,
        redirectUrl: `/quizzes/${createdQuiz.id}`,
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
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
