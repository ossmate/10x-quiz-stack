/**
 * React Component Feature Flag Utilities
 *
 * Hooks and components for conditional rendering based on feature flags.
 * Components are completely hidden when features are disabled.
 */

import { useMemo } from "react";
import type { ReactNode } from "react";
import { isFeatureEnabled, isFeatureEnabledForUser, type FeatureFlag, type UserContext } from "./flags";

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to check if a feature is enabled
 *
 * @param feature - Feature flag to check
 * @returns true if the feature is enabled, false otherwise
 *
 * @example
 * function MyComponent() {
 *   const isAuthEnabled = useFeatureFlag('auth');
 *
 *   if (!isAuthEnabled) {
 *     return null;
 *   }
 *
 *   return <div>Auth UI</div>;
 * }
 */
export function useFeatureFlag(feature: FeatureFlag): boolean {
  return useMemo(() => isFeatureEnabled(feature), [feature]);
}

/**
 * Hook to check if a feature is enabled for a specific user
 *
 * @param feature - Feature flag to check
 * @param user - User context with roles
 * @returns true if the feature is enabled for the user, false otherwise
 *
 * @example
 * function MyComponent({ user }) {
 *   const canAccessCollections = useFeatureFlagForUser('collections', user);
 *
 *   if (!canAccessCollections) {
 *     return null;
 *   }
 *
 *   return <div>Collections UI</div>;
 * }
 */
export function useFeatureFlagForUser(feature: FeatureFlag, user: UserContext | null | undefined): boolean {
  return useMemo(() => isFeatureEnabledForUser(feature, user), [feature, user]);
}

/**
 * Hook to check multiple feature flags at once
 *
 * @param features - Array of feature flags to check
 * @returns Object with feature names as keys and boolean values
 *
 * @example
 * function MyComponent() {
 *   const features = useFeatureFlags(['auth', 'collections']);
 *   // { auth: true, collections: false }
 *
 *   return (
 *     <div>
 *       {features.auth && <AuthButton />}
 *       {features.collections && <CollectionsLink />}
 *     </div>
 *   );
 * }
 */
export function useFeatureFlags(features: FeatureFlag[]): Record<FeatureFlag, boolean> {
  return useMemo(() => {
    return features.reduce(
      (acc, feature) => {
        acc[feature] = isFeatureEnabled(feature);
        return acc;
      },
      {} as Record<FeatureFlag, boolean>
    );
  }, [features]);
}

// ============================================================================
// Components
// ============================================================================

/**
 * Props for FeatureGate component
 */
export interface FeatureGateProps {
  /**
   * Feature flag to check
   */
  feature: FeatureFlag;

  /**
   * User context for role-based checks (optional)
   */
  user?: UserContext | null;

  /**
   * Content to render when feature is enabled
   */
  children: ReactNode;

  /**
   * Fallback content to render when feature is disabled (optional)
   * Default: null (completely hidden)
   */
  fallback?: ReactNode;
}

/**
 * Component wrapper for feature flag gating
 *
 * Renders children only when the feature is enabled.
 * Completely hidden (returns null) when disabled.
 *
 * @example
 * <FeatureGate feature="auth">
 *   <LoginButton />
 * </FeatureGate>
 *
 * @example
 * // With user context
 * <FeatureGate feature="collections" user={currentUser}>
 *   <CollectionsPanel />
 * </FeatureGate>
 *
 * @example
 * // With fallback
 * <FeatureGate feature="collections" fallback={<ComingSoon />}>
 *   <CollectionsPanel />
 * </FeatureGate>
 */
export function FeatureGate({ feature, user, children, fallback = null }: FeatureGateProps) {
  const isEnabled = user ? isFeatureEnabledForUser(feature, user) : isFeatureEnabled(feature);

  if (!isEnabled) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for feature flag gating
 *
 * Wraps a component to only render when a feature is enabled.
 *
 * @param feature - Feature flag to check
 * @param Component - Component to wrap
 * @returns Wrapped component
 *
 * @example
 * const LoginPage = withFeatureFlag('auth', LoginPageComponent);
 *
 * @example
 * // With user context
 * const CollectionsPanel = withFeatureFlagForUser(
 *   'collections',
 *   CollectionsPanelComponent,
 *   (props) => props.user
 * );
 */
export function withFeatureFlag<P extends object>(
  feature: FeatureFlag,
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const isEnabled = useFeatureFlag(feature);

    if (!isEnabled) {
      return null;
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withFeatureFlag(${feature})(${Component.displayName || Component.name || "Component"})`;

  return WrappedComponent;
}

/**
 * Higher-order component for user/role-based feature flag gating
 *
 * @param feature - Feature flag to check
 * @param Component - Component to wrap
 * @param getUserContext - Function to extract user from props
 * @returns Wrapped component
 *
 * @example
 * const CollectionsPanel = withFeatureFlagForUser(
 *   'collections',
 *   CollectionsPanelComponent,
 *   (props) => props.user
 * );
 */
export function withFeatureFlagForUser<P extends object>(
  feature: FeatureFlag,
  Component: React.ComponentType<P>,
  getUserContext: (props: P) => UserContext | null | undefined
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const user = getUserContext(props);
    const isEnabled = useFeatureFlagForUser(feature, user);

    if (!isEnabled) {
      return null;
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withFeatureFlagForUser(${feature})(${Component.displayName || Component.name || "Component"})`;

  return WrappedComponent;
}
