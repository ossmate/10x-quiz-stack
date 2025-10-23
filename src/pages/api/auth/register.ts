import type { APIRoute } from "astro";
import { registerSchema } from "../../../lib/validation/auth.schema.ts";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

export const prerender = false;

/**
 * POST /api/auth/register
 * Registers a new user with email and password
 *
 * @body { email: string, password: string, username: string }
 * @returns 201 Created - User registered successfully, verification email sent
 * @returns 400 Bad Request - Validation error or registration failed
 * @returns 409 Conflict - Email already exists
 * @returns 500 Internal Server Error
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = registerSchema.safeParse(body);
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

    const { email, password, username } = validationResult.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Check if username already exists
    const { data: existingProfile } = await supabase.from("profiles").select("id").eq("username", username).single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "Username already taken",
        }),
        {
          status: 409,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
        // Email confirmation disabled - users can log in immediately
        // Username is stored in metadata and extracted by database trigger
      },
    });

    if (error) {
      // Check for specific error types
      if (error.message.includes("already registered")) {
        return new Response(
          JSON.stringify({
            error: "Conflict",
            message: "Email already registered",
          }),
          {
            status: 409,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Registration Failed",
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

    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: "Registration Failed",
          message: "User registration failed",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Note: Profile is automatically created via database trigger (handle_new_user)
    // See migration: 20251023000000_add_profile_trigger_and_fix_rls.sql
    // The trigger extracts username from user metadata and creates the profile atomically

    return new Response(
      JSON.stringify({
        message: "Registration successful. You can now log in.",
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        requiresEmailConfirmation: false,
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
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
