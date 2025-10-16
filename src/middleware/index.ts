import { createClient } from "@supabase/supabase-js";
import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance, supabaseClient } from "../db/supabase.client.ts";

import type { Database } from "../db/database.types.ts";

/**
 * Public paths - accessible without authentication
 * These include auth pages and public API endpoints
 */
const PUBLIC_PATHS = [
  // Public pages
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/session",
];

/**
 * Protected routes - require authentication
 */
const PROTECTED_ROUTES = [
  "/quizzes/new",
  "/quizzes/ai/generate",
  "/auth/change-password",
  // Add more protected routes here
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, request, redirect, locals } = context;

  // For API routes (non-auth), use service role key to bypass RLS
  if (url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/auth/")) {
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (serviceRoleKey) {
      // Use service role client (bypasses RLS)
      locals.supabase = createClient<Database>(import.meta.env.SUPABASE_URL, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    } else {
      // Fallback to regular client (RLS will apply)
      locals.supabase = supabaseClient;
    }

    return next();
  }

  // For auth routes and pages, use SSR-compatible client
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  locals.supabase = supabase;

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Store user in locals for easy access
  if (user) {
    locals.user = {
      id: user.id,
      email: user.email || "",
    };
  }

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => {
    if (route.includes("*")) {
      const pattern = new RegExp(`^${route.replace("*", ".*")}$`);
      return pattern.test(url.pathname);
    }
    return url.pathname.startsWith(route);
  });

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    const redirectUrl = `/auth/login?redirect=${encodeURIComponent(url.pathname)}`;
    return redirect(redirectUrl);
  }

  // Redirect authenticated users from auth pages to home
  const isAuthPage = url.pathname === "/auth/login" || url.pathname === "/auth/register";
  if (isAuthPage && user) {
    return redirect("/");
  }

  return next();
});
