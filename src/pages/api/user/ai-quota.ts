import type { APIRoute } from "astro";
import { AIQuotaService } from "../../../lib/services/ai-quota.service.ts";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

export const prerender = false;

/**
 * GET /api/user/ai-quota
 * Fetches the current user's AI quiz generation quota information
 *
 * @returns 200 OK - User's quota information
 * @returns 401 Unauthorized - Authentication required
 * @returns 500 Internal Server Error - Unexpected error
 */
export const GET: APIRoute = async ({ cookies, request }) => {
  try {
    // Create SSR-compatible client for authentication
    const supabaseClient = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Check for authentication
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication is required to view quota information",
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

    // Fetch user's quota information
    const quotaService = new AIQuotaService();
    const quota = await quotaService.getUserQuota(supabaseClient, userId);

    // Return quota information
    return new Response(JSON.stringify(quota), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to fetch quota information",
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
};
