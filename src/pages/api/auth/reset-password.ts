import type { APIRoute } from "astro";
import { z } from "zod";
import { passwordSchema } from "../../../lib/validation/auth.schema.ts";

export const prerender = false;

// Schema for reset password (without token since session is already established)
const resetPasswordBodySchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * POST /api/auth/reset-password
 * Resets the user's password using an established recovery session
 *
 * @body { password: string, confirmPassword: string }
 * @returns 200 OK - Password reset successfully
 * @returns 400 Bad Request - Validation error
 * @returns 401 Unauthorized - No valid recovery session
 * @returns 500 Internal Server Error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = resetPasswordBodySchema.safeParse(body);
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

    const { password } = validationResult.data;

    // Get Supabase client from middleware (SSR-compatible for auth)
    const supabase = locals.supabase;

    // Verify that user has a valid password reset session
    // The session should have been established when the user clicked the reset link
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "No valid recovery session. Please request a new password reset link.",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Update the user's password
    // This will work because the user has an active session from the reset token
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      // eslint-disable-next-line no-console
      console.error("Password update error:", updateError);
      return new Response(
        JSON.stringify({
          error: "Update Failed",
          message: updateError.message || "Failed to reset password",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Password reset successful
    return new Response(
      JSON.stringify({
        message: "Password reset successfully. You can now log in with your new password.",
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
    console.error("Reset password error:", error);
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
