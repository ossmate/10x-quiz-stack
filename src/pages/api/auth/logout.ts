import type { APIRoute } from "astro";

export const prerender = false;

/**
 * POST /api/auth/logout
 * Logs out the current user
 *
 * @returns 200 OK - Logout successful
 * @returns 500 Internal Server Error
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    // Get Supabase client from middleware (SSR-compatible for auth)
    const supabase = locals.supabase;

    // Sign out
    const { error } = await supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({
          error: "Logout Failed",
          message: error.message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Logout successful",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Logout error:", error);
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
