# Feature Flags System

Universal TypeScript feature flag system for separating deployments from releases. Works across frontend (React/Astro) and backend (API endpoints).

## Features

- ✅ **Type-safe**: Centralized feature flag registry with TypeScript autocomplete
- ✅ **Environment-based**: Different configurations for local, integration, and prod
- ✅ **Build-time**: Flags baked into the build (no runtime overhead)
- ✅ **Role-based**: Support for user/role-based targeting
- ✅ **Universal**: Works on both frontend and backend
- ✅ **Secure**: No overrides - strictly environment-based

## Configuration

### 1. Set Environment Variable

Add `ENV_NAME` to your environment configuration:

```bash
# .env
ENV_NAME=local  # Options: local, integration, prod
```

### 2. Configure Feature Flags

Edit `src/features/flags.ts` to enable/disable features per environment:

```typescript
export const featureFlags: FeatureFlagsMap = {
  local: {
    auth: { type: 'boolean', enabled: true },
    collections: { type: 'boolean', enabled: true },
  },
  integration: {
    auth: { type: 'boolean', enabled: true },
    collections: { type: 'role-based', allowedRoles: ['admin'] },
  },
  prod: {
    auth: { type: 'boolean', enabled: true },
    collections: { type: 'boolean', enabled: false },
  },
};
```

### 3. Add New Feature Flags

To add a new feature flag:

1. Add the flag name to the `FeatureFlag` type in `flags.ts`:
   ```typescript
   export type FeatureFlag = 'auth' | 'collections' | 'your-new-feature';
   ```

2. Add configuration for all environments:
   ```typescript
   export const featureFlags: FeatureFlagsMap = {
     local: {
       // ... existing flags
       'your-new-feature': { type: 'boolean', enabled: true },
     },
     integration: {
       // ... existing flags
       'your-new-feature': { type: 'boolean', enabled: true },
     },
     prod: {
       // ... existing flags
       'your-new-feature': { type: 'boolean', enabled: false },
     },
   };
   ```

## Usage

### API Endpoints

Protect API routes with feature flags. Returns 404 or 403 when disabled.

#### Basic Protection (Boolean Flag)

```typescript
// src/pages/api/collections.ts
import type { APIContext } from 'astro';
import { checkFeatureAccess } from '@/features';

export async function GET(context: APIContext) {
  // Check if collections feature is enabled
  const check = checkFeatureAccess({ feature: 'collections' });
  if (!check.allowed) {
    return check.response; // Returns 404 by default
  }

  // Your API logic here
  return new Response(JSON.stringify({ data: [] }));
}
```

#### With Wrapper (Cleaner)

```typescript
// src/pages/api/collections.ts
import type { APIContext } from 'astro';
import { withFeatureFlag } from '@/features';

export const GET = withFeatureFlag(
  'collections',
  async (context: APIContext) => {
    // Your API logic here
    return new Response(JSON.stringify({ data: [] }));
  }
);
```

#### Role-Based Protection

```typescript
// src/pages/api/collections.ts
import type { APIContext } from 'astro';
import { withFeatureFlagForUser } from '@/features';

export const GET = withFeatureFlagForUser(
  'collections',
  (context) => context.locals.user, // Extract user from context
  async (context: APIContext) => {
    // Your API logic here
    return new Response(JSON.stringify({ data: [] }));
  }
);
```

#### Custom Status Code and Message

```typescript
import { checkFeatureAccess } from '@/features';

export async function GET(context: APIContext) {
  const check = checkFeatureAccess({
    feature: 'collections',
    statusCode: 403, // Use 403 instead of 404
    message: 'Collections feature is not available',
  });

  if (!check.allowed) {
    return check.response;
  }

  // Your API logic
}
```

### Astro Pages

Protect Astro pages with feature flags. Redirects to home or 404 when disabled.

#### Basic Protection

```astro
---
// src/pages/login.astro
import { guardPage } from '@/features';

// Redirect to home if auth is disabled
guardPage(Astro, { feature: 'auth' });
---

<html>
  <body>
    <h1>Login Page</h1>
    <!-- Page content only renders if feature is enabled -->
  </body>
</html>
```

#### Redirect to 404

```astro
---
// src/pages/signup.astro
import { guardPage } from '@/features';

// Return 404 if auth is disabled
guardPage(Astro, {
  feature: 'auth',
  return404: true,
});
---

<html>
  <body>
    <h1>Sign Up</h1>
  </body>
</html>
```

#### Custom Redirect

```astro
---
// src/pages/reset-password.astro
import { guardPage } from '@/features';

// Redirect to custom URL if auth is disabled
guardPage(Astro, {
  feature: 'auth',
  redirectTo: '/login',
});
---

<html>
  <body>
    <h1>Reset Password</h1>
  </body>
</html>
```

#### Role-Based Protection

```astro
---
// src/pages/admin/collections.astro
import { guardPageForUser } from '@/features';

// Only allow users with proper roles
guardPageForUser(Astro, 'collections');
// Assumes Astro.locals.user contains user context
---

<html>
  <body>
    <h1>Collections Admin</h1>
  </body>
</html>
```

#### Manual Check (More Control)

```astro
---
import { checkPageAccess } from '@/features';

const check = checkPageAccess(Astro, { feature: 'auth' });
if (!check.allowed) {
  return check.redirect;
}

// Additional logic before rendering
const title = 'Login Page';
---

<html>
  <body>
    <h1>{title}</h1>
  </body>
</html>
```

### React Components

Hide components completely when features are disabled.

#### Using FeatureGate Component

```tsx
// src/components/TwoPane.tsx
import { FeatureGate } from '@/features';

export function TwoPane() {
  return (
    <div>
      <h1>Main Content</h1>

      {/* Hide collections panel when disabled */}
      <FeatureGate feature="collections">
        <CollectionsPanel />
      </FeatureGate>
    </div>
  );
}
```

#### With User Context

```tsx
// src/components/TwoPane.tsx
import { FeatureGate } from '@/features';
import type { UserContext } from '@/features';

interface TwoPaneProps {
  user: UserContext;
}

export function TwoPane({ user }: TwoPaneProps) {
  return (
    <div>
      <h1>Main Content</h1>

      {/* Only show for users with proper roles */}
      <FeatureGate feature="collections" user={user}>
        <CollectionsPanel />
      </FeatureGate>
    </div>
  );
}
```

#### Using Hook

```tsx
// src/components/MobileNavigation.tsx
import { useFeatureFlag } from '@/features';

export function MobileNavigation() {
  const isAuthEnabled = useFeatureFlag('auth');
  const isCollectionsEnabled = useFeatureFlag('collections');

  return (
    <nav>
      <a href="/">Home</a>

      {/* Conditionally render navigation items */}
      {isAuthEnabled && (
        <>
          <a href="/login">Login</a>
          <a href="/signup">Sign Up</a>
        </>
      )}

      {isCollectionsEnabled && (
        <a href="/collections">Collections</a>
      )}
    </nav>
  );
}
```

#### Using Hook with User

```tsx
// src/components/MobileNavigation.tsx
import { useFeatureFlagForUser } from '@/features';
import type { UserContext } from '@/features';

interface MobileNavigationProps {
  user?: UserContext;
}

export function MobileNavigation({ user }: MobileNavigationProps) {
  const canAccessCollections = useFeatureFlagForUser('collections', user);

  return (
    <nav>
      <a href="/">Home</a>
      {canAccessCollections && (
        <a href="/collections">Collections</a>
      )}
    </nav>
  );
}
```

#### Multiple Flags

```tsx
import { useFeatureFlags } from '@/features';

export function Navigation() {
  const features = useFeatureFlags(['auth', 'collections']);

  return (
    <nav>
      {features.auth && <a href="/login">Login</a>}
      {features.collections && <a href="/collections">Collections</a>}
    </nav>
  );
}
```

#### Higher-Order Component

```tsx
// Wrap entire component
import { withFeatureFlag } from '@/features/react';

function CollectionsPanelComponent() {
  return <div>Collections Content</div>;
}

// Only renders when collections feature is enabled
export const CollectionsPanel = withFeatureFlag(
  'collections',
  CollectionsPanelComponent
);
```

## Advanced Usage

### Checking Multiple Pages

```typescript
// Useful for navigation menus
import { checkMultiplePages } from '@/features';

const enabledPages = checkMultiplePages(['auth', 'collections']);
// { auth: true, collections: false }
```

### Getting Raw Configuration

```typescript
import { getFeatureConfig } from '@/features';

const config = getFeatureConfig('collections');
// { type: 'role-based', allowedRoles: ['admin'] }
```

### Environment Detection

```typescript
import { getEnvironment } from '@/features';

const env = getEnvironment(); // 'local' | 'integration' | 'prod'
```

## Type Definitions

### UserContext

```typescript
interface UserContext {
  id?: string;
  roles?: UserRole[];
  email?: string;
}
```

### UserRole

```typescript
type UserRole = 'admin' | 'user' | 'guest';
```

Add more roles by editing the `UserRole` type in `flags.ts`.

## Best Practices

1. **Always use type-safe flag names**: TypeScript will autocomplete available flags
2. **Handle disabled states gracefully**: Use appropriate status codes and redirects
3. **Document flag purposes**: Add comments explaining what each flag controls
4. **Test all environments**: Verify feature behavior in local, integration, and prod
5. **Plan rollouts**: Use integration environment to test with specific roles before prod
6. **Keep flags temporary**: Remove flags and conditional code once features are stable

## Troubleshooting

### Feature flag not working?

1. Check `ENV_NAME` environment variable is set correctly
2. Verify flag is configured in `flags.ts` for your environment
3. Rebuild the application (flags are build-time)
4. Check TypeScript errors for typos in flag names

### Getting "ENV_NAME not set" warning?

Add `ENV_NAME` to your environment configuration:

```bash
# .env
ENV_NAME=local
```

### User roles not working?

1. Ensure user context includes `roles` array
2. Verify roles match `allowedRoles` in flag configuration
3. Check user is passed correctly to functions/components

## Migration Guide

### From Existing Code

1. **Identify features to flag**: auth, collections, etc.
2. **Add flags to configuration**: Edit `flags.ts`
3. **Wrap API endpoints**: Use `withFeatureFlag` or `checkFeatureAccess`
4. **Guard Astro pages**: Use `guardPage` at the top of pages
5. **Wrap React components**: Use `<FeatureGate>` or `useFeatureFlag`
6. **Test each environment**: Verify behavior in local, integration, prod

## Examples

See usage examples above for:
- API endpoints: `src/pages/api/collections.ts`
- Astro pages: `login.astro`, `signup.astro`, `reset-password.astro`
- React components: `TwoPane.tsx`, `MobileNavigation.tsx`
