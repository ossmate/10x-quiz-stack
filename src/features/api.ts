/**
 * API Endpoint Feature Flag Protection
 *
 * Utilities for protecting API endpoints with feature flags.
 * Returns 404 or 403 responses when features are disabled.
 */

import type { APIContext } from "astro";
import { isFeatureEnabled, isFeatureEnabledForUser, type FeatureFlag, type UserContext } from "./flags";

// ============================================================================
// Types
// ============================================================================

/**
 * Result of a feature flag check for API endpoints
 */
export type FeatureCheckResult = { allowed: true } | { allowed: false; response: Response };

/**
 * Options for feature flag protection
 */
export interface FeatureProtectionOptions {
  /**
   * Feature flag to check
   */
  feature: FeatureFlag;

  /**
   * User context for role-based checks (optional)
   */
  user?: UserContext | null;

  /**
   * HTTP status code to return when feature is disabled
   * @default 404
   */
  statusCode?: 404 | 403;

  /**
   * Custom error message (optional)
   */
  message?: string;
}

// ============================================================================
// API Protection Functions
// ============================================================================

/**
 * Check if a feature is enabled for API access
 *
 * Returns a Response object if the feature is disabled, or null if allowed.
 *
 * @param options - Feature protection options
 * @returns FeatureCheckResult
 *
 * @example
 * // In an API route
 * export async function GET(context: APIContext) {
 *   const check = checkFeatureAccess({ feature: 'collections' });
 *   if (!check.allowed) {
 *     return check.response;
 *   }
 *   // Continue with API logic
 * }
 */
export function checkFeatureAccess(options: FeatureProtectionOptions): FeatureCheckResult {
  const { feature, user, statusCode = 404, message } = options;

  // Check feature flag
  const isEnabled = user ? isFeatureEnabledForUser(feature, user) : isFeatureEnabled(feature);

  if (!isEnabled) {
    const errorMessage = message || (statusCode === 404 ? "Not Found" : "Forbidden - Feature not available");

    return {
      allowed: false,
      response: new Response(JSON.stringify({ error: errorMessage }), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  return { allowed: true };
}

/**
 * Middleware wrapper for protecting API endpoints with feature flags
 *
 * @param feature - Feature flag to check
 * @param handler - API route handler to execute if feature is enabled
 * @param options - Additional options
 * @returns API route handler
 *
 * @example
 * export const GET = withFeatureFlag(
 *   'collections',
 *   async (context) => {
 *     // Your API logic here
 *     return new Response(JSON.stringify({ data: [] }));
 *   }
 * );
 */
export function withFeatureFlag(
  feature: FeatureFlag,
  handler: (context: APIContext) => Promise<Response> | Response,
  options?: Omit<FeatureProtectionOptions, "feature">
): (context: APIContext) => Promise<Response> {
  return async (context: APIContext) => {
    const check = checkFeatureAccess({
      feature,
      ...options,
    });

    if (!check.allowed) {
      return check.response;
    }

    return handler(context);
  };
}

/**
 * Middleware wrapper for protecting API endpoints with user/role-based feature flags
 *
 * @param feature - Feature flag to check
 * @param getUserContext - Function to extract user context from API context
 * @param handler - API route handler to execute if feature is enabled
 * @param options - Additional options
 * @returns API route handler
 *
 * @example
 * export const GET = withFeatureFlagForUser(
 *   'collections',
 *   (context) => context.locals.user, // Extract user from context
 *   async (context) => {
 *     // Your API logic here
 *     return new Response(JSON.stringify({ data: [] }));
 *   }
 * );
 */
export function withFeatureFlagForUser(
  feature: FeatureFlag,
  getUserContext: (context: APIContext) => UserContext | null | undefined,
  handler: (context: APIContext) => Promise<Response> | Response,
  options?: Omit<FeatureProtectionOptions, "feature" | "user">
): (context: APIContext) => Promise<Response> {
  return async (context: APIContext) => {
    const user = getUserContext(context);

    const check = checkFeatureAccess({
      feature,
      user,
      ...options,
    });

    if (!check.allowed) {
      return check.response;
    }

    return handler(context);
  };
}

/**
 * Helper to create a 404 response
 */
export function notFoundResponse(message = "Not Found"): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Helper to create a 403 response
 */
export function forbiddenResponse(message = "Forbidden - Feature not available"): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
