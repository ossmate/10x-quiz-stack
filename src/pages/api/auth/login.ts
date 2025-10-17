import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { loginSchema } from "../../../lib/validation/auth.schema.ts";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import type { Database } from "../../../db/database.types.ts";

export const prerender = false;

/**
 * POST /api/auth/login
 * Authenticates a user with email/username and password
 *
 * @body { emailOrUsername: string, password: string }
 * @returns 200 OK - Login successful
 * @returns 400 Bad Request - Validation error
 * @returns 401 Unauthorized - Invalid credentials
 * @returns 403 Forbidden - Email not verified
 * @returns 500 Internal Server Error
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = loginSchema.safeParse(body);
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

    const { emailOrUsername, password } = validationResult.data;

    // Create Supabase server instance for authentication
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Determine if input is email or username
    let email = emailOrUsername;
    const isEmail = emailOrUsername.includes("@");

    // If it's a username, look up the email from profiles table
    if (!isEmail) {
      // Query profiles table - public read access enabled via RLS policy
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", emailOrUsername)
        .single();

      if (profileError || !profileData) {
        // Don't reveal if username exists - return generic error
        return new Response(
          JSON.stringify({
            error: "Authentication Failed",
            message: "Invalid email or password",
          }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Create service role client only for admin.getUserById (still needed)
      const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        console.error("Service role key not configured");
        return new Response(
          JSON.stringify({
            error: "Configuration Error",
            message: "Server configuration error",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      const supabaseAdmin = createClient<Database>(
        import.meta.env.SUPABASE_URL,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      // Get the email associated with this user ID (requires admin API)
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profileData.id);

      if (userError || !userData.user || !userData.user.email) {
        return new Response(
          JSON.stringify({
            error: "Authentication Failed",
            message: "Invalid email or password",
          }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      email = userData.user.email;
    }

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check for specific error types
      if (error.message.includes("Email not confirmed")) {
        return new Response(
          JSON.stringify({
            error: "Email Not Verified",
            message: "Please verify your email address before logging in",
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Generic authentication error (don't reveal if email exists)
      return new Response(
        JSON.stringify({
          error: "Authentication Failed",
          message: "Invalid email or password",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: "Authentication Failed",
          message: "Login failed",
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
    const { data: profile } = await supabase.from("profiles").select("username").eq("id", data.user.id).single();

    return new Response(
      JSON.stringify({
        message: "Login successful",
        user: {
          id: data.user.id,
          email: data.user.email,
          username: profile?.username || email.split("@")[0], // Fallback to email prefix if no profile
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
    console.error("Login error:", error);
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
