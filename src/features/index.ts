/**
 * Feature Flags Module
 *
 * Universal feature flag system for frontend and backend.
 * Separates deployments from releases with environment-based configuration.
 */

// Core configuration and types
export {
  featureFlags,
  getEnvironment,
  isFeatureEnabled,
  isFeatureEnabledForUser,
  getFeatureConfig,
  featureExists,
  type Environment,
  type FeatureFlag,
  type UserRole,
  type UserContext,
  type FlagConfig,
  type FeatureFlagConfig,
  type FeatureFlagsMap,
} from "./flags";

// API endpoint protection
export {
  checkFeatureAccess,
  withFeatureFlag,
  withFeatureFlagForUser,
  notFoundResponse,
  forbiddenResponse,
  type FeatureCheckResult,
  type FeatureProtectionOptions,
} from "./api";

// Astro page protection
export {
  checkPageAccess,
  guardPage,
  guardPageForUser,
  checkMultiplePages,
  checkMultiplePagesForUser,
  type PageProtectionOptions,
  type PageCheckResult,
} from "./pages";

// React component utilities
export {
  useFeatureFlag,
  useFeatureFlagForUser,
  useFeatureFlags,
  FeatureGate,
  withFeatureFlag as withFeatureFlagComponent,
  withFeatureFlagForUser as withFeatureFlagForUserComponent,
  type FeatureGateProps,
} from "./react";
