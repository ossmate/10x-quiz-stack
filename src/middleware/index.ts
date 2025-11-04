import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

/**
 * Protected routes - require authentication
 */
const PROTECTED_ROUTES = [
  "/dashboard",
  "/quizzes/new",
  "/quizzes/ai/generate",
  "/quizzes/*/edit",
  "/auth/change-password",
  // Add more protected routes here
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, request, redirect, locals } = context;

  // For all routes, use SSR-compatible client (RLS enforced)
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
    // Fetch username from profiles table
    const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();

    locals.user = {
      id: user.id,
      email: user.email || "",
      username: profile?.username || user.email?.split("@")[0] || "User",
    };
  }

  // Check if this is a demo quiz route - these are public
  const isDemoQuizRoute = /^\/quizzes\/demo-[^/]+\/take$/.test(url.pathname);

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => {
    if (route.includes("*")) {
      const pattern = new RegExp(`^${route.replace("*", ".*")}$`);
      return pattern.test(url.pathname);
    }
    return url.pathname.startsWith(route);
  });

  // Redirect unauthenticated users from protected routes (except demo quiz routes)
  if (isProtectedRoute && !user && !isDemoQuizRoute) {
    const redirectUrl = `/auth/login?redirect=${encodeURIComponent(url.pathname)}`;
    return redirect(redirectUrl);
  }

  // Redirect authenticated users from auth pages to dashboard
  const isAuthPage = url.pathname === "/auth/login" || url.pathname === "/auth/register";
  if (isAuthPage && user) {
    return redirect("/dashboard");
  }

  return next();
});
