import { createClient } from "@supabase/supabase-js";
import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

import type { Database } from "../db/database.types.ts";

export const onRequest = defineMiddleware((context, next) => {
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

  return next();
});
