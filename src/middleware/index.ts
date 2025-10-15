import { createClient } from "@supabase/supabase-js";
import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

import type { Database } from "../db/database.types.ts";

/**
 * List of routes that require authentication
 * Currently not enforced - uncomment the authentication check below to enable
 */
// const PROTECTED_ROUTES = ["/dashboard", "/quizzes/create", "/profile"];

export const onRequest = defineMiddleware(async (context, next) => {
  // For API routes, use service role key to bypass RLS
  if (context.url.pathname.startsWith("/api/")) {
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (serviceRoleKey) {
      // Use service role client (bypasses RLS)
      context.locals.supabase = createClient<Database>(import.meta.env.SUPABASE_URL, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    } else {
      // Fallback to regular client (RLS will apply)
      context.locals.supabase = supabaseClient;
    }
  } else {
    context.locals.supabase = supabaseClient;
  }

  // Check authentication for protected routes
  // Note: Authentication check is currently disabled for easier development
  // To enable authentication, uncomment the following code:
  /*
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => context.url.pathname.startsWith(route));

  if (isProtectedRoute) {
    const {
      data: { session },
    } = await context.locals.supabase.auth.getSession();

    if (!session) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(context.url.pathname)}`;
      return Response.redirect(new URL(redirectUrl, context.url.origin));
    }
  }
  */

  return next();
});
