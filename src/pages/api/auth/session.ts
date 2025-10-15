import type { APIRoute } from "astro";
import { getDefaultUserId } from "../../../lib/utils/auth.ts";

export const prerender = false;

/**
 * GET /api/auth/session
 * Returns the current user session information
 * For testing, returns the DEFAULT_USER_ID from environment
 *
 * @returns 200 OK - User session data
 * @returns 401 Unauthorized - No session found
 */
export const GET: APIRoute = async () => {
  try {
    // TESTING: Authentication check disabled for easier development
    // In production, this would get the actual session from Supabase

    /*
    // Production code:
    const {
      data: { session },
    } = await locals.supabase.auth.getSession();

    if (!session) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "No active session found",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        user: {
          id: session.user.id,
          email: session.user.email,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    */

    // For testing: Return user from environment variable
    const userId = getDefaultUserId();

    return new Response(
      JSON.stringify({
        user: {
          id: userId,
          email: `${userId}@test.com`,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: errorMessage,
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
