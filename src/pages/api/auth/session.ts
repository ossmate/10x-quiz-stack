import type { APIRoute } from "astro";

export const prerender = false;

/**
 * GET /api/auth/session
 * Returns the current user session information
 *
 * @returns 200 OK - User session data
 * @returns 401 Unauthorized - No session found
 * @returns 500 Internal Server Error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get Supabase client from middleware (SSR-compatible for auth)
    const supabase = locals.supabase;

    // Get current user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
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

    // Get user profile (including username)
    const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          username: profile?.username || user.email?.split("@")[0] || "User",
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
    console.error("Session error:", error);
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
