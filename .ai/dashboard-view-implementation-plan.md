# View Implementation Plan: Dashboard

## 1. Overview

The Dashboard view serves as the main landing page after user authentication, providing a comprehensive overview of quizzes accessible to the user. It displays two distinct categories of quizzes:
- **My Quizzes**: All quizzes created by the authenticated user (regardless of visibility status)
- **Public Quizzes**: All quizzes marked as public by other users

The view implements tabbed navigation for switching between these categories, supports pagination for handling large datasets, and provides a responsive grid layout optimized for various screen sizes. Key features include loading states, error handling, empty states, and accessible navigation patterns.

## 2. View Routing

**Path**: `/dashboard`

**Access Control**:
- Requires authentication (enforced by Astro middleware)
- Redirects to `/login` if user is not authenticated

**Route Configuration**:
```typescript
// src/pages/dashboard.astro
---
// Protected route - middleware handles auth check
---
```

## 3. Component Structure

```
DashboardPage (Astro - src/pages/dashboard.astro)
└── DashboardLayout (Astro - uses existing layout)
    └── DashboardContainer (React - src/components/Dashboard/DashboardContainer.tsx)
        ├── PageHeader (React - src/components/Dashboard/PageHeader.tsx)
        ├── QuizListTabs (React - src/components/Dashboard/QuizListTabs.tsx)
        │   ├── TabsList (Shadcn/ui)
        │   ├── TabsTrigger: "My Quizzes" (Shadcn/ui)
        │   └── TabsTrigger: "Public Quizzes" (Shadcn/ui)
        ├── ErrorAlert (React - src/components/ui/Alert.tsx) [conditional]
        ├── LoadingSpinner (React - src/components/ui/LoadingSpinner.tsx) [conditional]
        ├── QuizList (React - src/components/Dashboard/QuizList.tsx) [conditional]
        │   ├── QuizCard (React - src/components/Dashboard/QuizCard.tsx) [multiple]
        │   └── PaginationControls (React - src/components/Dashboard/PaginationControls.tsx)
        └── EmptyState (React - src/components/Dashboard/EmptyState.tsx) [conditional]
```

## 4. Component Details

### 4.1 DashboardPage (Astro)

**Description**: The main Astro page component that serves as the entry point for the Dashboard view. It's a static page that hydrates the React components on the client side.

**Main Elements**:
- Layout wrapper (uses existing DashboardLayout)
- Client-side React container with `client:load` directive

**Handled Events**: None (static page)

**Validation**: None at this level (authentication handled by middleware)

**Types**: None directly

**Props**: None

**Implementation Notes**:
```astro
---
import DashboardLayout from '@/layouts/DashboardLayout.astro';
import DashboardContainer from '@/components/Dashboard/DashboardContainer';
---

<DashboardLayout title="Dashboard | QuizStack">
  <DashboardContainer client:load />
</DashboardLayout>
```

### 4.2 DashboardContainer (React)

**Description**: The main React container component that orchestrates the entire dashboard functionality. It manages the active tab state, coordinates data fetching for both quiz lists, handles errors, and renders appropriate child components based on current state.

**Main Elements**:
- `<PageHeader />` - Dashboard title and description
- `<Tabs />` wrapper from Shadcn/ui
- `<QuizListTabs />` - Tab navigation
- `<TabsContent />` for "My Quizzes"
  - `<ErrorAlert />` if error exists
  - `<LoadingSpinner />` if loading
  - `<EmptyState />` if no quizzes
  - `<QuizList />` if data exists
- `<TabsContent />` for "Public Quizzes"
  - Same conditional rendering as above

**Handled Events**:
- `onTabChange`: Triggered when user switches between tabs
- `onPageChange`: Triggered when user navigates pagination
- `onRetry`: Triggered when user clicks retry after error

**Validation**: None

**Types**:
- `DashboardViewState` (ViewModel)
- `TabType` (ViewModel)
- `QuizListData` (ViewModel)

**Props**: None (root component)

**State Management**:
- Uses `useDashboard` custom hook to manage all dashboard state
- Manages active tab, pagination, and data for both lists

### 4.3 PageHeader (React)

**Description**: Simple presentational component that displays the dashboard title and optional description.

**Main Elements**:
- `<header>` with Tailwind classes
- `<h1>` for "Dashboard" title
- `<p>` for description text

**Handled Events**: None

**Validation**: None

**Types**: None

**Props**:
```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
}
```

### 4.4 QuizListTabs (React)

**Description**: Tab navigation component that allows users to switch between "My Quizzes" and "Public Quizzes" views. Uses Shadcn/ui Tabs component for accessibility.

**Main Elements**:
- `<TabsList>` from Shadcn/ui
- `<TabsTrigger value="my-quizzes">` - "My Quizzes" tab
- `<TabsTrigger value="public-quizzes">` - "Public Quizzes" tab

**Handled Events**:
- `onValueChange`: Called when tab is changed

**Validation**: None

**Types**:
- `TabType` (ViewModel)

**Props**:
```typescript
interface QuizListTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}
```

### 4.5 QuizList (React)

**Description**: Container component that renders a grid of quiz cards and pagination controls. Handles the layout and organization of quiz items.

**Main Elements**:
- `<div>` with grid layout (Tailwind classes: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`)
- Multiple `<QuizCard />` components
- `<PaginationControls />` component

**Handled Events**:
- `onPageChange`: Propagated from PaginationControls

**Validation**: None

**Types**:
- `QuizDTO[]` from types.ts
- `PaginationMetadata` (from QuizListResponse)

**Props**:
```typescript
interface QuizListProps {
  quizzes: QuizDTO[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
  onPageChange: (page: number) => void;
  currentUserId?: string; // To determine ownership for My Quizzes tab
}
```

### 4.6 QuizCard (React)

**Description**: Individual quiz card component that displays summary information about a single quiz. Clickable to navigate to quiz detail or taking page.

**Main Elements**:
- `<Card>` wrapper from Shadcn/ui
- `<CardHeader>` with title and metadata
- `<CardContent>` with description
- `<CardFooter>` with additional info (question count, visibility badge)
- Visibility badge (public/private indicator)
- Source badge (manual/AI-generated indicator)
- Click handler for navigation

**Handled Events**:
- `onClick`: Navigate to quiz detail page

**Validation**: None

**Types**:
- `QuizDTO` from types.ts
- `QuizCardViewModel` (ViewModel with computed properties)

**Props**:
```typescript
interface QuizCardProps {
  quiz: QuizDTO;
  questionCount?: number; // Optional, may not be available initially
  onClick?: (quizId: string) => void;
  showOwnership?: boolean; // Show owner info for public quizzes
}
```

**Computed Properties**:
- Format creation date to human-readable format
- Determine card styling based on source (AI vs manual)
- Truncate long descriptions

### 4.7 PaginationControls (React)

**Description**: Pagination navigation component that allows users to move between pages of quiz results.

**Main Elements**:
- `<Pagination>` wrapper from Shadcn/ui
- `<PaginationContent>`
- `<PaginationItem>` for Previous button
- `<PaginationItem>` for page numbers
- `<PaginationItem>` for Next button
- `<PaginationEllipsis>` for truncated page numbers

**Handled Events**:
- `onPageChange`: Called when user clicks page number or prev/next

**Validation**:
- Disable "Previous" button when on first page
- Disable "Next" button when on last page
- Ensure page number is within valid range (1 to totalPages)

**Types**:
- `PaginationMetadata` (from QuizListResponse)

**Props**:
```typescript
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  disabled?: boolean; // Disable during loading
}
```

### 4.8 LoadingSpinner (React)

**Description**: Loading state indicator shown while data is being fetched.

**Main Elements**:
- `<div>` with centered layout
- Spinner icon or animation
- Optional loading text

**Handled Events**: None

**Validation**: None

**Types**: None

**Props**:
```typescript
interface LoadingSpinnerProps {
  message?: string; // Optional loading message
  size?: 'sm' | 'md' | 'lg';
}
```

### 4.9 ErrorAlert (React)

**Description**: Error display component that shows user-friendly error messages with optional retry functionality.

**Main Elements**:
- `<Alert>` wrapper from Shadcn/ui with variant="destructive"
- `<AlertTitle>` for error title
- `<AlertDescription>` for error message
- `<Button>` for retry action (optional)
- Dismiss button (X icon)

**Handled Events**:
- `onRetry`: Called when user clicks retry button
- `onDismiss`: Called when user dismisses the alert

**Validation**: None

**Types**: None

**Props**:
```typescript
interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
}
```

### 4.10 EmptyState (React)

**Description**: Empty state component shown when no quizzes are available. Displays contextual message and call-to-action based on the active tab.

**Main Elements**:
- `<div>` with centered layout
- Icon or illustration
- `<h3>` for empty state title
- `<p>` for descriptive message
- `<Button>` for call-to-action (optional)

**Handled Events**:
- `onAction`: Called when user clicks CTA button

**Validation**: None

**Types**:
- `TabType` (to determine which message to show)

**Props**:
```typescript
interface EmptyStateProps {
  type: 'my-quizzes' | 'public-quizzes';
  onAction?: () => void; // Navigate to create quiz or refresh
  actionLabel?: string;
}
```

**Conditional Messages**:
- My Quizzes: "You haven't created any quizzes yet" + "Create your first quiz" button
- Public Quizzes: "No public quizzes available" + optional "Refresh" button

## 5. Types

### 5.1 Existing Types (from src/types.ts)

**QuizDTO**: Complete quiz information without nested questions
```typescript
interface QuizDTO {
  id: string;
  user_id: string;
  title: string;
  description: string;
  visibility: QuizVisibility; // "public" | "private"
  status: QuizStatus;
  source: QuizSource; // "manual" | "ai_generated"
  ai_model?: string;
  ai_prompt?: string;
  ai_temperature?: number;
  created_at: string; // ISO8601 timestamp
  updated_at: string; // ISO8601 timestamp
}
```

**QuizListResponse**: API response structure
```typescript
interface QuizListResponse {
  quizzes: QuizDTO[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}
```

### 5.2 New ViewModel Types

**DashboardViewState**: Overall dashboard state
```typescript
interface DashboardViewState {
  activeTab: TabType;
  myQuizzes: QuizListData;
  publicQuizzes: QuizListData;
  currentUserId: string;
}
```

**TabType**: Tab identifier type
```typescript
type TabType = 'my-quizzes' | 'public-quizzes';
```

**QuizListData**: State for a single quiz list
```typescript
interface QuizListData {
  quizzes: QuizDTO[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
  isLoading: boolean;
  error: string | null;
}
```

**QuizCardViewModel**: Enhanced quiz data for display
```typescript
interface QuizCardViewModel extends QuizDTO {
  // Computed properties
  formattedCreatedAt: string; // e.g., "2 days ago" or "Jan 15, 2025"
  questionCount?: number; // May be undefined initially
  isOwned: boolean; // For public quizzes, indicates if current user owns it
}
```

**PaginationMetadata**: Extracted from QuizListResponse for reuse
```typescript
interface PaginationMetadata {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}
```

### 5.3 API Request Types

**QuizListQuery**: Query parameters for GET /api/quizzes
```typescript
interface QuizListQuery {
  page?: number; // default: 1
  limit?: number; // default: 10, max: 100
  sort?: 'created_at' | 'title' | 'updated_at'; // default: 'created_at'
  order?: 'asc' | 'desc'; // default: 'desc'
  visibility?: 'public' | 'private'; // optional filter
}
```

## 6. State Management

### 6.1 Overview

State management for the Dashboard view is handled through a custom React hook (`useDashboard`) that encapsulates all state logic and side effects. This approach keeps the main component clean and makes state logic reusable and testable.

### 6.2 Custom Hook: useDashboard

**Purpose**: Centralize all dashboard state management, including tab switching, data fetching for both quiz lists, pagination, and error handling.

**Location**: `src/hooks/useDashboard.ts`

**Hook Signature**:
```typescript
function useDashboard(): {
  // State
  activeTab: TabType;
  myQuizzes: QuizListData;
  publicQuizzes: QuizListData;
  currentUserId: string;

  // Actions
  setActiveTab: (tab: TabType) => void;
  goToPage: (page: number) => void;
  refetchMyQuizzes: () => Promise<void>;
  refetchPublicQuizzes: () => Promise<void>;
  dismissError: (tab: TabType) => void;
}
```

**Internal State**:
- `activeTab`: Current active tab ('my-quizzes' | 'public-quizzes')
- `myQuizzesPage`: Current page for "My Quizzes" (separate from public quizzes page)
- `publicQuizzesPage`: Current page for "Public Quizzes"

**Dependencies**:
- Uses `useQuizList` hook (described below) for each list
- Uses `useAuth` or similar to get current user ID
- Uses `useEffect` to fetch data when tab changes or page changes

**Behavior**:
- Fetches "My Quizzes" on mount
- Fetches "Public Quizzes" when tab switches to it (lazy loading)
- Maintains separate pagination state for each tab
- Resets to page 1 when switching tabs (optional behavior)

### 6.3 Custom Hook: useQuizList

**Purpose**: Generic hook for fetching and managing a list of quizzes with pagination and error handling.

**Location**: `src/hooks/useQuizList.ts`

**Hook Signature**:
```typescript
function useQuizList(params: {
  visibility?: 'public' | 'private';
  page: number;
  limit?: number;
  enabled?: boolean; // Don't fetch if false (for lazy loading)
}): {
  data: QuizListResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

**Internal Implementation**:
- Uses `fetch` API or Supabase client to call GET /api/quizzes
- Manages loading and error states
- Caches results (optional, using React Query or similar)
- Handles authentication errors (redirect to login if 401)

**Error Handling**:
- Network errors: Set error message, allow retry
- 401 Unauthorized: Redirect to login
- 400 Bad Request: Log error, show generic message
- 500 Server Error: Show user-friendly error message

### 6.4 State Flow

1. **Initial Load**:
   - User navigates to `/dashboard`
   - Middleware checks authentication
   - DashboardContainer mounts
   - useDashboard hook initializes with activeTab = 'my-quizzes'
   - useQuizList fetches "My Quizzes" data
   - isLoading = true, spinner shows
   - Data loads, isLoading = false, QuizList renders

2. **Tab Switch**:
   - User clicks "Public Quizzes" tab
   - setActiveTab('public-quizzes') called
   - activeTab state updates
   - useQuizList for public quizzes activates (enabled = true)
   - Public quizzes fetch begins
   - Loading spinner shows for public tab
   - Data loads, QuizList renders

3. **Pagination**:
   - User clicks page 2
   - goToPage(2) called
   - Page state updates for active tab
   - useQuizList re-fetches with new page parameter
   - Loading state shows (optional, could show loading indicator on pagination)
   - New data replaces old data
   - List re-renders with new quizzes

4. **Error Recovery**:
   - API call fails
   - Error state set in useQuizList
   - ErrorAlert renders with retry button
   - User clicks retry
   - refetch() called
   - Process repeats from loading state

### 6.5 Data Filtering

**Challenge**: The GET /api/quizzes endpoint returns both the user's own quizzes and public quizzes from others. For the "My Quizzes" tab, we need to show only the user's quizzes.

**Solution**:
- **Option A** (Client-side filtering):
  - Fetch all quizzes (no visibility filter)
  - Filter where `quiz.user_id === currentUserId`
  - Handle pagination on filtered results (may require fetching more data)

- **Option B** (Backend enhancement - recommended):
  - Suggest adding a query parameter like `owned=true` to the endpoint
  - Endpoint filters server-side for better performance
  - Pagination works correctly

**Interim Solution**: Use client-side filtering with a note to enhance the endpoint. Store `currentUserId` from auth session and filter in `useDashboard`.

```typescript
// In useDashboard hook
const myQuizzes = useMemo(() => {
  if (!allQuizzesData) return [];
  return allQuizzesData.quizzes.filter(
    quiz => quiz.user_id === currentUserId
  );
}, [allQuizzesData, currentUserId]);
```

## 7. API Integration

### 7.1 Endpoint Details

**Endpoint**: `GET /api/quizzes`

**Base URL**: `/api/quizzes` (relative to app root)

**Authentication**: Required (JWT token via session cookie or Authorization header)

**Query Parameters**:
```typescript
{
  page?: number;          // Default: 1, Min: 1
  limit?: number;         // Default: 10, Min: 1, Max: 100
  sort?: string;          // Default: 'created_at', Options: 'created_at', 'title', 'updated_at'
  order?: 'asc' | 'desc'; // Default: 'desc'
  visibility?: 'public' | 'private'; // Optional filter
}
```

**Request Type**: `QuizListQuery`

**Response Type**: `QuizListResponse`

**Response Structure**:
```typescript
{
  quizzes: QuizDTO[],
  pagination: {
    page: number,
    limit: number,
    totalPages: number,
    totalItems: number
  }
}
```

### 7.2 API Calls for Dashboard

#### Fetch My Quizzes

**Initial Implementation** (with client-side filtering):
```typescript
const fetchMyQuizzes = async (page: number): Promise<QuizListResponse> => {
  const response = await fetch(
    `/api/quizzes?page=${page}&limit=10&sort=created_at&order=desc`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include session cookie
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch quizzes');
  }

  const data: QuizListResponse = await response.json();

  // Filter for current user's quizzes
  const filteredQuizzes = data.quizzes.filter(
    quiz => quiz.user_id === currentUserId
  );

  // Note: Pagination metadata may be incorrect after filtering
  // This is a limitation of client-side filtering
  return {
    quizzes: filteredQuizzes,
    pagination: {
      ...data.pagination,
      totalItems: filteredQuizzes.length, // This won't be accurate
    },
  };
};
```

**Recommended Implementation** (with backend support):
```typescript
const fetchMyQuizzes = async (page: number): Promise<QuizListResponse> => {
  // Assuming backend adds 'owned=true' parameter support
  const response = await fetch(
    `/api/quizzes?owned=true&page=${page}&limit=10&sort=created_at&order=desc`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch my quizzes');
  }

  return await response.json();
};
```

#### Fetch Public Quizzes

```typescript
const fetchPublicQuizzes = async (page: number): Promise<QuizListResponse> => {
  const response = await fetch(
    `/api/quizzes?visibility=public&page=${page}&limit=10&sort=created_at&order=desc`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch public quizzes');
  }

  return await response.json();
};
```

### 7.3 Error Response Handling

**401 Unauthorized**:
```json
{
  "error": "Unauthorized",
  "message": "Authentication is required to access quizzes"
}
```
Action: Redirect to `/login`

**400 Bad Request**:
```json
{
  "error": "Validation Failed",
  "message": "Invalid query parameters",
  "details": [
    { "field": "page", "message": "Must be a positive integer" }
  ]
}
```
Action: Log error, show generic error message (shouldn't happen with proper typing)

**500 Internal Server Error**:
```json
{
  "error": "Internal Server Error",
  "message": "Failed to retrieve quizzes from database"
}
```
Action: Display user-friendly error message with retry option

### 7.4 Loading States

- **Initial Load**: Show full-page LoadingSpinner
- **Pagination**: Show subtle loading indicator on pagination controls
- **Tab Switch**: Show LoadingSpinner in new tab content area
- **Retry**: Show LoadingSpinner, clear error state

### 7.5 Caching Strategy (Optional Enhancement)

For improved UX, consider implementing:
- Cache fetched pages for 5 minutes
- Don't refetch if data is fresh
- Invalidate cache on tab visibility change
- Use React Query or SWR for automatic caching

## 8. User Interactions

### 8.1 Tab Navigation

**Interaction**: User clicks on a tab (My Quizzes or Public Quizzes)

**User Flow**:
1. User lands on dashboard (default: "My Quizzes" active)
2. User clicks "Public Quizzes" tab
3. Tab becomes visually active
4. Loading spinner appears in content area
5. Public quizzes load
6. List of quiz cards appears
7. Pagination controls update to reflect public quizzes pagination

**Expected Behavior**:
- Active tab has distinct visual styling (Shadcn/ui handles this)
- Content area updates to show corresponding quiz list
- Pagination resets to page 1 (configurable)
- Previous tab's data remains cached (optional)
- Loading state shown while fetching
- URL updates to include tab parameter (optional: `/dashboard?tab=public-quizzes`)

**Edge Cases**:
- Clicking already active tab: No action
- Switching tabs while loading: Cancel previous request, load new tab
- Error on one tab: Doesn't affect other tab's data

**Implementation**:
```typescript
const handleTabChange = (newTab: TabType) => {
  setActiveTab(newTab);
  // Reset pagination for new tab (optional)
  if (newTab === 'my-quizzes') {
    setMyQuizzesPage(1);
  } else {
    setPublicQuizzesPage(1);
  }
};
```

### 8.2 Pagination

**Interaction**: User clicks on page number, next, or previous button

**User Flow**:
1. User views first page of quizzes
2. User clicks "Next" or specific page number (e.g., "2")
3. Loading indicator appears (optional, could show subtle loader)
4. New page of quizzes loads
5. Quiz list updates with new cards
6. Pagination controls update (current page highlighted)
7. Page scrolls to top of quiz list (optional)

**Expected Behavior**:
- Smooth transition between pages
- Previous/Next buttons disabled at boundaries
- Current page visually highlighted
- Pagination state maintained per tab
- URL updates to include page parameter (optional: `/dashboard?tab=my-quizzes&page=2`)

**Edge Cases**:
- Clicking current page: No action
- Clicking beyond total pages: Prevented by UI (buttons disabled)
- API returns fewer items than expected: Display what's available
- Last page with partial results: Show remaining items, disable "Next"

**Implementation**:
```typescript
const handlePageChange = (newPage: number) => {
  // Validate page number
  if (newPage < 1 || newPage > currentPagination.totalPages) {
    return;
  }

  // Update page for active tab
  if (activeTab === 'my-quizzes') {
    setMyQuizzesPage(newPage);
  } else {
    setPublicQuizzesPage(newPage);
  }

  // Optional: Scroll to top of quiz list
  quizListRef.current?.scrollIntoView({ behavior: 'smooth' });
};
```

### 8.3 Quiz Card Click

**Interaction**: User clicks on a quiz card to view details or take the quiz

**User Flow**:
1. User browses quiz cards
2. User clicks on a quiz card of interest
3. Application navigates to quiz detail page
4. Detail page shows full quiz information with option to start

**Expected Behavior**:
- Card has hover state indicating clickability
- Entire card is clickable (not just title)
- Navigates to `/quizzes/{quizId}` (or appropriate route)
- Opens in same window (can open in new tab with Ctrl/Cmd+Click)

**Edge Cases**:
- Quiz no longer exists: 404 page on detail route
- Quiz became private (for public quizzes): 403 or 404 on detail route
- Network error during navigation: Browser handles

**Implementation**:
```typescript
const handleQuizClick = (quizId: string) => {
  // Using Astro or React Router navigation
  window.location.href = `/quizzes/${quizId}`;
  // Or with React Router:
  // navigate(`/quizzes/${quizId}`);
};
```

### 8.4 Error Retry

**Interaction**: User clicks retry button after an error occurs

**User Flow**:
1. API call fails (network error, server error)
2. Error alert appears with error message
3. User clicks "Retry" button
4. Error alert disappears
5. Loading spinner appears
6. API call retries
7. Either data loads successfully or error reappears

**Expected Behavior**:
- Clear error state before retrying
- Show loading state during retry
- If retry succeeds, show data normally
- If retry fails, show error again
- Limit retry attempts (optional: after 3 failures, suggest refresh)

**Implementation**:
```typescript
const handleRetry = async () => {
  if (activeTab === 'my-quizzes') {
    await refetchMyQuizzes();
  } else {
    await refetchPublicQuizzes();
  }
};
```

### 8.5 Empty State Action

**Interaction**: User clicks CTA button in empty state

**User Flow (My Quizzes)**:
1. User has no quizzes created
2. Empty state shows: "You haven't created any quizzes yet"
3. CTA button: "Create Your First Quiz"
4. User clicks button
5. Navigate to quiz creation page

**User Flow (Public Quizzes)**:
1. No public quizzes available
2. Empty state shows: "No public quizzes available"
3. CTA button: "Refresh"
4. User clicks button
5. Refetch public quizzes

**Expected Behavior**:
- Clear call-to-action in empty states
- Appropriate navigation or action based on context
- For "My Quizzes": Navigate to `/quizzes/create` or `/generate` (AI generation)
- For "Public Quizzes": Refresh/refetch data

**Implementation**:
```typescript
const handleEmptyStateAction = (type: TabType) => {
  if (type === 'my-quizzes') {
    window.location.href = '/quizzes/create';
  } else {
    refetchPublicQuizzes();
  }
};
```

## 9. Conditions and Validation

### 9.1 Authentication Check

**Condition**: User must be authenticated to view the dashboard

**Validation Location**: Astro middleware (`src/middleware/index.ts`)

**Implementation**:
```typescript
// In middleware
export async function onRequest(context, next) {
  const { url, locals } = context;

  // Check if route requires auth
  if (url.pathname.startsWith('/dashboard')) {
    const session = await locals.supabase.auth.getSession();

    if (!session.data.session) {
      return Response.redirect(new URL('/login', url.origin));
    }
  }

  return next();
}
```

**UI Impact**: If check fails, user never sees dashboard (redirected before render)

### 9.2 Pagination Boundaries

**Condition**: Page number must be within valid range (1 to totalPages)

**Validation Location**: `PaginationControls` component and `useDashboard` hook

**Implementation**:
```typescript
// In PaginationControls
const isPrevDisabled = currentPage <= 1 || disabled;
const isNextDisabled = currentPage >= totalPages || disabled;

// In useDashboard
const goToPage = (page: number) => {
  const maxPage = activeTab === 'my-quizzes'
    ? myQuizzes.pagination.totalPages
    : publicQuizzes.pagination.totalPages;

  if (page < 1 || page > maxPage) {
    console.warn('Invalid page number:', page);
    return;
  }

  // Update page...
};
```

**UI Impact**:
- Previous button disabled on first page
- Next button disabled on last page
- Direct page number clicks validated before navigation

### 9.3 Data Loading States

**Condition**: Cannot interact with UI while data is loading

**Validation Location**: Component render logic

**Implementation**:
```typescript
// In DashboardContainer
if (currentListData.isLoading) {
  return <LoadingSpinner message="Loading quizzes..." />;
}

// In PaginationControls
<Button
  disabled={disabled || isLoading}
  onClick={() => onPageChange(page)}
>
  {page}
</Button>
```

**UI Impact**:
- Show loading spinner during initial load
- Disable pagination controls during page change
- Prevent multiple simultaneous requests

### 9.4 Empty Data Handling

**Condition**: Display appropriate UI when no quizzes are available

**Validation Location**: `DashboardContainer` component

**Implementation**:
```typescript
// In DashboardContainer
if (!currentListData.isLoading && currentListData.quizzes.length === 0) {
  return (
    <EmptyState
      type={activeTab}
      onAction={handleEmptyStateAction}
    />
  );
}
```

**UI Impact**:
- Show empty state instead of quiz list
- Display context-appropriate message
- Provide relevant CTA

### 9.5 Error State Handling

**Condition**: Display error UI when API calls fail

**Validation Location**: `DashboardContainer` component

**Implementation**:
```typescript
// In DashboardContainer
if (currentListData.error) {
  return (
    <ErrorAlert
      title="Failed to Load Quizzes"
      message={currentListData.error}
      onRetry={handleRetry}
      onDismiss={() => dismissError(activeTab)}
    />
  );
}
```

**UI Impact**:
- Show error alert above quiz list or in place of it
- Provide retry functionality
- Allow dismissal (but data won't be available)

### 9.6 Quiz Card Interaction

**Condition**: User can only click on quiz cards when not loading

**Validation Location**: `QuizCard` component

**Implementation**:
```typescript
// In QuizCard
<Card
  className={cn(
    "cursor-pointer hover:shadow-lg transition-shadow",
    isLoading && "pointer-events-none opacity-50"
  )}
  onClick={() => !isLoading && onClick?.(quiz.id)}
>
```

**UI Impact**:
- Disable card clicks during loading
- Reduce opacity to indicate disabled state
- Prevent navigation while data is being updated

## 10. Error Handling

### 10.1 Error Categories

#### Authentication Errors (401)

**Scenario**: User session expired or invalid

**Detection**: API returns 401 status code

**Handling**:
```typescript
if (response.status === 401) {
  // Redirect to login page
  window.location.href = '/login?redirect=/dashboard';
  return;
}
```

**User Experience**:
- Automatic redirect to login page
- Preserve intended destination in redirect parameter
- After login, return to dashboard

**Prevention**:
- Implement session refresh mechanism
- Check session validity before API calls
- Use middleware for consistent auth checks

#### Network Errors

**Scenario**: No internet connection or DNS failure

**Detection**: Fetch throws network error

**Handling**:
```typescript
try {
  const response = await fetch(url);
  // ...
} catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    setError('Network error. Please check your connection and try again.');
  }
}
```

**User Experience**:
- Show ErrorAlert with network-specific message
- Provide retry button
- Consider offline indicator in header

**Prevention**:
- Implement service worker for offline support (future enhancement)
- Cache previously loaded data
- Show connection status indicator

#### Server Errors (500)

**Scenario**: Database error, server crash, or unexpected backend error

**Detection**: API returns 500 status code

**Handling**:
```typescript
if (response.status === 500) {
  const errorData = await response.json();
  setError('Something went wrong on our end. Please try again later.');
  console.error('Server error:', errorData);
}
```

**User Experience**:
- Show user-friendly generic error message
- Provide retry button
- Log technical details for debugging
- Suggest contacting support if persists

**Prevention**:
- Implement comprehensive error logging on backend
- Monitor error rates and alert on spikes
- Have fallback mechanisms for critical failures

#### Validation Errors (400)

**Scenario**: Invalid query parameters (rare with TypeScript)

**Detection**: API returns 400 status code

**Handling**:
```typescript
if (response.status === 400) {
  const errorData = await response.json();
  console.error('Validation error:', errorData);
  setError('Invalid request. Please refresh the page and try again.');
}
```

**User Experience**:
- Show generic error message
- Suggest page refresh
- Log details for debugging

**Prevention**:
- Strict TypeScript typing for API parameters
- Validate parameters before making API calls
- Unit tests for parameter building logic

### 10.2 Error Display Patterns

#### Inline Errors

**Usage**: For non-critical errors that don't prevent page use

**Implementation**:
```typescript
<TabsContent value="my-quizzes">
  {myQuizzes.error && (
    <ErrorAlert
      message={myQuizzes.error}
      onRetry={refetchMyQuizzes}
      onDismiss={() => dismissError('my-quizzes')}
    />
  )}
  {/* Rest of content */}
</TabsContent>
```

**Best For**: Tab-specific errors, retry-able failures

#### Full-Page Errors

**Usage**: For critical errors that prevent page functionality

**Implementation**:
```typescript
if (criticalError) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <ErrorAlert
        title="Failed to Load Dashboard"
        message={criticalError}
        onRetry={handleRetry}
      />
    </div>
  );
}
```

**Best For**: Authentication failures, initial load failures

#### Toast Notifications (Future Enhancement)

**Usage**: For transient errors or success messages

**Best For**: Quiz deletion success, temporary network issues

### 10.3 Error Recovery Strategies

#### Automatic Retry

For transient network errors, implement exponential backoff:

```typescript
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }

      // Retry on server errors (5xx)
      if (i < maxRetries - 1) {
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
        continue;
      }

      throw new Error(`Server error: ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
  throw new Error('Max retries exceeded');
};
```

#### Manual Retry

Provide explicit retry button for user-initiated retry:

```typescript
const handleRetry = async () => {
  // Clear error state
  setError(null);

  // Retry fetch
  await refetch();
};
```

#### Graceful Degradation

Show cached or partial data when available:

```typescript
if (error && cachedData) {
  return (
    <>
      <ErrorAlert
        message="Unable to load latest data. Showing cached results."
        onRetry={refetch}
      />
      <QuizList quizzes={cachedData} {...props} />
    </>
  );
}
```

### 10.4 Error Logging

Implement comprehensive error logging for debugging:

```typescript
const logError = (error: Error, context: Record<string, any>) => {
  console.error('Dashboard Error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });

  // Send to error tracking service (e.g., Sentry)
  // sendToErrorTracking(error, context);
};

// Usage
try {
  await fetchQuizzes();
} catch (error) {
  logError(error as Error, {
    component: 'DashboardContainer',
    action: 'fetchQuizzes',
    activeTab,
    page: currentPage,
  });
}
```

### 10.5 Edge Cases

#### No Quizzes Available

**Not an error, but requires special handling**:
```typescript
if (quizzes.length === 0 && !isLoading && !error) {
  return <EmptyState type={activeTab} onAction={handleAction} />;
}
```

#### Partial Page Load

**Scenario**: API returns fewer items than requested on last page

**Handling**: Display available items normally

```typescript
// No special handling needed - just render what's returned
<QuizList quizzes={data.quizzes} pagination={data.pagination} />
```

#### Tab Switch During Loading

**Scenario**: User switches tabs while previous tab is still loading

**Handling**: Cancel previous request, load new tab

```typescript
useEffect(() => {
  const abortController = new AbortController();

  fetchQuizzes(activeTab, { signal: abortController.signal });

  return () => {
    abortController.abort(); // Cancel on cleanup
  };
}, [activeTab]);
```

#### Rapid Pagination Clicks

**Scenario**: User clicks multiple page buttons quickly

**Handling**: Debounce or disable buttons during loading

```typescript
const [isNavigating, setIsNavigating] = useState(false);

const handlePageChange = async (page: number) => {
  if (isNavigating) return; // Ignore if already navigating

  setIsNavigating(true);
  await goToPage(page);
  setIsNavigating(false);
};
```

## 11. Implementation Steps

### Step 1: Set Up Project Structure

**Tasks**:
1. Create component directories:
   ```
   src/components/Dashboard/
   ├── DashboardContainer.tsx
   ├── PageHeader.tsx
   ├── QuizListTabs.tsx
   ├── QuizList.tsx
   ├── QuizCard.tsx
   ├── PaginationControls.tsx
   └── EmptyState.tsx
   ```

2. Create hooks directory:
   ```
   src/hooks/
   ├── useDashboard.ts
   └── useQuizList.ts
   ```

3. Create types file (if needed):
   ```
   src/types/dashboard.types.ts
   ```

**Verification**: Directory structure created, empty files in place

### Step 2: Define Types

**Tasks**:
1. Add new ViewModel types to `src/types/dashboard.types.ts`:
   - `DashboardViewState`
   - `TabType`
   - `QuizListData`
   - `QuizCardViewModel`
   - `PaginationMetadata`

2. Export types from `src/types.ts` or `src/types/index.ts`

**Verification**: TypeScript types compile without errors, can import types in components

### Step 3: Implement useQuizList Hook

**Tasks**:
1. Create `src/hooks/useQuizList.ts`
2. Implement fetch logic with error handling
3. Manage loading, error, and data states
4. Implement refetch functionality
5. Handle authentication errors (redirect to login)
6. Add TypeScript types for parameters and return value

**Code Outline**:
```typescript
export function useQuizList(params: UseQuizListParams) {
  const [data, setData] = useState<QuizListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizzes = async () => {
    // Fetch implementation
  };

  useEffect(() => {
    if (params.enabled !== false) {
      fetchQuizzes();
    }
  }, [params.page, params.visibility, params.enabled]);

  return { data, isLoading, error, refetch: fetchQuizzes };
}
```

**Verification**: Hook returns correct data structure, handles errors, loading states work

### Step 4: Implement useDashboard Hook

**Tasks**:
1. Create `src/hooks/useDashboard.ts`
2. Implement tab state management
3. Integrate two instances of `useQuizList` (one for each tab)
4. Manage pagination state for both tabs
5. Implement tab switching logic
6. Implement page navigation logic
7. Add client-side filtering for "My Quizzes" (if needed)
8. Get current user ID from auth session

**Code Outline**:
```typescript
export function useDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('my-quizzes');
  const [myQuizzesPage, setMyQuizzesPage] = useState(1);
  const [publicQuizzesPage, setPublicQuizzesPage] = useState(1);

  const myQuizzesQuery = useQuizList({
    page: myQuizzesPage,
    enabled: activeTab === 'my-quizzes',
  });

  const publicQuizzesQuery = useQuizList({
    visibility: 'public',
    page: publicQuizzesPage,
    enabled: activeTab === 'public-quizzes',
  });

  // ... rest of implementation

  return {
    activeTab,
    setActiveTab,
    myQuizzes: myQuizzesQuery,
    publicQuizzes: publicQuizzesQuery,
    goToPage,
    // ...
  };
}
```

**Verification**: Hook manages state correctly, tab switching works, pagination independent per tab

### Step 5: Implement Presentational Components

**Tasks**:

1. **PageHeader.tsx**:
   - Simple component with title and description
   - No complex logic

2. **LoadingSpinner.tsx** (or use existing from ui):
   - Centered spinner with optional message
   - Different size variants

3. **ErrorAlert.tsx**:
   - Use Shadcn/ui Alert component
   - Add retry and dismiss buttons
   - Destructive variant for errors

4. **EmptyState.tsx**:
   - Centered layout with icon
   - Contextual messages based on type
   - Optional CTA button

**Verification**: Components render correctly in isolation, accept props as defined

### Step 6: Implement QuizCard Component

**Tasks**:
1. Create `src/components/Dashboard/QuizCard.tsx`
2. Use Shadcn/ui Card component as base
3. Display quiz information:
   - Title
   - Description (truncated)
   - Creation date (formatted)
   - Visibility badge
   - Source badge (AI/manual)
   - Question count (if available)
4. Add hover effects
5. Implement click handler for navigation
6. Handle long text with truncation
7. Add accessibility attributes (aria-label, role)

**Code Outline**:
```typescript
export function QuizCard({ quiz, onClick }: QuizCardProps) {
  const formattedDate = formatDistanceToNow(new Date(quiz.created_at));

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onClick?.(quiz.id)}
    >
      <CardHeader>
        <CardTitle>{quiz.title}</CardTitle>
        <div className="flex gap-2 mt-2">
          <Badge>{quiz.visibility}</Badge>
          {quiz.source === 'ai_generated' && <Badge variant="secondary">AI</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {quiz.description}
        </p>
      </CardContent>
      <CardFooter>
        <span className="text-xs text-muted-foreground">
          Created {formattedDate}
        </span>
      </CardFooter>
    </Card>
  );
}
```

**Verification**: Card displays correctly, click works, styling matches design, responsive

### Step 7: Implement PaginationControls Component

**Tasks**:
1. Create `src/components/Dashboard/PaginationControls.tsx`
2. Use Shadcn/ui Pagination components
3. Implement Previous/Next buttons
4. Implement page number buttons (with ellipsis for many pages)
5. Disable buttons at boundaries
6. Highlight current page
7. Handle click events
8. Disable all controls when loading (via prop)

**Code Outline**:
```typescript
export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  disabled
}: PaginationControlsProps) {
  const pages = generatePageNumbers(currentPage, totalPages);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || disabled}
          />
        </PaginationItem>

        {pages.map((page, idx) => (
          page === '...' ? (
            <PaginationEllipsis key={`ellipsis-${idx}`} />
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => onPageChange(Number(page))}
                isActive={page === currentPage}
                disabled={disabled}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        ))}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || disabled}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
```

**Verification**: Pagination works, buttons disabled correctly, page changes trigger callback

### Step 8: Implement QuizList Component

**Tasks**:
1. Create `src/components/Dashboard/QuizList.tsx`
2. Implement responsive grid layout (1 col mobile, 2 tablet, 3 desktop)
3. Map over quizzes and render QuizCard components
4. Pass click handler to cards
5. Render PaginationControls at bottom
6. Handle empty array gracefully

**Code Outline**:
```typescript
export function QuizList({
  quizzes,
  pagination,
  onPageChange,
  onQuizClick
}: QuizListProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.map(quiz => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            onClick={onQuizClick}
          />
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <PaginationControls
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
```

**Verification**: Grid layout responsive, cards render, pagination shows when needed

### Step 9: Implement QuizListTabs Component

**Tasks**:
1. Create `src/components/Dashboard/QuizListTabs.tsx`
2. Use Shadcn/ui Tabs components
3. Implement two tabs: "My Quizzes" and "Public Quizzes"
4. Handle tab change events
5. Ensure keyboard navigation works (handled by Shadcn/ui)
6. Add proper ARIA labels

**Code Outline**:
```typescript
export function QuizListTabs({
  activeTab,
  onTabChange
}: QuizListTabsProps) {
  return (
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger
        value="my-quizzes"
        onClick={() => onTabChange('my-quizzes')}
      >
        My Quizzes
      </TabsTrigger>
      <TabsTrigger
        value="public-quizzes"
        onClick={() => onTabChange('public-quizzes')}
      >
        Public Quizzes
      </TabsTrigger>
    </TabsList>
  );
}
```

**Verification**: Tabs switch correctly, keyboard navigation works, styling correct

### Step 10: Implement DashboardContainer Component

**Tasks**:
1. Create `src/components/Dashboard/DashboardContainer.tsx`
2. Use `useDashboard` hook to get state and actions
3. Implement conditional rendering logic:
   - Show loading spinner when loading
   - Show error alert when error exists
   - Show empty state when no quizzes
   - Show quiz list when data exists
4. Implement tab switching
5. Implement pagination
6. Implement quiz card click navigation
7. Implement error retry
8. Connect all child components

**Code Outline**:
```typescript
export function DashboardContainer() {
  const {
    activeTab,
    setActiveTab,
    myQuizzes,
    publicQuizzes,
    goToPage,
    refetchMyQuizzes,
    refetchPublicQuizzes,
  } = useDashboard();

  const currentData = activeTab === 'my-quizzes' ? myQuizzes : publicQuizzes;
  const refetch = activeTab === 'my-quizzes' ? refetchMyQuizzes : refetchPublicQuizzes;

  const handleQuizClick = (quizId: string) => {
    window.location.href = `/quizzes/${quizId}`;
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Dashboard"
        description="Manage and explore quizzes"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <QuizListTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <TabsContent value="my-quizzes" className="mt-6">
          {myQuizzes.isLoading && <LoadingSpinner />}
          {myQuizzes.error && (
            <ErrorAlert
              message={myQuizzes.error}
              onRetry={refetchMyQuizzes}
            />
          )}
          {!myQuizzes.isLoading && !myQuizzes.error && myQuizzes.data?.quizzes.length === 0 && (
            <EmptyState type="my-quizzes" />
          )}
          {myQuizzes.data && myQuizzes.data.quizzes.length > 0 && (
            <QuizList
              quizzes={myQuizzes.data.quizzes}
              pagination={myQuizzes.data.pagination}
              onPageChange={goToPage}
              onQuizClick={handleQuizClick}
            />
          )}
        </TabsContent>

        <TabsContent value="public-quizzes" className="mt-6">
          {/* Similar structure for public quizzes */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Verification**: All components work together, state management correct, interactions work

### Step 11: Create Astro Page

**Tasks**:
1. Create `src/pages/dashboard.astro`
2. Import DashboardLayout (or create if doesn't exist)
3. Import DashboardContainer
4. Add `client:load` directive to hydrate React component
5. Set page metadata (title, description)

**Code**:
```astro
---
import DashboardLayout from '@/layouts/DashboardLayout.astro';
import DashboardContainer from '@/components/Dashboard/DashboardContainer';

// Page will be protected by middleware
---

<DashboardLayout
  title="Dashboard | QuizStack"
  description="View and manage your quizzes"
>
  <DashboardContainer client:load />
</DashboardLayout>
```

**Verification**: Page accessible at `/dashboard`, React components hydrate correctly

### Step 12: Update Middleware for Auth Check

**Tasks**:
1. Open `src/middleware/index.ts`
2. Add `/dashboard` to protected routes
3. Redirect to `/login` if not authenticated
4. Pass session to page context

**Code Outline**:
```typescript
export async function onRequest(context, next) {
  const { url, locals } = context;

  // Protected routes
  const protectedRoutes = ['/dashboard', '/quizzes/create', '/profile'];

  if (protectedRoutes.some(route => url.pathname.startsWith(route))) {
    const { data: { session } } = await locals.supabase.auth.getSession();

    if (!session) {
      return Response.redirect(
        new URL(`/login?redirect=${url.pathname}`, url.origin)
      );
    }
  }

  return next();
}
```

**Verification**: Unauthenticated users redirected, authenticated users can access dashboard

### Step 13: Add Navigation Links

**Tasks**:
1. Update site navigation (header/sidebar) to include "Dashboard" link
2. Ensure link is only visible to authenticated users
3. Highlight active state when on dashboard page

**Verification**: Navigation link visible and functional, styling correct

### Step 14: Testing

**Tasks**:

1. **Unit Tests**:
   - Test `useQuizList` hook with different parameters
   - Test `useDashboard` hook state management
   - Test component rendering with different props
   - Test pagination logic
   - Test error handling

2. **Integration Tests**:
   - Test full user flow: login → dashboard → tab switch → pagination
   - Test error scenarios (network error, 401, 500)
   - Test empty states
   - Test quiz card navigation

3. **Manual Testing**:
   - Test on different browsers (Chrome, Firefox, Safari)
   - Test on different screen sizes (mobile, tablet, desktop)
   - Test keyboard navigation
   - Test with screen reader (accessibility)
   - Test with slow network (throttling)
   - Test with different data volumes (0, 5, 50+ quizzes)

4. **Edge Cases**:
   - User with no quizzes
   - User with exactly 10 quizzes (1 page)
   - User with 11 quizzes (2 pages)
   - No public quizzes available
   - API returns error intermittently
   - Session expires while on page

**Verification**: All tests pass, no console errors, UI works as expected

### Step 15: Performance Optimization

**Tasks**:
1. Implement React.memo for components that don't need frequent re-renders
2. Optimize re-renders with useMemo and useCallback
3. Consider implementing virtual scrolling for very long lists (future)
4. Add caching for API responses (using React Query or SWR)
5. Lazy load images in quiz cards
6. Preload next page of results (optional)

**Code Example**:
```typescript
const QuizCard = React.memo(({ quiz, onClick }: QuizCardProps) => {
  // Component implementation
});

// In useDashboard
const handleQuizClick = useCallback((quizId: string) => {
  window.location.href = `/quizzes/${quizId}`;
}, []);
```

**Verification**: Page loads fast, smooth interactions, no unnecessary re-renders

### Step 16: Accessibility Audit

**Tasks**:
1. Run Lighthouse accessibility audit
2. Ensure all interactive elements are keyboard accessible
3. Verify screen reader announces content correctly
4. Check color contrast ratios
5. Add proper ARIA labels where needed
6. Ensure focus indicators are visible
7. Test with keyboard only (no mouse)

**Verification**: Lighthouse score >90, keyboard navigation works, screen reader friendly

### Step 17: Documentation

**Tasks**:
1. Add JSDoc comments to all components and hooks
2. Document props interfaces with descriptions
3. Add README in Dashboard component directory
4. Document API integration patterns
5. Add inline comments for complex logic

**Verification**: Code is well-documented, new developers can understand it

### Step 18: Backend Enhancement (Optional)

**Tasks**:
1. Modify GET /api/quizzes endpoint to support `owned=true` parameter
2. Add `question_count` field to QuizDTO response
3. Update endpoint documentation
4. Test new parameters

**Verification**: Endpoint returns correct data with new parameters

### Step 19: Final Review and Deployment

**Tasks**:
1. Code review with team
2. Address any feedback
3. Merge feature branch to main
4. Deploy to staging environment
5. Run smoke tests on staging
6. Deploy to production
7. Monitor for errors

**Verification**: Dashboard live in production, no errors, metrics looking good

---

## Additional Considerations

### Future Enhancements

1. **Search Functionality**: Add search bar to filter quizzes by title
2. **Sorting Options**: Allow users to sort by date, title, or popularity
3. **Filters**: Add more granular filters (by topic, difficulty, etc.)
4. **Bulk Actions**: Select multiple quizzes for bulk delete/archive
5. **Quiz Analytics**: Show stats like completion rate, average score
6. **Favorites**: Allow users to favorite public quizzes
7. **Recent Activity**: Show recently taken or recently created quizzes
8. **Infinite Scroll**: Replace pagination with infinite scroll
9. **Quiz Previews**: Hover to see quiz preview without clicking
10. **Drag and Drop**: Reorder quizzes in "My Quizzes"

### Performance Metrics

Monitor the following metrics post-deployment:
- Page load time (target: <2s)
- Time to interactive (target: <3s)
- API response time (target: <300ms)
- Error rate (target: <1%)
- User engagement (tabs switched, pages viewed)

### Accessibility Compliance

Ensure compliance with:
- WCAG 2.1 Level AA standards
- Keyboard navigation support
- Screen reader compatibility
- Color contrast requirements
- Focus management

### Browser Support

Test and ensure compatibility with:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Dependencies

Key dependencies for this implementation:
- React 19
- Astro 5
- Tailwind CSS 4
- Shadcn/ui components
- date-fns (for date formatting)
- TypeScript 5

Ensure all dependencies are up to date and security patches applied.
