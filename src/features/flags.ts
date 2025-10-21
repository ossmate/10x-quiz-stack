/**
 * Feature Flag System
 *
 * Centralized feature flag configuration for controlling feature visibility
 * across different environments (local, integration, prod).
 *
 * Supports:
 * - Boolean flags (simple on/off)
 * - User/role-based targeting
 * - Type-safe flag checking
 * - Build-time configuration
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Supported environments
 */
export type Environment = "local" | "integration" | "prod";

/**
 * Available feature flags - add new flags here for autocomplete support
 */
export type FeatureFlag = "auth" | "collections";

/**
 * User roles for role-based targeting
 */
export type UserRole = "admin" | "user" | "guest";

/**
 * User context for role-based feature checks
 */
export interface UserContext {
  id?: string;
  roles?: UserRole[];
  email?: string;
}

/**
 * Flag configuration types
 */
export type FlagConfig = { type: "boolean"; enabled: boolean } | { type: "role-based"; allowedRoles: UserRole[] };

/**
 * Feature flag configuration for a single environment
 */
export type FeatureFlagConfig = Record<FeatureFlag, FlagConfig>;

/**
 * Complete feature flag configuration for all environments
 */
export type FeatureFlagsMap = Record<Environment, FeatureFlagConfig>;

// ============================================================================
// Configuration
// ============================================================================

/**
 * Feature flag configuration for all environments
 *
 * Modify this configuration to enable/disable features per environment.
 */
export const featureFlags: FeatureFlagsMap = {
  local: {
    auth: { type: "boolean", enabled: true },
    collections: { type: "boolean", enabled: true },
  },
  integration: {
    auth: { type: "boolean", enabled: true },
    collections: { type: "role-based", allowedRoles: ["admin"] },
  },
  prod: {
    auth: { type: "boolean", enabled: true },
    collections: { type: "boolean", enabled: false },
  },
};

// ============================================================================
// Environment Detection
// ============================================================================

/**
 * Get current environment from ENV_NAME environment variable
 */
function getCurrentEnvironment(): Environment {
  const envName = import.meta.env.ENV_NAME as string | undefined;

  if (!envName) {
    console.warn('ENV_NAME not set, defaulting to "local"');
    return "local";
  }

  if (envName !== "local" && envName !== "integration" && envName !== "prod") {
    console.warn(`Invalid ENV_NAME "${envName}", defaulting to "local"`);
    return "local";
  }

  return envName;
}

/**
 * Current environment (cached for performance)
 */
const currentEnvironment: Environment = getCurrentEnvironment();

/**
 * Get the current environment
 */
export function getEnvironment(): Environment {
  return currentEnvironment;
}

// ============================================================================
// Feature Flag Checking Functions
// ============================================================================

/**
 * Check if a feature is enabled (boolean flags only)
 *
 * @param feature - The feature flag to check
 * @returns true if the feature is enabled, false otherwise
 *
 * @example
 * if (isFeatureEnabled('auth')) {
 *   // Show auth UI
 * }
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  const config = featureFlags[currentEnvironment][feature];

  if (config.type === "boolean") {
    return config.enabled;
  }

  // Role-based flags without user context are disabled by default
  return false;
}

/**
 * Check if a feature is enabled for a specific user (supports role-based flags)
 *
 * @param feature - The feature flag to check
 * @param user - User context with roles
 * @returns true if the feature is enabled for the user, false otherwise
 *
 * @example
 * if (isFeatureEnabledForUser('collections', { roles: ['admin'] })) {
 *   // Show collections feature
 * }
 */
export function isFeatureEnabledForUser(feature: FeatureFlag, user: UserContext | null | undefined): boolean {
  const config = featureFlags[currentEnvironment][feature];

  if (config.type === "boolean") {
    return config.enabled;
  }

  if (config.type === "role-based") {
    // No user or no roles = disabled
    if (!user || !user.roles || user.roles.length === 0) {
      return false;
    }

    // Check if user has any of the allowed roles
    return config.allowedRoles.some((allowedRole) => user.roles!.includes(allowedRole));
  }

  return false;
}

/**
 * Get the configuration for a specific feature
 *
 * @param feature - The feature flag to get config for
 * @returns The flag configuration
 */
export function getFeatureConfig(feature: FeatureFlag): FlagConfig {
  return featureFlags[currentEnvironment][feature];
}

/**
 * Check if a feature exists in the registry
 *
 * @param feature - The feature flag to check
 * @returns true if the feature exists, false otherwise
 */
export function featureExists(feature: string): feature is FeatureFlag {
  return feature in featureFlags[currentEnvironment];
}
