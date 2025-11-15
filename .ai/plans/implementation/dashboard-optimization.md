# Dashboard Performance Optimization Plan

## 1. Overview

The Dashboard currently suffers from performance issues including redundant data fetching, lack of caching, and loading spinners on every page visit. This plan implements a hybrid optimization strategy combining React Query for intelligent caching with Astro SSR for instant initial page loads. The optimization will eliminate unnecessary API calls, provide instant navigation between tabs, and improve overall user experience without changing the visual interface.

## 2. Current Problems Analysis

### Performance Issues Identified

**Problem 1: No Caching Strategy**
- Location: `src/hooks/useQuizList.ts:55`
- Issue: Uses `cache: "no-store"` on all fetch requests
- Impact: Every dashboard visit fetches data from scratch, even if visited seconds ago
- User Experience: Always shows loading spinner, feels slow

**Problem 2: Redundant Fetches on Navigation**
- Location: `src/hooks/useQuizList.ts:95-108`
- Issue: Listens to `astro:page-load` events and refetches every time
- Impact: Navigating away and back triggers full refetch even with fresh data
- User Experience: Unnecessary loading states, wasted bandwidth

**Problem 3: Both Tabs Load Simultaneously**
- Location: `src/hooks/useDashboard.ts:65-77`
- Issue: Despite `enabled` flag, both queries run when component mounts
- Impact: Fetches public quizzes even when user is viewing "My Quizzes" tab
- User Experience: Slower initial load, unnecessary API calls

**Problem 4: Client-Side Only Rendering**
- Location: `src/pages/index.astro:13`
- Issue: Uses `client:load` directive with no SSR data
- Impact: No initial data on page load, always shows loading spinner first
- User Experience: Feels sluggish, poor perceived performance

**Problem 5: Inefficient Client-Side Filtering**
- Location: `src/hooks/useDashboard.ts:79-109`
- Issue: Fetches ALL quizzes, then filters by user_id on client
- Impact: Fetches unnecessary data, wastes bandwidth and processing
- User Experience: Slower load times for users with many quizzes

### Measured Impact

- **Initial Load Time:** ~1.5-2s to see content (loading spinner always shows)
- **Tab Switch Time:** ~500ms-1s (refetch even with fresh data)
- **Redundant Requests:** 2-3x more API calls than necessary
- **Cache Hit Rate:** 0% (no caching implemented)

## 3. Proposed Solution Architecture

### Three-Pillar Optimization Strategy

**Pillar 1: React Query Integration**
- Replace manual useState/useEffect with `@tanstack/react-query`
- Automatic caching, deduplication, background refetching
- Configurable stale times and cache invalidation
- Built-in loading and error states

**Pillar 2: Astro SSR with Hydration**
- Fetch initial "My Quizzes" data server-side in Astro page
- Pass as props to React component for instant display
- Use `client:load` with initial data (no loading spinner)
- React Query hydrates and takes over for subsequent updates

**Pillar 3: Backend API Optimization**
- Add `owned=true` query parameter to filter user's quizzes server-side
- Eliminate client-side filtering logic
- Reduce payload size and processing time

### Performance Targets

- **Initial Load:** <500ms to see content (no loading spinner)
- **Tab Switch (cached):** <50ms instant display
- **Tab Switch (stale):** <300ms with background refetch
- **Cache Hit Rate:** >80% for typical navigation patterns
- **API Calls Reduction:** 60-70% fewer requests

### Architecture Diagram

```
Before:
┌─────────────────┐
│  index.astro    │
│  (no SSR data)  │
└────────┬────────┘
         │ client:load
         ▼
┌─────────────────────────────┐
│  DashboardContainer         │
│  ├─ useDashboard            │
│  │  ├─ useQuizList (my)     │ ───► Fetch (cache: no-store)
│  │  └─ useQuizList (public) │ ───► Fetch (cache: no-store)
│  └─ Always shows spinner    │
└─────────────────────────────┘

After:
┌──────────────────────────────┐
│  index.astro                 │
│  ├─ SSR: Fetch my quizzes    │ ───► 1x Server fetch (fast)
│  └─ Pass initialData prop    │
└────────┬─────────────────────┘
         │ client:load (with data)
         ▼
┌──────────────────────────────────┐
│  QueryClientProvider             │
│  └─ DashboardContainer           │
│     ├─ useQuizListQuery (my)     │ ◄─── Uses initialData (instant!)
│     │  └─ React Query cache      │
│     └─ useQuizListQuery (public) │ ◄─── Lazy fetch on tab click
│        └─ React Query cache      │      Cached for 5min
└──────────────────────────────────┘
```

## 4. Component Changes

### New Components

**QueryProvider.tsx** (New)
- **Purpose:** Global React Query provider wrapper
- **Location:** `/src/components/providers/QueryProvider.tsx`
- **Responsibilities:**
  - Initialize QueryClient with optimized config
  - Provide QueryClientProvider context
  - Configure default query options (stale time, retry, etc.)
  - Support SSR hydration
- **Props:** `{ children: ReactNode, dehydratedState?: DehydratedState }`

### Modified Components

**index.astro** (Modified)
- **Current:** No SSR, just renders DashboardContainer with client:load
- **Changes:**
  - Add server-side data fetching for "My Quizzes"
  - Create Supabase server client
  - Fetch initial quiz list with proper error handling
  - Pass initialData to DashboardContainer
  - Wrap DashboardContainer in QueryProvider
- **New Imports:** `createSupabaseServerInstance`, `dehydrate`, `QueryClient`

**DashboardContainer.tsx** (Modified)
- **Current:** Uses useDashboard hook, manages loading states
- **Changes:**
  - Accept `initialMyQuizzes` prop for SSR data
  - Replace useDashboard with optimized version using React Query
  - Remove manual loading state management (React Query handles it)
  - Keep same UI structure and render logic
- **New Props:** `{ initialMyQuizzes?: QuizListResponse }`

**useDashboard.ts** (Refactored)
- **Current:** Manual useState/useEffect with fetch calls
- **Changes:**
  - Replace with `useQuery` from React Query
  - Remove manual loading/error states
  - Simplify tab switching (no manual refetch)
  - Remove astro:page-load listener (React Query handles it)
  - Keep same return interface for backward compatibility

**useQuizList.ts** (Deprecated/Replaced)
- **Current:** Custom hook with manual fetch and state management
- **Changes:**
  - Create new `useQuizListQuery.ts` hook using React Query
  - Keep old file for reference during migration
  - Delete after migration complete and tested

### New Hook: useQuizListQuery.ts

```typescript
// src/hooks/useQuizListQuery.ts
import { useQuery } from '@tanstack/react-query';
import type { QuizListResponse } from '../types';

interface UseQuizListQueryParams {
  status?: 'public' | 'private' | 'draft';
  owned?: boolean;
  page: number;
  limit?: number;
  enabled?: boolean;
  initialData?: QuizListResponse;
}

export function useQuizListQuery(params: UseQuizListQueryParams) {
  const { status, owned, page, limit = 10, enabled = true, initialData } = params;

  return useQuery({
    queryKey: ['quizzes', { status, owned, page, limit }],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort: 'created_at',
        order: 'desc',
      });

      if (status) queryParams.set('status', status);
      if (owned !== undefined) queryParams.set('owned', String(owned));

      const response = await fetch(`/api/quizzes?${queryParams}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }

      return response.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: false, // Don't refetch if data is fresh
    retry: 2,
    initialData,
  });
}
```

## 5. API Changes

### Backend Endpoint Modification

**Endpoint:** `GET /api/quizzes`
**File:** `src/pages/api/quizzes/index.ts`

**New Query Parameter:**

```typescript
interface QuizListQueryParams {
  page?: string;
  limit?: string;
  sort?: string;
  order?: string;
  status?: 'public' | 'private' | 'draft';
  owned?: string; // NEW: 'true' | 'false'
}
```

**Implementation:**

```typescript
// In GET handler, after authentication
const queryParams = {
  page: url.searchParams.get('page'),
  limit: url.searchParams.get('limit'),
  sort: url.searchParams.get('sort'),
  order: url.searchParams.get('order'),
  status: url.searchParams.get('status') || undefined,
  owned: url.searchParams.get('owned') || undefined, // NEW
};

// Update validation schema
const quizListQuerySchema = z.object({
  // ... existing fields
  owned: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
});

// In service layer (quiz.service.ts)
if (validatedParams.owned === true) {
  query = query.eq('user_id', userId);
} else if (validatedParams.owned === false) {
  query = query.neq('user_id', userId);
}
// If owned is undefined, return all accessible quizzes (current behavior)
```

**Benefits:**
- Eliminates client-side filtering (remove 50+ lines of code)
- Reduces payload size (only user's quizzes returned)
- Better pagination (correct total counts)
- Leverages database indexes (faster queries)

### Validation Schema Update

**File:** `src/lib/validation/quiz-list-query.schema.ts`

```typescript
import { z } from 'zod';

export const quizListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  sort: z.enum(['created_at', 'updated_at', 'title']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['public', 'private', 'draft']).optional(),
  owned: z.enum(['true', 'false']).optional().transform(val => val === 'true'), // NEW
});

export type QuizListQuery = z.infer<typeof quizListQuerySchema>;
```

## 6. React Query Configuration

### QueryClient Setup

**File:** `src/components/providers/QueryProvider.tsx`

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
      refetchOnMount: false,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
```

### Cache Key Strategy

**Pattern:** `['quizzes', { status, owned, page, limit }]`

**Examples:**
- My Quizzes page 1: `['quizzes', { owned: true, page: 1, limit: 10 }]`
- Public Quizzes page 1: `['quizzes', { status: 'public', page: 1, limit: 10 }]`
- Public Quizzes page 2: `['quizzes', { status: 'public', page: 2, limit: 10 }]`

**Cache Invalidation Triggers:**
- Quiz created: Invalidate all `['quizzes']` queries
- Quiz updated: Invalidate specific query and all lists
- Quiz deleted: Invalidate all `['quizzes']` queries
- User logs out: Clear all queries

## 7. SSR Data Fetching

### Astro Page Server-Side Logic

**File:** `src/pages/index.astro`

```astro
---
import ManagementLayout from "../layouts/ManagementLayout.astro";
import { DashboardContainer } from "../components/Dashboard/DashboardContainer.tsx";
import { QueryProvider } from "../components/providers/QueryProvider.tsx";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";
import type { QuizListResponse } from "../types.ts";

export const prerender = false;

// Server-side data fetching for initial load optimization
let initialMyQuizzes: QuizListResponse | null = null;
let ssrError: string | null = null;

try {
  const supabaseClient = createSupabaseServerInstance({
    cookies: Astro.cookies,
    headers: Astro.request.headers,
  });

  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session) {
    // Fetch user's quizzes server-side
    const queryParams = new URLSearchParams({
      page: '1',
      limit: '10',
      sort: 'created_at',
      order: 'desc',
      owned: 'true', // NEW: Use server-side filtering
    });

    const response = await fetch(
      `${Astro.url.origin}/api/quizzes?${queryParams}`,
      {
        headers: {
          Cookie: Astro.request.headers.get('Cookie') || '',
        },
      }
    );

    if (response.ok) {
      initialMyQuizzes = await response.json();
    } else {
      console.error('SSR: Failed to fetch my quizzes:', response.status);
    }
  }
} catch (error) {
  console.error('SSR: Error fetching initial data:', error);
  ssrError = 'Failed to load initial data';
}
---

<ManagementLayout title="Dashboard | QuizStack">
  <QueryProvider client:load>
    <DashboardContainer
      client:load
      initialMyQuizzes={initialMyQuizzes}
      ssrError={ssrError}
    />
  </QueryProvider>
</ManagementLayout>
```

**Benefits:**
- Instant content display (no loading spinner)
- Better SEO (content in HTML)
- Faster perceived performance
- Graceful degradation (falls back to client fetch if SSR fails)

## 8. Implementation Steps

### Phase 1: Foundation Setup (Steps 1-3)

**Step 1: Install React Query**
- Add `@tanstack/react-query` dependency
- Add `@tanstack/react-query-devtools` for development
- Run `npm install @tanstack/react-query @tanstack/react-query-devtools`
- Verify package.json updated correctly
- **Files Changed:** `package.json`, `package-lock.json`
- **Acceptance Criteria:**
  - Packages installed without errors
  - TypeScript types available
  - No version conflicts

**Step 2: Create QueryProvider Component**
- Create new file `/src/components/providers/QueryProvider.tsx`
- Implement QueryClient with optimized configuration
- Add QueryClientProvider wrapper
- Include React Query DevTools for development mode
- Configure default query options (stale time, cache time, retry)
- Add TypeScript interfaces for props
- **Files Created:** `/src/components/providers/QueryProvider.tsx`
- **Acceptance Criteria:**
  - Component compiles without errors
  - DevTools only load in development
  - Default options applied correctly

**Step 3: Create useQuizListQuery Hook**
- Create new file `/src/hooks/useQuizListQuery.ts`
- Implement hook using `useQuery` from React Query
- Define query key structure: `['quizzes', { status, owned, page, limit }]`
- Add fetch function with proper error handling
- Configure cache options (staleTime: 5min, gcTime: 10min)
- Support `initialData` prop for SSR hydration
- Add TypeScript interfaces for parameters and return type
- **Files Created:** `/src/hooks/useQuizListQuery.ts`
- **Acceptance Criteria:**
  - Hook compiles without TypeScript errors
  - Query keys unique and consistent
  - Cache configuration correct
  - Fetch function handles errors properly

### Phase 2: Backend API Enhancement (Steps 4-5)

**Step 4: Update API Endpoint**
- Modify `/src/pages/api/quizzes/index.ts`
- Add `owned` query parameter support
- Update request parsing to extract `owned` parameter
- Pass `owned` to service layer
- Maintain backward compatibility (owned is optional)
- Add error handling for invalid `owned` values
- **Files Modified:** `/src/pages/api/quizzes/index.ts`
- **Acceptance Criteria:**
  - `owned=true` returns only user's quizzes
  - `owned=false` returns only others' quizzes
  - `owned` omitted returns all accessible quizzes
  - No breaking changes to existing calls

**Step 5: Update Validation Schema**
- Modify `/src/lib/validation/quiz-list-query.schema.ts`
- Add `owned` field to schema: `z.enum(['true', 'false']).optional()`
- Add transformation to convert string to boolean
- Update TypeScript types to include `owned`
- **Files Modified:** `/src/lib/validation/quiz-list-query.schema.ts`
- **Acceptance Criteria:**
  - Schema validates `owned` parameter correctly
  - Invalid values rejected with clear error
  - TypeScript types updated
  - Transformation works correctly

**Step 6: Update Quiz Service**
- Modify `/src/lib/services/quiz.service.ts`
- Update `getQuizzes` method to handle `owned` parameter
- Add database query filter: `query.eq('user_id', userId)` when owned=true
- Add filter: `query.neq('user_id', userId)` when owned=false
- Ensure no filter applied when owned=undefined
- Test query performance with indexes
- **Files Modified:** `/src/lib/services/quiz.service.ts`
- **Acceptance Criteria:**
  - Server-side filtering works correctly
  - Query performance acceptable (<200ms)
  - Pagination totals correct
  - No security issues (RLS still enforced)

### Phase 3: Dashboard Refactoring (Steps 7-9)

**Step 7: Refactor useDashboard Hook**
- Modify `/src/hooks/useDashboard.ts`
- Replace `useQuizList` calls with `useQuizListQuery`
- Remove manual loading/error state management
- Update My Quizzes query to use `owned: true` parameter
- Remove client-side filtering logic (79-109 lines deleted)
- Keep same return interface for backward compatibility
- Simplify tab change handler (no manual refetch)
- **Files Modified:** `/src/hooks/useDashboard.ts`
- **Acceptance Criteria:**
  - Hook uses React Query correctly
  - No breaking changes to return interface
  - Client-side filtering removed
  - Tab switching works smoothly
  - Code reduced by ~50 lines

**Step 8: Update DashboardContainer Component**
- Modify `/src/components/Dashboard/DashboardContainer.tsx`
- Add `initialMyQuizzes` prop for SSR data
- Update useDashboard call to pass initial data
- Remove loading spinner logic for initial load (if SSR data present)
- Keep error handling unchanged
- Ensure backward compatibility (works without SSR data)
- **Files Modified:** `/src/components/Dashboard/DashboardContainer.tsx`
- **Acceptance Criteria:**
  - Component accepts SSR data prop
  - Displays content instantly when SSR data provided
  - Falls back to loading state if no SSR data
  - No visual changes to UI

**Step 9: Implement Lazy Tab Loading**
- Modify query `enabled` logic in useDashboard
- My Quizzes: Always enabled (or use SSR data)
- Public Quizzes: Only enable when `activeTab === 'public-quizzes'`
- Ensure first tab switch triggers fetch
- Subsequent switches use cached data
- **Files Modified:** `/src/hooks/useDashboard.ts`
- **Acceptance Criteria:**
  - Public quizzes only fetch when tab clicked
  - Switching back to tab uses cache (no refetch if fresh)
  - Loading indicator shows on first fetch
  - Smooth transition between tabs

### Phase 4: SSR Integration (Steps 10-11)

**Step 10: Implement Server-Side Data Fetching**
- Modify `/src/pages/index.astro`
- Add server-side data fetching in frontmatter
- Create Supabase server client
- Fetch "My Quizzes" data (page 1, limit 10, owned=true)
- Add try-catch error handling (graceful degradation)
- Store result in `initialMyQuizzes` variable
- Log errors without breaking page render
- **Files Modified:** `/src/pages/index.astro`
- **Acceptance Criteria:**
  - Server fetches data successfully
  - Errors handled gracefully (page still loads)
  - Data available in Astro template
  - No increase in page load time

**Step 11: Wire SSR Data to React Component**
- Modify `/src/pages/index.astro` template
- Wrap DashboardContainer in QueryProvider
- Pass `initialMyQuizzes` prop to DashboardContainer
- Ensure both components use `client:load` directive
- Verify data serialization (no circular references)
- **Files Modified:** `/src/pages/index.astro`
- **Acceptance Criteria:**
  - SSR data passed correctly to React
  - No serialization errors
  - Component renders instantly with data
  - No flash of loading state

### Phase 5: Cleanup and Optimization (Steps 12-14)

**Step 12: Remove Astro Page Load Listener**
- Modify `/src/hooks/useQuizList.ts` (if still used elsewhere)
- Remove `astro:page-load` event listener (lines 95-108)
- React Query handles refetching automatically
- Remove associated useEffect
- **Files Modified:** `/src/hooks/useQuizList.ts` or delete if unused
- **Acceptance Criteria:**
  - No more redundant refetches on navigation
  - Page transitions still work correctly
  - No memory leaks from event listeners

**Step 13: Update Cache Configuration**
- Review and tune React Query cache settings
- Adjust staleTime based on data update frequency (5 min default)
- Configure background refetch behavior
- Set up cache invalidation on mutations (quiz create/update/delete)
- Add cache persistence if needed (localStorage)
- **Files Modified:** `/src/components/providers/QueryProvider.tsx`
- **Acceptance Criteria:**
  - Cache times appropriate for use case
  - Background refetch improves UX
  - Mutations invalidate cache correctly
  - No stale data shown to users

**Step 14: Remove Deprecated Code**
- Delete or deprecate old `useQuizList.ts` hook if no longer used
- Remove unused imports across components
- Clean up commented-out code
- Update related documentation
- **Files Modified/Deleted:** Multiple files
- **Acceptance Criteria:**
  - No unused code remains
  - No broken imports
  - Application still works correctly
  - Build size reduced

### Phase 6: Polish and Verification (Steps 15-16)

**Step 15: Add Loading States Polish**
- Ensure smooth transitions between loading/loaded states
- Add skeleton loaders if needed (optional)
- Verify error states still display correctly
- Test empty states (no quizzes)
- Ensure tab switching feels instant with cache
- **Files Modified:** `/src/components/Dashboard/*`
- **Acceptance Criteria:**
  - No jarring transitions
  - Loading states appropriate
  - Errors displayed clearly
  - Empty states work

**Step 16: Cross-Browser and Device Testing**
- Test on Chrome, Firefox, Safari, Edge
- Test on mobile devices (iOS/Android)
- Verify cache behavior consistent
- Test network offline/online transitions
- Verify no memory leaks (DevTools memory profiler)
- **Files Modified:** None (testing phase)
- **Acceptance Criteria:**
  - Works on all major browsers
  - Mobile performance good
  - Cache works consistently
  - No memory leaks detected

## 9. Cache Invalidation Strategy

### When to Invalidate Cache

**Quiz Created:**
```typescript
// After successful quiz creation
queryClient.invalidateQueries({ queryKey: ['quizzes'] });
// Invalidates all quiz lists, forcing refetch
```

**Quiz Updated:**
```typescript
// After successful quiz update
queryClient.invalidateQueries({ queryKey: ['quizzes'] });
queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
// Invalidates lists and specific quiz
```

**Quiz Deleted:**
```typescript
// After successful deletion
queryClient.invalidateQueries({ queryKey: ['quizzes'] });
// Invalidates all lists
```

**User Logs Out:**
```typescript
// On logout
queryClient.clear();
// Clears entire cache
```

**Manual Refresh:**
```typescript
// User clicks refresh button
queryClient.invalidateQueries({
  queryKey: ['quizzes', { owned: true, page: 1 }]
});
// Invalidates specific query
```

### Optimistic Updates (Future Enhancement)

For quiz creation/deletion, can implement optimistic updates:
```typescript
// Optimistically update cache before API response
queryClient.setQueryData(['quizzes', params], (old) => {
  // Add new quiz to list immediately
  return { ...old, quizzes: [newQuiz, ...old.quizzes] };
});
```

## 10. Migration Strategy

### Backward Compatibility

**Ensure No Breaking Changes:**
- Old API calls without `owned` parameter still work
- useDashboard hook maintains same return interface
- DashboardContainer works without SSR data (graceful degradation)
- Error handling unchanged
- UI/UX identical (no visual changes)

### Rollback Plan

If issues arise, can quickly rollback by:
1. Remove QueryProvider wrapper (use old hooks)
2. Revert useDashboard to use useQuizList
3. Remove `owned` parameter from API calls
4. Restore client-side filtering

**Rollback Files:**
- Keep backup of original hooks in `/src/hooks/backup/`
- Git tag before deployment: `git tag -a pre-react-query -m "Before React Query migration"`
- Document rollback steps in deployment notes

## 11. Performance Metrics

### Before Optimization (Baseline)

- **Time to First Content:** 1.5-2s (always loading spinner)
- **Tab Switch (same data):** 500ms-1s (full refetch)
- **API Calls per Session:** 6-8 requests (many redundant)
- **Cache Hit Rate:** 0% (no cache)
- **Bandwidth per Session:** ~200KB (assuming 10 quizzes per list)

### After Optimization (Target)

- **Time to First Content:** <500ms (SSR, no spinner)
- **Tab Switch (cached):** <50ms (instant from cache)
- **Tab Switch (stale):** <300ms (background refetch)
- **API Calls per Session:** 2-3 requests (60-70% reduction)
- **Cache Hit Rate:** >80% (typical navigation patterns)
- **Bandwidth per Session:** ~80KB (40% reduction)

### Measurement Tools

- **Chrome DevTools Network Tab:** Measure request counts and timing
- **React Query DevTools:** Monitor cache hits, stale queries
- **Lighthouse:** Overall performance score (target >90)
- **Web Vitals:** LCP, FID, CLS metrics
- **Custom Analytics:** Track time-to-interactive, tab switch latency

## 12. Success Criteria

### Functional Requirements

✅ Dashboard loads instantly with SSR data (no loading spinner)
✅ Tab switching feels instant with cached data
✅ Public quizzes only load when tab clicked (lazy loading)
✅ API calls reduced by 60-70%
✅ "My Quizzes" filtered server-side (no client filtering)
✅ Cache automatically refetches stale data in background
✅ All existing functionality preserved (no regressions)

### Performance Requirements

✅ Initial load <500ms to display content
✅ Cached tab switch <50ms
✅ Lighthouse performance score >90
✅ Cache hit rate >80% for typical usage
✅ No memory leaks (verified in DevTools)
✅ Works offline with cached data

### User Experience Requirements

✅ No perceived delay when switching tabs
✅ No unnecessary loading spinners
✅ Smooth transitions between states
✅ Clear error messages if fetch fails
✅ Works on mobile devices smoothly
✅ No visual changes (backward compatible UI)

## 13. Technical Considerations

### React Query Best Practices

**Query Keys:**
- Use structured keys: `['quizzes', { status, owned, page }]`
- Consistent ordering of parameters
- Include all variables that affect data
- Easy to invalidate specific or broad queries

**Stale Time vs Cache Time:**
- `staleTime`: How long data is considered fresh (5 min)
- `gcTime`: How long unused data stays in cache (10 min)
- Stale data refetches in background (user sees old data immediately)
- Expired cache triggers loading state (data completely gone)

**Refetch Behavior:**
- `refetchOnWindowFocus: true` - Refetch when user returns to tab
- `refetchOnMount: false` - Don't refetch if data fresh
- `refetchOnReconnect: true` - Refetch when network reconnects

### SSR and Hydration

**Hydration Process:**
1. Server fetches data and serializes to HTML
2. React Query initializes on client with `initialData`
3. Client takes over, uses cached data
4. Background refetch if stale

**Serialization Concerns:**
- Ensure data is JSON-serializable (no functions, circular refs)
- Dates converted to ISO strings automatically
- Large datasets might increase HTML size (monitor)

### Security Considerations

**Server-Side Filtering:**
- Always enforce RLS (Row Level Security) in database
- `owned` parameter is convenience, not security
- Backend always validates user has access
- Don't trust client cache for authorization

**Cache Poisoning:**
- React Query cache is client-side only (safe)
- Each user has their own cache
- No shared cache between users
- Logout clears all cached data

### Browser Compatibility

**React Query Support:**
- Modern browsers (Chrome, Firefox, Safari, Edge)
- No IE11 support (not needed per project)
- Uses native fetch API (polyfill not needed)
- React 18+ required (already used in project)

### Bundle Size Impact

**Added Dependencies:**
- `@tanstack/react-query`: ~40KB gzipped
- `@tanstack/react-query-devtools`: ~20KB (dev only)
- Total production impact: ~40KB

**Code Reduction:**
- Remove custom caching logic: -100 lines
- Remove client-side filtering: -50 lines
- Net code reduction despite new dependency

## 14. Future Enhancements (Post-MVP)

### Advanced Caching Strategies

**Prefetching:**
```typescript
// Prefetch next page when user hovers pagination
const prefetchNextPage = () => {
  queryClient.prefetchQuery({
    queryKey: ['quizzes', { owned: true, page: page + 1 }],
    queryFn: () => fetchQuizzes({ page: page + 1 }),
  });
};
```

**Infinite Scroll:**
```typescript
// Replace pagination with infinite scroll
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['quizzes', { owned: true }],
  queryFn: ({ pageParam = 1 }) => fetchQuizzes({ page: pageParam }),
  getNextPageParam: (lastPage) => lastPage.nextPage,
});
```

### Real-Time Updates

**WebSocket Integration:**
- Connect to real-time quiz updates
- Invalidate cache when quiz created/updated/deleted by user elsewhere
- Show toast notification: "New quiz available, refresh to see"

**Polling for Updates:**
```typescript
// Poll for new quizzes every 30 seconds
useQuery({
  queryKey: ['quizzes', { owned: true, page: 1 }],
  refetchInterval: 30000, // 30 seconds
});
```

### Offline Support

**Persist Cache to IndexedDB:**
```typescript
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
});
```

**Service Worker:**
- Cache API responses in service worker
- Serve from cache when offline
- Sync mutations when back online

### Analytics and Monitoring

**Cache Analytics:**
- Track cache hit rate
- Monitor stale query frequency
- Identify most/least accessed queries
- Optimize cache settings based on data

**Performance Monitoring:**
- Track query execution times
- Monitor background refetch frequency
- Alert on slow queries (>2s)
- Dashboard for query health

## 15. Deployment Checklist

### Pre-Deployment

- [ ] All implementation steps completed
- [ ] Code reviewed by team
- [ ] TypeScript compilation successful (no errors)
- [ ] Linting passes (`npm run lint`)
- [ ] Manual testing on dev environment
- [ ] Cross-browser testing completed
- [ ] Mobile testing completed
- [ ] Performance metrics measured (before/after)

### Deployment

- [ ] Create git branch: `feature/dashboard-optimization`
- [ ] Commit changes with clear messages
- [ ] Push to remote repository
- [ ] Create pull request with description
- [ ] Deploy to staging environment
- [ ] Smoke test on staging
- [ ] Monitor error logs (check for React Query errors)
- [ ] Verify cache behavior on staging
- [ ] Merge to main branch
- [ ] Deploy to production
- [ ] Monitor production metrics for 24 hours

### Post-Deployment

- [ ] Verify cache working in production
- [ ] Check API request reduction in logs
- [ ] Monitor error rates (should not increase)
- [ ] Collect user feedback
- [ ] Measure performance improvements
- [ ] Document lessons learned
- [ ] Plan next optimizations

## 16. Risk Assessment

### Low Risk

**React Query is stable:**
- Mature library (v4+), widely used
- Good TypeScript support
- Excellent documentation
- Active maintenance

**Backward compatible changes:**
- API changes are additive (owned parameter optional)
- UI unchanged
- Graceful degradation if SSR fails

### Medium Risk

**SSR complexity:**
- Server-side fetch could fail silently
- Mitigation: Comprehensive error handling, fallback to client fetch
- Monitoring: Log SSR errors, track failure rate

**Cache invalidation bugs:**
- Stale data shown after mutations
- Mitigation: Thorough testing of create/update/delete flows
- Monitoring: User reports, QA testing

### High Risk (Mitigated)

**Breaking changes to existing code:**
- Risk: Refactoring could introduce bugs
- Mitigation: Maintain same interfaces, extensive testing
- Rollback: Keep old code in backup, easy to revert

**Performance regression:**
- Risk: React Query overhead could slow things down
- Mitigation: Performance testing before deployment
- Monitoring: Track Web Vitals, Lighthouse scores

## 17. Timeline Estimation

**Total Estimated Time: 16-20 hours**

### Phase 1: Foundation (4-5 hours)
- Step 1: Install dependencies (0.5 hours)
- Step 2: Create QueryProvider (1 hour)
- Step 3: Create useQuizListQuery hook (2.5 hours)

### Phase 2: Backend API (3-4 hours)
- Step 4: Update API endpoint (1.5 hours)
- Step 5: Update validation schema (0.5 hours)
- Step 6: Update quiz service (2 hours)

### Phase 3: Dashboard Refactoring (4-5 hours)
- Step 7: Refactor useDashboard (2 hours)
- Step 8: Update DashboardContainer (1.5 hours)
- Step 9: Implement lazy tab loading (1 hour)

### Phase 4: SSR Integration (2-3 hours)
- Step 10: Server-side data fetching (1.5 hours)
- Step 11: Wire SSR data to React (1 hour)

### Phase 5: Cleanup (1-2 hours)
- Step 12: Remove page load listener (0.5 hours)
- Step 13: Tune cache config (0.5 hours)
- Step 14: Remove deprecated code (0.5 hours)

### Phase 6: Polish & Testing (2-3 hours)
- Step 15: Loading states polish (1 hour)
- Step 16: Cross-browser testing (1.5 hours)

### Buffer for Issues (20%)
- Unexpected bugs, edge cases (3-4 hours)

## 18. Key Differences from Current Implementation

| Aspect | Current (Before) | Optimized (After) |
|--------|-----------------|-------------------|
| **Data Fetching** | Manual fetch with useState/useEffect | React Query (automatic) |
| **Caching** | None (`cache: no-store`) | 5-10 min intelligent cache |
| **Initial Load** | Client-side only, loading spinner | SSR + hydration, instant content |
| **Tab Switching** | Full refetch every time | Instant from cache if fresh |
| **Public Quizzes** | Fetches on mount (eager) | Fetches on tab click (lazy) |
| **My Quizzes Filter** | Client-side (fetch all, filter) | Server-side (DB filter) |
| **Navigation** | Refetch on astro:page-load | Smart refetch based on staleness |
| **Code Complexity** | Manual state management | Declarative queries |
| **Error Handling** | Manual try-catch | Built-in React Query |
| **Loading States** | Manual isLoading flag | Automatic from useQuery |
| **API Calls** | 6-8 per session | 2-3 per session (60% reduction) |
| **Bundle Size** | Smaller (no React Query) | +40KB (React Query lib) |
| **Maintainability** | More boilerplate code | Less code, standard patterns |

## 19. Success Metrics Tracking

### Implementation Metrics

**Code Quality:**
- Lines of code reduced: Target -100 lines
- TypeScript errors: 0
- ESLint warnings: 0
- Test coverage: Maintain current level

**Performance:**
- API request reduction: Target >60%
- Cache hit rate: Target >80%
- Initial load time: Target <500ms
- Tab switch (cached): Target <50ms

**User Experience:**
- No visual regressions
- No functionality regressions
- Improved perceived performance
- Positive user feedback

### Monitoring Setup

**Development:**
- React Query DevTools (inspect cache)
- Chrome DevTools Network tab (track requests)
- Console logs for debugging (remove in production)

**Production:**
- Web Vitals monitoring (LCP, FID, CLS)
- API request logging (count, timing)
- Error tracking (Sentry or similar)
- User session recordings (optional)

### Success Dashboard

Track and report:
- Before/after API request counts
- Cache hit rate over time
- Average load times (p50, p95, p99)
- Error rates
- User engagement metrics (time on dashboard, tab switches)
