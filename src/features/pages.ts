/**
 * Astro Page Feature Flag Protection
 *
 * Utilities for protecting Astro pages with feature flags.
 * Redirects to home or 404 when features are disabled.
 */

import type { AstroGlobal } from "astro";
import { isFeatureEnabled, isFeatureEnabledForUser, type FeatureFlag, type UserContext } from "./flags";

// ============================================================================
// Types
// ============================================================================

/**
 * Options for page feature flag protection
 */
export interface PageProtectionOptions {
  /**
   * Feature flag to check
   */
  feature: FeatureFlag;

  /**
   * User context for role-based checks (optional)
   */
  user?: UserContext | null;

  /**
   * Redirect URL when feature is disabled
   * @default '/'
   */
  redirectTo?: string;

  /**
   * Whether to redirect to 404 instead of home
   * @default false
   */
  return404?: boolean;
}

/**
 * Result of a page feature flag check
 */
export type PageCheckResult = { allowed: true } | { allowed: false; redirect: Response };

// ============================================================================
// Page Protection Functions
// ============================================================================

/**
 * Check if a feature is enabled for page access
 *
 * Returns a redirect Response if the feature is disabled, or null if allowed.
 *
 * @param Astro - Astro global object
 * @param options - Feature protection options
 * @returns PageCheckResult
 *
 * @example
 * // In an Astro page (.astro file)
 * ---
 * import { checkPageAccess } from '@/features/pages';
 *
 * const check = checkPageAccess(Astro, { feature: 'auth' });
 * if (!check.allowed) {
 *   return check.redirect;
 * }
 * ---
 */
export function checkPageAccess(Astro: AstroGlobal, options: PageProtectionOptions): PageCheckResult {
  const { feature, user, redirectTo = "/", return404 = false } = options;

  // Check feature flag
  const isEnabled = user ? isFeatureEnabledForUser(feature, user) : isFeatureEnabled(feature);

  if (!isEnabled) {
    // Return 404 or redirect
    if (return404) {
      return {
        allowed: false,
        redirect: new Response(null, {
          status: 404,
          statusText: "Not Found",
        }),
      };
    }

    return {
      allowed: false,
      redirect: Astro.redirect(redirectTo),
    };
  }

  return { allowed: true };
}

/**
 * Guard function for Astro pages with feature flags
 *
 * Throws a redirect response if the feature is disabled.
 * Use this at the top of your Astro page component script.
 *
 * @param Astro - Astro global object
 * @param options - Feature protection options
 *
 * @example
 * // In an Astro page (.astro file)
 * ---
 * import { guardPage } from '@/features/pages';
 *
 * guardPage(Astro, { feature: 'auth' });
 * // Page content will only render if feature is enabled
 * ---
 */
export function guardPage(Astro: AstroGlobal, options: PageProtectionOptions): void {
  const check = checkPageAccess(Astro, options);

  if (!check.allowed) {
    throw check.redirect;
  }
}

/**
 * Guard function for Astro pages with user/role-based feature flags
 *
 * Convenience wrapper that extracts user from Astro.locals
 *
 * @param Astro - Astro global object
 * @param feature - Feature flag to check
 * @param options - Additional options
 *
 * @example
 * // In an Astro page (.astro file)
 * ---
 * import { guardPageForUser } from '@/features/pages';
 *
 * guardPageForUser(Astro, 'collections');
 * // Page content will only render if user has access
 * ---
 */
export function guardPageForUser(
  Astro: AstroGlobal,
  feature: FeatureFlag,
  options?: Omit<PageProtectionOptions, "feature" | "user">
): void {
  const user = (Astro.locals.user as UserContext) || null;

  guardPage(Astro, {
    feature,
    user,
    ...options,
  });
}

/**
 * Check if multiple pages are enabled
 *
 * Useful for navigation menus or link visibility
 *
 * @param features - Array of feature flags to check
 * @returns Object with feature names as keys and boolean values
 *
 * @example
 * const enabledPages = checkMultiplePages(['auth', 'collections']);
 * // { auth: true, collections: false }
 */
export function checkMultiplePages(features: FeatureFlag[]): Record<FeatureFlag, boolean> {
  return features.reduce(
    (acc, feature) => {
      acc[feature] = isFeatureEnabled(feature);
      return acc;
    },
    {} as Record<FeatureFlag, boolean>
  );
}

/**
 * Check if multiple pages are enabled for a user
 *
 * @param features - Array of feature flags to check
 * @param user - User context
 * @returns Object with feature names as keys and boolean values
 */
export function checkMultiplePagesForUser(
  features: FeatureFlag[],
  user: UserContext | null | undefined
): Record<FeatureFlag, boolean> {
  return features.reduce(
    (acc, feature) => {
      acc[feature] = isFeatureEnabledForUser(feature, user);
      return acc;
    },
    {} as Record<FeatureFlag, boolean>
  );
}
