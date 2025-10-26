import type { APIRoute } from "astro";
import { forgotPasswordSchema } from "../../../lib/validation/auth.schema.ts";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

export const prerender = false;

/**
 * POST /api/auth/forgot-password
 * Sends a password reset email to the user
 *
 * @body { email: string }
 * @returns 200 OK - Always returns success for security (doesn't reveal if email exists)
 * @returns 400 Bad Request - Validation error
 * @returns 500 Internal Server Error
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation Error",
          message: "Invalid input data",
          details: validationResult.error.errors.reduce(
            (acc, err) => {
              acc[err.path[0]] = err.message;
              return acc;
            },
            {} as Record<string, string>
          ),
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { email } = validationResult.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Send password reset email
    // Note: This will send an email if the user exists, but we always return success
    // to prevent email enumeration attacks
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/reset-password`,
    });

    // Log error for monitoring, but don't expose it to the user
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Password reset email error:", error.message);
    }

    // Always return success message for security
    // This prevents attackers from knowing if an email exists in the system
    return new Response(
      JSON.stringify({
        message: "If an account exists with this email, you will receive a password reset link shortly.",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Forgot password error:", error);
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
