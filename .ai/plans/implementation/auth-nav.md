# Authentication Navigation Optimization Plan

## 1. Overview

The authentication UI (user avatar and auth buttons) currently causes visual jumping during page navigation due to redundant session fetching and lack of caching. Every page transition shows a loading skeleton for 100-500ms while the AuthButtons component fetches the session from `/api/auth/session`, even though the middleware has already validated the session server-side. This plan implements a hybrid optimization strategy combining SSR data passing, React Query for caching, and session storage for instant display.

## 2. Current Problems Analysis

### Performance Issues Identified

**Problem 1: Redundant Session Fetching**
- **Location:** `src/components/auth/AuthButtons.tsx:27-47`
- **Issue:** Uses `useEffect` to fetch `/api/auth/session` on every component mount
- **Impact:** Every page navigation triggers a full API request, even if visited seconds ago
- **User Experience:** Loading skeleton always shows, causes UI jumping, feels janky

**Problem 2: Middleware Already Has Session Data**
- **Location:** `src/middleware/index.ts:50-61`
- **Issue:** Middleware fetches user session with `supabase.auth.getUser()` and stores in `locals.user`
- **Impact:** Session is fetched twice - once server-side (middleware), once client-side (AuthButtons)
- **User Experience:** Wasted bandwidth, slower navigation, double database queries

**Problem 3: No Caching Strategy**
- **Location:** `src/components/auth/AuthButtons.tsx:23-47`
- **Issue:** No caching of auth state, every mount fetches fresh
- **Impact:** Navigating away and back triggers full refetch even with unchanged auth state
- **User Experience:** Unnecessary loading states, poor perceived performance

**Problem 4: Client-Side Only Rendering**
- **Location:** `src/layouts/ManagementLayout.astro:24`, `src/layouts/Layout.astro:40`
- **Issue:** Uses `client:load` directive with no SSR data passed
- **Impact:** No initial auth state on page load, always shows loading skeleton first
- **User Experience:** Feels sluggish, layout shift on every navigation

**Problem 5: No Global Auth Context**
- **Location:** All auth components fetch independently
- **Issue:** Each component instance manages its own auth state
- **Impact:** Multiple components could fetch session independently, no shared state
- **User Experience:** Inconsistent auth state across components

**Problem 6: Astro Islands Re-Hydration**
- **Location:** Both layouts use `client:load` directive
- **Issue:** `client:load` hydrates on every page load, resetting component state
- **Impact:** Auth state lost on navigation, component remounts completely
- **User Experience:** Always shows loading skeleton, even for cached data

### Measured Impact

- **Initial Load Time:** Always shows 100-500ms loading skeleton
- **Navigation Time:** 100-500ms loading skeleton on every page transition
- **Redundant Requests:** 2x more API calls than necessary (middleware + client)
- **Cache Hit Rate:** 0% (no caching implemented)
- **Layout Shift:** User avatar appears after 100-500ms delay, causing CLS

## 3. Proposed Solution Architecture

### Three-Pillar Optimization Strategy

**Pillar 1: SSR Data Passing**
- Middleware already has `locals.user` from session validation
- Pass initial auth state as props from Astro layouts to React components
- Eliminates initial fetch, shows auth UI instantly
- No loading skeleton on first render

**Pillar 2: React Query Integration**
- Replace manual useState/useEffect with `@tanstack/react-query`
- Automatic caching, deduplication, background refetching
- Share cache across all page navigations
- Configurable stale times (5-10 minutes for auth)

**Pillar 3: Session Storage for Instant Display**
- Store auth state in sessionStorage for immediate display
- Read from sessionStorage on mount (instant, no flicker)
- Validate in background with React Query
- Update if state changed (logout elsewhere, etc.)

### Performance Targets

- **Initial Load:** <50ms to show auth UI (no loading skeleton)
- **Navigation:** <50ms instant display from cache
- **Cache Hit Rate:** >95% for typical navigation patterns
- **API Calls Reduction:** 50% fewer requests (eliminate client fetch when middleware validates)
- **Layout Shift:** Zero CLS from auth UI loading

### Architecture Diagram

```
Before:
┌─────────────────────────────┐
│  Layout.astro               │
│  (no auth data passed)      │
└────────┬────────────────────┘
         │ client:load
         ▼
┌─────────────────────────────┐
│  AuthButtons                │
│  ├─ useEffect (mount)       │ ───► Fetch /api/auth/session (100-500ms)
│  ├─ Shows loading skeleton  │      Every navigation!
│  └─ No caching              │
└─────────────────────────────┘

After:
┌──────────────────────────────────┐
│  Layout.astro                    │
│  ├─ Middleware has locals.user   │ ◄─── Already validated!
│  └─ Pass initialUser prop        │
└────────┬─────────────────────────┘
         │ client:load (with data)
         ▼
┌──────────────────────────────────────┐
│  AuthProvider (React Query)          │
│  ├─ Reads sessionStorage (instant!)  │
│  └─ AuthButtons                      │
│     ├─ useAuthQuery (cached)         │ ◄─── Uses initialUser (instant!)
│     │  └─ staleTime: 5min            │      Background revalidation
│     └─ No loading skeleton           │      95% cache hits
└──────────────────────────────────────┘
```

## 4. Component Changes

### New Components

**AuthProvider.tsx** (New)
- **Purpose:** Global React Query provider for auth state
- **Location:** `/src/components/providers/AuthProvider.tsx`
- **Responsibilities:**
  - Initialize QueryClient for auth queries
  - Provide auth context to all components
  - Manage sessionStorage sync
  - Handle logout (clear cache and storage)
- **Props:** `{ children: ReactNode, initialUser?: User | null }`

**useAuthQuery.ts** (New Hook)
- **Purpose:** React Query hook for auth state
- **Location:** `/src/hooks/useAuthQuery.ts`
- **Responsibilities:**
  - Fetch auth session from `/api/auth/session`
  - Cache for 5-10 minutes
  - Sync with sessionStorage
  - Provide loading/error states
- **Return:** `{ user: User | null, isLoading: boolean, error: Error | null }`

### Modified Components

**AuthButtons.tsx** (Refactored)
- **Current:** Manual useState/useEffect with fetch
- **Changes:**
  - Replace with `useAuthQuery()` hook
  - Remove manual loading state (React Query handles it)
  - Use sessionStorage for instant display on mount
  - Remove loading skeleton (data always available)
  - Keep same UI structure
- **New Props:** `{ currentPath?: string, initialUser?: User | null }`

**ManagementLayout.astro** (Modified)
- **Current:** Renders HeaderNavigation with no auth data
- **Changes:**
  - Pass `locals.user` to HeaderNavigation
  - Wrap in AuthProvider with initialUser
  - Ensure SSR data flows to client

**Layout.astro** (Modified)
- **Current:** Renders AuthButtons with no auth data
- **Changes:**
  - Pass `locals.user` to AuthButtons
  - Wrap in AuthProvider with initialUser
  - Ensure SSR data flows to client

**HeaderNavigation.tsx** (Modified)
- **Current:** Renders AuthButtons without props
- **Changes:**
  - Accept `initialUser` prop
  - Pass to AuthButtons
  - No other changes needed

### Implementation Details

#### useAuthQuery.ts Hook

```typescript
// src/hooks/useAuthQuery.ts
import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  username: string;
}

interface UseAuthQueryOptions {
  initialUser?: User | null;
}

const AUTH_STORAGE_KEY = 'auth_user';

export function useAuthQuery(options?: UseAuthQueryOptions) {
  const { initialUser } = options || {};

  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      const response = await fetch('/api/auth/session');
      if (!response.ok) {
        // Clear storage on auth failure
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }
      const data = await response.json();
      const user = data.user || null;

      // Sync to sessionStorage for instant display
      if (user) {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      }

      return user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: false, // Don't refetch if data is fresh
    retry: 1,
    initialData: () => {
      // Try sessionStorage first (instant!)
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          try {
            return JSON.parse(stored);
          } catch {
            sessionStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      }
      // Fallback to SSR data
      return initialUser;
    },
  });
}

// Export helper to clear auth cache (for logout)
export function clearAuthCache(queryClient: QueryClient) {
  queryClient.setQueryData(['auth', 'session'], null);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}
```

#### AuthProvider.tsx Component

```typescript
// src/components/providers/AuthProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

// Create a singleton QueryClient for auth
// NOTE: This could be merged with the dashboard QueryClient if you want
const authQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  // Pre-populate cache with SSR data if available
  if (initialUser !== undefined && !authQueryClient.getQueryData(['auth', 'session'])) {
    authQueryClient.setQueryData(['auth', 'session'], initialUser);
  }

  return (
    <QueryClientProvider client={authQueryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
```

#### Refactored AuthButtons.tsx

```typescript
// src/components/auth/AuthButtons.tsx (REFACTORED)
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useAuthQuery, clearAuthCache } from "../../hooks/useAuthQuery";
import { useQueryClient } from "@tanstack/react-query";

interface AuthButtonsProps {
  currentPath?: string;
  initialUser?: User | null; // SSR data
}

interface User {
  id: string;
  email: string;
  username: string;
}

export function AuthButtons({ currentPath, initialUser }: AuthButtonsProps) {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useAuthQuery({ initialUser });

  // Only show loading if we have NO data (sessionStorage empty AND no SSR data)
  if (isLoading && user === undefined) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  if (!user) {
    // Unauthenticated state - show Login/Register buttons
    const redirectParam = currentPath ? `?redirect=${encodeURIComponent(currentPath)}` : "";

    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
          <a href={`/auth/login${redirectParam}`}>Login</a>
        </Button>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <a href="/auth/register">Register</a>
        </Button>
      </div>
    );
  }

  // Authenticated state - show user menu
  const initials = user.username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-popover-foreground">{user.username}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/" className="cursor-pointer text-popover-foreground hover:bg-accent">
            My Quizzes
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/auth/change-password" className="cursor-pointer text-popover-foreground hover:bg-accent">
            Change Password
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <button
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
                clearAuthCache(queryClient); // Clear cache and storage
                window.location.href = "/";
              } catch (error) {
                console.error("Logout failed:", error);
              }
            }}
            className="w-full text-left cursor-pointer text-popover-foreground hover:bg-accent"
          >
            Logout
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## 5. Layout Changes

### ManagementLayout.astro Update

```astro
---
import "../styles/global.css";
import { HeaderNavigation } from "../components/management/HeaderNavigation";
import { AuthProvider } from "../components/providers/AuthProvider";

interface Props {
  title?: string;
  showSidebar?: boolean;
}

const { title = "10x Quiz Stack", showSidebar = false } = Astro.props;
const currentPath = Astro.url.pathname;

// Get user from middleware (already validated!)
const initialUser = Astro.locals.user || null;
---

<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="generator" content={Astro.generator} />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-background text-foreground">
    <AuthProvider client:load initialUser={initialUser}>
      <HeaderNavigation client:load currentPath={currentPath} initialUser={initialUser} />
    </AuthProvider>

    <div class="flex">
      {
        showSidebar && (
          <aside class="hidden lg:block w-64 bg-card border-border border-r min-h-[calc(100vh-4rem)]">
            <div class="p-4">
              <slot name="sidebar" />
            </div>
          </aside>
        )
      }

      <main class="flex-1">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <slot />
        </div>
      </main>
    </div>
  </body>
</html>
```

### Layout.astro Update

```astro
---
import "../styles/global.css";
import { AuthButtons } from "../components/auth/AuthButtons";
import { AuthProvider } from "../components/providers/AuthProvider";
import { Toaster } from "../components/ui/sonner";

interface Props {
  title?: string;
  showHeader?: boolean;
}

const { title = "10x Astro Starter", showHeader = true } = Astro.props;
const currentPath = Astro.url.pathname;

// Get user from middleware (already validated!)
const initialUser = Astro.locals.user || null;
---

<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="generator" content={Astro.generator} />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-background text-foreground">
    {
      showHeader && (
        <header class="border-b border-border bg-card shadow-sm">
          <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="flex h-16 items-center justify-between">
              {/* Logo */}
              <div class="flex items-center">
                <a href="/" class="flex items-center text-xl font-bold text-foreground">
                  <span class="text-primary">10x</span>
                  <span class="ml-1">Quiz</span>
                </a>
              </div>

              {/* Auth Buttons - Upper Right Corner */}
              <div class="flex items-center">
                <AuthProvider client:load initialUser={initialUser}>
                  <AuthButtons client:load currentPath={currentPath} initialUser={initialUser} />
                </AuthProvider>
              </div>
            </div>
          </div>
        </header>
      )
    }

    <slot />
    <Toaster client:load />
  </body>
</html>
```

### HeaderNavigation.tsx Update

```tsx
// src/components/management/HeaderNavigation.tsx (UPDATED)
import type { NavigationLink } from "../../types/management.types";
import { AuthButtons } from "../auth/AuthButtons";

interface User {
  id: string;
  email: string;
  username?: string;
}

interface HeaderNavigationProps {
  currentPath: string;
  initialUser?: User | null; // NEW: SSR data
}

export function HeaderNavigation({ currentPath, initialUser }: HeaderNavigationProps) {
  const navigationLinks: NavigationLink[] = [
    { title: "Dashboard", path: "/", isActive: currentPath === "/" },
    { title: "Create Quiz", path: "/quizzes/new", isActive: currentPath === "/quizzes/new" },
    { title: "Generate Quiz", path: "/quizzes/ai/generate", isActive: currentPath === "/quizzes/ai/generate" },
  ];

  return (
    <header className="border-b border-border bg-card shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center text-xl font-bold text-foreground">
              <span className="text-primary">10x</span>
              <span className="ml-1">Quiz Stack</span>
            </a>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex md:space-x-8" aria-label="Main navigation">
            {navigationLinks.map((link) => (
              <a
                key={link.path}
                href={link.path}
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
                  link.isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
                aria-current={link.isActive ? "page" : undefined}
              >
                {link.title}
              </a>
            ))}
          </nav>

          {/* Auth Buttons - Upper Right Corner */}
          <div className="flex items-center">
            <AuthButtons currentPath={currentPath} initialUser={initialUser} />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="border-t border-border md:hidden" aria-label="Mobile navigation">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {navigationLinks.map((link) => (
            <a
              key={link.path}
              href={link.path}
              className={`block rounded-md px-3 py-2 text-base font-medium ${
                link.isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              aria-current={link.isActive ? "page" : undefined}
            >
              {link.title}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
```

## 6. Implementation Steps

### Phase 1: Foundation Setup (Steps 1-3)

**Step 1: Install React Query Dependencies**
- Add `@tanstack/react-query` dependency (if not already installed)
- Add `@tanstack/react-query-devtools` for development
- Run `npm install @tanstack/react-query @tanstack/react-query-devtools`
- **Files Changed:** `package.json`, `package-lock.json`
- **Acceptance Criteria:**
  - Packages installed without errors
  - TypeScript types available
  - No version conflicts with existing dependencies

**Step 2: Create useAuthQuery Hook**
- Create new file `/src/hooks/useAuthQuery.ts`
- Implement hook using `useQuery` from React Query
- Define query key: `['auth', 'session']`
- Add sessionStorage sync logic
- Configure cache options (staleTime: 5min, gcTime: 10min)
- Support `initialUser` prop for SSR hydration
- Export `clearAuthCache` helper for logout
- **Files Created:** `/src/hooks/useAuthQuery.ts`
- **Acceptance Criteria:**
  - Hook compiles without TypeScript errors
  - sessionStorage sync works correctly
  - initialData from SSR or sessionStorage
  - Cache configuration correct

**Step 3: Create AuthProvider Component**
- Create new file `/src/components/providers/AuthProvider.tsx`
- Implement QueryClient with optimized configuration
- Add QueryClientProvider wrapper
- Pre-populate cache with SSR data if available
- Include React Query DevTools for development mode
- **Files Created:** `/src/components/providers/AuthProvider.tsx`
- **Acceptance Criteria:**
  - Component compiles without errors
  - DevTools only load in development
  - SSR data correctly pre-populates cache

### Phase 2: Component Refactoring (Steps 4-6)

**Step 4: Refactor AuthButtons Component**
- Modify `/src/components/auth/AuthButtons.tsx`
- Replace useState/useEffect with `useAuthQuery()` hook
- Add `initialUser` prop
- Remove manual loading state management
- Only show skeleton if no data available (not from cache or SSR)
- Update logout handler to use `clearAuthCache()`
- Keep same UI structure and styling
- **Files Modified:** `/src/components/auth/AuthButtons.tsx`
- **Acceptance Criteria:**
  - Uses React Query correctly
  - No loading skeleton when SSR or cached data available
  - Logout clears cache and sessionStorage
  - No breaking changes to UI

**Step 5: Update HeaderNavigation Component**
- Modify `/src/components/management/HeaderNavigation.tsx`
- Add `initialUser?: User | null` prop
- Pass `initialUser` to AuthButtons
- Update TypeScript interfaces
- **Files Modified:** `/src/components/management/HeaderNavigation.tsx`
- **Acceptance Criteria:**
  - Accepts and passes initialUser correctly
  - No TypeScript errors
  - No visual changes

**Step 6: Update Middleware Types**
- Modify `/src/env.d.ts`
- Ensure `locals.user` includes `username` field
- Add proper TypeScript types for User
- **Files Modified:** `/src/env.d.ts`
- **Acceptance Criteria:**
  - TypeScript types match actual data structure
  - No compilation errors

### Phase 3: Layout Integration (Steps 7-8)

**Step 7: Update ManagementLayout**
- Modify `/src/layouts/ManagementLayout.astro`
- Extract `initialUser` from `Astro.locals.user`
- Wrap HeaderNavigation in AuthProvider
- Pass `initialUser` to both AuthProvider and HeaderNavigation
- Ensure `client:load` directives correct
- **Files Modified:** `/src/layouts/ManagementLayout.astro`
- **Acceptance Criteria:**
  - SSR data passed correctly to client
  - No serialization errors
  - Auth UI renders instantly with data
  - No flash of loading state

**Step 8: Update Layout**
- Modify `/src/layouts/Layout.astro`
- Extract `initialUser` from `Astro.locals.user`
- Wrap AuthButtons in AuthProvider
- Pass `initialUser` to both AuthProvider and AuthButtons
- Ensure `client:load` directives correct
- **Files Modified:** `/src/layouts/Layout.astro`
- **Acceptance Criteria:**
  - SSR data passed correctly to client
  - No serialization errors
  - Auth UI renders instantly with data
  - No flash of loading state

### Phase 4: API and Middleware Updates (Step 9)

**Step 9: Update Session API to Include Username**
- Modify `/src/pages/api/auth/session.ts`
- Ensure response includes `username` field from profiles table
- Match expected User interface
- Add proper error handling
- **Files Modified:** `/src/pages/api/auth/session.ts`
- **Acceptance Criteria:**
  - API returns complete user object with username
  - TypeScript types match
  - Error handling works correctly

### Phase 5: Cache Invalidation (Step 10)

**Step 10: Update Login/Logout to Manage Cache**
- Modify login success handler to invalidate/refetch auth query
- Modify logout handler to clear cache (already in AuthButtons)
- Update password change flow to refresh auth state
- **Files Modified:**
  - `/src/pages/auth/login.astro` (if client-side login)
  - `/src/components/auth/LoginForm.tsx` (if exists)
  - `/src/components/auth/ChangePasswordForm.tsx` (if exists)
- **Acceptance Criteria:**
  - Login updates auth state immediately
  - Logout clears cache and storage
  - Password change refreshes user data

### Phase 6: Optimization and Polish (Steps 11-12)

**Step 11: Optimize sessionStorage Strategy**
- Review sessionStorage sync logic
- Add versioning to stored data (prevent stale schema)
- Add expiration timestamp (auto-clear old data)
- Handle edge cases (storage full, disabled, etc.)
- **Files Modified:** `/src/hooks/useAuthQuery.ts`
- **Acceptance Criteria:**
  - Storage versioning prevents stale data issues
  - Expired data automatically cleared
  - Graceful fallback if storage unavailable

**Step 12: Remove Redundant Client-Side Fetch**
- Verify middleware already validates session
- Confirm no need for redundant client-side validation
- Rely on React Query cache + SSR data
- Only fetch when cache stale (background refetch)
- **Files Modified:** None (verification phase)
- **Acceptance Criteria:**
  - Middleware session validation sufficient
  - No security gaps from reduced client checks
  - Cache invalidation strategy sound

## 7. Cache Strategy

### React Query Configuration

**Query Key:** `['auth', 'session']`

**Cache Options:**
- `staleTime: 5 * 60 * 1000` (5 minutes) - Auth state rarely changes
- `gcTime: 10 * 60 * 1000` (10 minutes) - Keep in memory longer
- `refetchOnWindowFocus: true` - Check for changes when user returns
- `refetchOnMount: false` - Don't refetch if data fresh
- `retry: 1` - Only retry once on failure

**Initial Data Priority:**
1. sessionStorage (instant display, no flicker)
2. SSR data from `initialUser` prop
3. Fetch from `/api/auth/session` (only if both empty)

### Session Storage Strategy

**Storage Key:** `auth_user`

**Stored Data:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "_version": 1,
  "_timestamp": 1234567890
}
```

**Storage Logic:**
- Write: After successful API fetch
- Read: On component mount (before API call)
- Clear: On logout, on 401 error, on version mismatch
- Expiration: Auto-clear if timestamp > 10 minutes old

### Cache Invalidation Triggers

**When to Invalidate:**
1. **User Logs In:** Set new data, don't invalidate (just update)
2. **User Logs Out:** Clear cache and storage completely
3. **Password Changed:** Invalidate and refetch
4. **Email Changed:** Invalidate and refetch (future feature)
5. **Profile Updated:** Invalidate and refetch
6. **401 Error:** Clear cache and storage, redirect to login

## 8. Migration Strategy

### Backward Compatibility

**No Breaking Changes:**
- AuthButtons still works without `initialUser` prop (graceful degradation)
- Layouts work without SSR data (falls back to client fetch)
- Old behavior preserved if React Query fails
- sessionStorage optional (works without it)

### Rollback Plan

If issues arise, can quickly rollback by:
1. Remove AuthProvider wrapper
2. Remove `initialUser` prop passing
3. Revert AuthButtons to use useState/useEffect
4. Remove useAuthQuery hook

**Rollback Files:**
- Keep backup of original AuthButtons.tsx
- Git tag before deployment: `git tag -a pre-auth-optimization -m "Before auth optimization"`

## 9. Performance Metrics

### Before Optimization (Baseline)

- **Time to Show Auth UI:** 100-500ms (always loading skeleton)
- **Navigation Auth Load:** 100-500ms (full refetch every time)
- **API Calls per Session:** 10-15 requests (every navigation)
- **Cache Hit Rate:** 0% (no cache)
- **Layout Shift (CLS):** High (avatar appears after delay)

### After Optimization (Target)

- **Time to Show Auth UI:** <50ms (instant from SSR/storage)
- **Navigation Auth Load:** <50ms (instant from cache)
- **API Calls per Session:** 2-3 requests (90% reduction)
- **Cache Hit Rate:** >95% (typical navigation patterns)
- **Layout Shift (CLS):** Zero (no loading state)

### Measurement Approach

- **Chrome DevTools Network Tab:** Count auth session requests
- **React Query DevTools:** Monitor cache hits vs fetches
- **Performance Observer:** Measure CLS for header region
- **Manual Testing:** Observe loading skeleton appearance

## 10. Key Differences from Current Implementation

| Aspect | Current (Before) | Optimized (After) |
|--------|-----------------|-------------------|
| **Auth State Fetching** | Manual fetch with useState/useEffect | React Query (automatic) |
| **Caching** | None (always fetch) | 5-10 min intelligent cache |
| **Initial Display** | Client-side fetch, loading skeleton | SSR + sessionStorage, instant |
| **Navigation** | Full refetch every time | Instant from cache if fresh |
| **Session Validation** | Middleware + Client (2x) | Middleware + cached client |
| **Loading Skeleton** | Always shows (100-500ms) | Never shows (instant data) |
| **sessionStorage** | Not used | Synced for instant display |
| **Layout Shift** | High (avatar loads late) | Zero (instant render) |
| **API Calls** | 10-15 per session | 2-3 per session (90% reduction) |
| **Data Flow** | Client-only | SSR → Client → Cache |

## 11. Success Criteria

### Functional Requirements

✅ Auth UI displays instantly on page load (no skeleton)
✅ Navigation between pages shows auth UI immediately (no flicker)
✅ Session state cached and reused across navigations
✅ Logout properly clears cache and storage
✅ Login/password change updates auth state immediately
✅ All existing functionality preserved (no regressions)

### Performance Requirements

✅ Initial load <50ms to display auth UI
✅ Navigation <50ms to display auth UI
✅ Cache hit rate >95% for typical usage
✅ Zero layout shift (CLS) from auth UI loading
✅ API calls reduced by 90%
✅ No memory leaks (verified in DevTools)

### User Experience Requirements

✅ No loading skeleton/flicker during navigation
✅ Instant auth state display on all pages
✅ Smooth transitions between pages
✅ Works offline with cached data (sessionStorage)
✅ No visual changes (backward compatible UI)

## 12. Technical Considerations

### SSR and Hydration

**Hydration Process:**
1. Middleware validates session server-side
2. SSR passes `locals.user` to layout
3. Layout serializes user to HTML and passes as prop
4. React hydrates with initialUser, no fetch needed
5. sessionStorage populated for next navigation
6. React Query manages background revalidation

**Serialization Concerns:**
- User object is simple (id, email, username) - JSON-serializable
- No functions, circular refs, or complex objects
- Dates avoided (use ISO strings if needed)

### Security Considerations

**Session Validation:**
- Middleware ALWAYS validates session server-side
- Client-side auth state is for UI only (not security)
- Protected routes still enforced by middleware
- Cache cleared on 401 errors

**sessionStorage Security:**
- Safe: sessionStorage is origin-scoped
- Safe: Cleared on tab/browser close
- Safe: Not accessible cross-origin
- Risk mitigation: Store minimal data (id, email, username)
- Risk mitigation: Auto-expire after 10 minutes

### Browser Compatibility

**React Query Support:**
- Modern browsers (Chrome, Firefox, Safari, Edge)
- React 18+ required (already used)
- sessionStorage widely supported (IE8+)

**Graceful Degradation:**
- Works without sessionStorage (falls back to SSR + fetch)
- Works without SSR data (falls back to client fetch)
- Loading skeleton shown if all data sources fail

## 13. Future Enhancements (Post-MVP)

### Advanced Optimizations

**Persistent State Across Full Page Reloads:**
- Use Astro View Transitions for SPA-like navigation
- Explore `client:only` or `client:idle` directives
- Investigate Astro islands persistence

**Profile Picture Caching:**
- Add avatar URL to user object
- Cache images in browser (Cache-Control headers)
- Lazy load avatar images

**Real-Time Auth Updates:**
- WebSocket connection for logout events
- Invalidate cache if user logged out elsewhere
- Show notification: "You've been logged out"

**Optimistic UI Updates:**
- Update profile optimistically before API response
- Roll back if update fails

### Monitoring and Analytics

**Performance Tracking:**
- Track auth API call frequency
- Monitor cache hit rate over time
- Alert on degraded cache performance
- Dashboard for auth state health

## 14. Implementation Timeline

**Total Estimated Time: 4-6 hours**

### Phase 1: Foundation (1-2 hours)
- Step 1: Install React Query (0.5 hours)
- Step 2: Create useAuthQuery hook (1 hour)
- Step 3: Create AuthProvider (0.5 hours)

### Phase 2: Component Refactoring (1-2 hours)
- Step 4: Refactor AuthButtons (1 hour)
- Step 5: Update HeaderNavigation (0.5 hours)
- Step 6: Update middleware types (0.5 hours)

### Phase 3: Layout Integration (1 hour)
- Step 7: Update ManagementLayout (0.5 hours)
- Step 8: Update Layout (0.5 hours)

### Phase 4: API and Cache (1 hour)
- Step 9: Update session API (0.5 hours)
- Step 10: Update login/logout cache handling (0.5 hours)

### Phase 5: Polish (0.5-1 hour)
- Step 11: Optimize sessionStorage (0.5 hours)
- Step 12: Verification and testing (0.5 hours)

## 15. Risk Assessment

### Low Risk

**React Query is mature:**
- Stable library, widely used
- Excellent TypeScript support
- Well-documented
- Already being used for dashboard optimization

**Small scope:**
- Only auth state affected
- No changes to auth logic itself
- UI unchanged

### Medium Risk

**sessionStorage edge cases:**
- Storage disabled in private browsing
- Storage quota exceeded
- Mitigation: Graceful fallback to fetch

**SSR serialization:**
- Props must be JSON-serializable
- Mitigation: User object is simple

### High Risk (Mitigated)

**Breaking auth flow:**
- Risk: Could break login/logout
- Mitigation: Thorough manual testing
- Rollback: Easy revert to original code

**Cache staleness:**
- Risk: Showing stale user data
- Mitigation: Short stale time (5 min), refetch on focus
- Monitoring: Watch for user reports

## 16. Summary

This authentication navigation optimization plan provides:

✅ **Instant auth UI display:** No loading skeleton, zero layout shift
✅ **Efficient caching:** React Query with 5-10 minute stale time
✅ **SSR data passing:** Middleware session used for instant hydration
✅ **sessionStorage sync:** Instant display on navigation, survives component remount
✅ **Reduced API calls:** 90% reduction (10-15 → 2-3 per session)
✅ **Better UX:** No flicker, smooth navigation, instant feedback
✅ **Backward compatible:** Works without SSR/cache, graceful degradation
✅ **Secure:** Middleware still validates, client cache is UI-only
✅ **Maintainable:** Standard React Query patterns, well-documented

The implementation eliminates the current navigation jumping issue by ensuring auth state is always immediately available from either SSR data, sessionStorage, or React Query cache, with background revalidation to keep data fresh.
