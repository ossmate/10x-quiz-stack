import type { APIRoute } from "astro";
import { changePasswordSchema } from "../../../lib/validation/auth.schema.ts";

export const prerender = false;

/**
 * POST /api/auth/change-password
 * Changes the password for an authenticated user
 *
 * @body { currentPassword: string, newPassword: string, confirmPassword: string }
 * @returns 200 OK - Password changed successfully
 * @returns 400 Bad Request - Validation error
 * @returns 401 Unauthorized - User not authenticated or invalid current password
 * @returns 500 Internal Server Error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = changePasswordSchema.safeParse(body);
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

    const { currentPassword, newPassword } = validationResult.data;

    // Get Supabase client from middleware (SSR-compatible for auth)
    const supabase = locals.supabase;

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to change your password",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Verify current password by attempting to sign in with it
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({
          error: "Authentication Failed",
          message: "Current password is incorrect",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return new Response(
        JSON.stringify({
          error: "Update Failed",
          message: updateError.message || "Failed to update password",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Password changed successfully",
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
    console.error("Change password error:", error);
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
