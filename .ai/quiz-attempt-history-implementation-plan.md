# View Implementation Plan: Quiz Attempt History Table

## 1. Overview

The Quiz Attempt History Table displays a historical record of all attempts a user has made for a specific quiz. This feature allows users to track their progress over time, compare scores across multiple attempts, and access detailed results for any previous attempt. The view is integrated into the quiz detail page or quiz taking flow, providing context-aware access to attempt history.

The view implements:
- **Attempts Table**: Chronological list of all attempts with key metrics
- **Score Tracking**: Visual indicators showing score progression
- **Quick Stats**: Best score, average score, total attempts, improvement trend
- **Direct Access**: Click any attempt to view detailed results
- **Responsive Design**: Table adapts to mobile (card view) and desktop (table view)
- **Empty State**: Encouraging message for first-time takers

This feature supports US-007 by allowing users to see "The result is displayed upon completion for all users" and extends it by providing historical context for authenticated users who have taken a quiz multiple times.

## 2. Navigation in Astro

This implementation uses Astro's client-side navigation for smooth transitions between attempt history and detailed results.

### 2.1 Client-Side Navigation API

**Using navigate() for programmatic navigation:**
```typescript
import { navigate } from 'astro:transitions/client';

// Navigate to detailed results for specific attempt
navigate(`/quizzes/${quizId}/results?attemptId=${attemptId}`);

// Navigate back to quiz detail page
navigate(`/quizzes/${quizId}`);

// Navigate to take quiz again
navigate(`/quizzes/${quizId}/take`);
```

**Key benefits:**
- No full page reload when viewing different attempts
- Smooth transitions with View Transitions API
- Maintains context during navigation
- Better performance than full page reloads

### 2.2 Using Links for Better Accessibility

For navigation elements, prefer native `<a>` tags:

```typescript
// ✅ Better approach - semantic HTML with accessibility
<TableRow asChild>
  <a href={`/quizzes/${quizId}/results?attemptId=${attempt.id}`}>
    {/* row content */}
  </a>
</TableRow>

// ✅ Also good for buttons
<Button asChild>
  <a href={`/quizzes/${quizId}/take`}>
    Retry Quiz
  </a>
</Button>
```

### 2.3 View Transitions Setup

Ensure your layout includes View Transitions for smooth animations between history → detailed results:

```astro
---
// src/layouts/Layout.astro
import { ViewTransitions } from 'astro:transitions';
---
<html>
  <head>
    <ViewTransitions />
  </head>
  <body>
    <slot />
  </body>
</html>
```

## 3. View Routing

**Integration Options**:

### Option A: Embedded in Quiz Detail Page (Recommended)
- **Path**: `/quizzes/:quizId` (existing page)
- **Location**: Section below quiz description, above "Take Quiz" button
- **Visibility**: Only shown to authenticated users who have attempts
- **Pros**: Contextual, no additional route, better UX
- **Cons**: Makes quiz detail page longer

### Option B: Dedicated History Page
- **Path**: `/quizzes/:quizId/history`
- **Location**: Separate page
- **Visibility**: Link from quiz detail page
- **Pros**: Cleaner separation, dedicated space
- **Cons**: Additional navigation step

**Recommendation**: Use **Option A** (embedded) as it provides better context and reduces clicks.

**Access Control**:
- Visible only to authenticated users
- Users can only see their own attempts
- Anonymous users see encouragement to sign up to track progress

**Route Configuration**:
```typescript
// In existing src/pages/quizzes/[id].astro
// Add QuizAttemptHistory component conditionally
```

## 4. Component Structure

```
QuizDetailPage (Astro - src/pages/quizzes/[id].astro) [EXISTING]
└── Layout (Astro - uses existing Layout.astro)
    └── QuizDetailContainer (React) [EXISTING]
        ├── [Existing quiz detail components...]
        └── QuizAttemptHistory (React - src/components/QuizAttempts/QuizAttemptHistory.tsx) [NEW]
            ├── AttemptHistoryHeader (React - src/components/QuizAttempts/AttemptHistoryHeader.tsx)
            │   ├── Section title ("Your Attempt History")
            │   └── QuickStats (React - src/components/QuizAttempts/QuickStats.tsx)
            │       ├── Best Score badge
            │       ├── Average Score
            │       ├── Total Attempts
            │       └── Improvement Indicator (trend)
            ├── LoadingSpinner (React - src/components/ui/LoadingSpinner.tsx) [conditional]
            ├── ErrorAlert (React - src/components/ui/Alert.tsx) [conditional]
            ├── EmptyState (React - src/components/QuizAttempts/EmptyState.tsx) [conditional]
            │   ├── Message: "No attempts yet"
            │   └── CTA: "Take this quiz to see your progress"
            └── AttemptsTable (React - src/components/QuizAttempts/AttemptsTable.tsx) [conditional]
                ├── Table (Shadcn/ui) [desktop view]
                │   ├── TableHeader
                │   │   ├── Attempt # column
                │   │   ├── Date column
                │   │   ├── Score column
                │   │   ├── Time Taken column (optional)
                │   │   └── Actions column
                │   └── TableBody
                │       └── AttemptRow (React - src/components/QuizAttempts/AttemptRow.tsx) [multiple]
                │           ├── Attempt number (e.g., "#3")
                │           ├── Formatted date (e.g., "Jan 20, 2025")
                │           ├── Score with visual indicator (e.g., "80%" with color)
                │           ├── Time taken (e.g., "12 min")
                │           └── "View Details" button
                └── AttemptCards (React) [mobile view]
                    └── AttemptCard (React - src/components/QuizAttempts/AttemptCard.tsx) [multiple]
                        ├── All attempt info in card format
                        └── Clickable to view details
```

## 5. Component Details

### 5.1 QuizAttemptHistory (React)

**Description**: Main container component for the attempt history section. Orchestrates data fetching, loading states, and conditional rendering of child components.

**Main Elements**:
- `<AttemptHistoryHeader />` with quick stats
- Conditional rendering based on state:
  - Loading: `<LoadingSpinner />`
  - Error: `<ErrorAlert />`
  - No attempts: `<EmptyState />`
  - Has attempts: `<AttemptsTable />`

**Handled Events**:
- `onRetry`: Retry fetching data after error
- `onViewDetails`: Navigate to detailed results

**Validation**:
- Check user is authenticated
- Validate quiz ID exists

**Types**:
- `QuizAttemptHistoryState` (ViewModel)
- `QuizAttemptSummary[]` (list of attempts)

**Props**:
```typescript
interface QuizAttemptHistoryProps {
  quizId: string;
  userId?: string; // Current authenticated user
}
```

**State Management**:
- Uses `useQuizAttemptHistory` custom hook
- Manages loading, error, and attempts data

**Implementation Notes**:
```typescript
export function QuizAttemptHistory({ quizId, userId }: QuizAttemptHistoryProps) {
  const {
    attempts,
    quickStats,
    isLoading,
    error,
    refetch
  } = useQuizAttemptHistory(quizId, userId);

  // Don't render for unauthenticated users
  if (!userId) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="mt-8 border-t pt-8">
        <LoadingSpinner message="Loading your attempt history..." />
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-8 border-t pt-8">
        <ErrorAlert
          title="Failed to Load History"
          message={error}
          onRetry={refetch}
        />
      </section>
    );
  }

  if (attempts.length === 0) {
    return (
      <section className="mt-8 border-t pt-8">
        <h2 className="text-2xl font-semibold mb-4">Your Attempt History</h2>
        <EmptyState quizId={quizId} />
      </section>
    );
  }

  return (
    <section className="mt-8 border-t pt-8">
      <AttemptHistoryHeader quickStats={quickStats} />
      <AttemptsTable attempts={attempts} quizId={quizId} />
    </section>
  );
}
```

### 5.2 AttemptHistoryHeader (React)

**Description**: Header section with title and quick statistics about the user's performance across all attempts.

**Main Elements**:
- `<h2>` Section title
- `<QuickStats />` component with summary metrics

**Handled Events**: None

**Validation**: None

**Types**:
- `QuickStatsData` (ViewModel)

**Props**:
```typescript
interface AttemptHistoryHeaderProps {
  quickStats: QuickStatsData;
}
```

**Implementation Notes**:
```typescript
export function AttemptHistoryHeader({ quickStats }: AttemptHistoryHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold mb-4">Your Attempt History</h2>
      <QuickStats stats={quickStats} />
    </div>
  );
}
```

### 5.3 QuickStats (React)

**Description**: Summary statistics displayed as badges/cards showing key metrics across all attempts.

**Main Elements**:
- Grid/flex layout with 4 stat items
- Best Score (with trophy icon for 100%)
- Average Score (with average indicator)
- Total Attempts (count)
- Improvement Trend (arrow up/down/flat)

**Handled Events**: None

**Validation**: None

**Types**:
- `QuickStatsData` (ViewModel)

**Props**:
```typescript
interface QuickStatsProps {
  stats: QuickStatsData;
}

interface QuickStatsData {
  bestScore: number;
  averageScore: number;
  totalAttempts: number;
  trend: 'improving' | 'declining' | 'stable';
  trendValue: number; // Percentage change from first to last
}
```

**Implementation Notes**:
```typescript
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function QuickStats({ stats }: QuickStatsProps) {
  const getTrendIcon = () => {
    if (stats.trend === 'improving') return <TrendingUp className="text-success" />;
    if (stats.trend === 'declining') return <TrendingDown className="text-destructive" />;
    return <Minus className="text-muted-foreground" />;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-2">
          {stats.bestScore === 100 && <Trophy className="h-5 w-5 text-yellow-500" />}
          <div>
            <div className="text-sm text-muted-foreground">Best Score</div>
            <div className="text-2xl font-bold text-primary">{stats.bestScore}%</div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm text-muted-foreground">Average Score</div>
        <div className="text-2xl font-bold">{stats.averageScore}%</div>
      </Card>

      <Card className="p-4">
        <div className="text-sm text-muted-foreground">Total Attempts</div>
        <div className="text-2xl font-bold">{stats.totalAttempts}</div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <div>
            <div className="text-sm text-muted-foreground">Trend</div>
            <div className="text-lg font-semibold">
              {stats.trend === 'improving' && `+${stats.trendValue}%`}
              {stats.trend === 'declining' && `${stats.trendValue}%`}
              {stats.trend === 'stable' && 'Stable'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

### 5.4 AttemptsTable (React)

**Description**: Responsive table component that displays all attempts. Shows as a table on desktop and cards on mobile.

**Main Elements**:
- Desktop: `<Table>` from Shadcn/ui with headers and rows
- Mobile: Grid of `<AttemptCard>` components
- Responsive wrapper that switches between views

**Handled Events**:
- Row/card click to view details

**Validation**: None

**Types**:
- `QuizAttemptSummary[]` (from types.ts or ViewModel)

**Props**:
```typescript
interface AttemptsTableProps {
  attempts: QuizAttemptSummary[];
  quizId: string;
}
```

**Implementation Notes**:
```typescript
export function AttemptsTable({ attempts, quizId }: AttemptsTableProps) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Attempt</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-32">Score</TableHead>
              <TableHead className="w-32">Time Taken</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attempts.map((attempt, index) => (
              <AttemptRow
                key={attempt.id}
                attempt={attempt}
                attemptNumber={attempts.length - index}
                quizId={quizId}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {attempts.map((attempt, index) => (
          <AttemptCard
            key={attempt.id}
            attempt={attempt}
            attemptNumber={attempts.length - index}
            quizId={quizId}
          />
        ))}
      </div>
    </>
  );
}
```

### 5.5 AttemptRow (React)

**Description**: Individual table row component displaying a single attempt's summary data.

**Main Elements**:
- `<TableRow>` from Shadcn/ui
- Attempt number cell (e.g., "#3")
- Date cell (formatted)
- Score cell (with color-coded badge)
- Time taken cell (formatted duration)
- Actions cell (View Details button)

**Handled Events**:
- `onClick`: Navigate to detailed results

**Validation**: None

**Types**:
- `QuizAttemptSummary` (ViewModel)

**Props**:
```typescript
interface AttemptRowProps {
  attempt: QuizAttemptSummary;
  attemptNumber: number;
  quizId: string;
}
```

**Implementation Notes**:
```typescript
import { format, formatDistanceToNow } from 'date-fns';
import { Eye } from 'lucide-react';

export function AttemptRow({ attempt, attemptNumber, quizId }: AttemptRowProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success bg-success/10';
    if (score >= 60) return 'text-primary bg-primary/10';
    return 'text-destructive bg-destructive/10';
  };

  const formatTimeTaken = (startedAt: string, completedAt: string) => {
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);

    if (diffMins === 0) return `${diffSecs}s`;
    return `${diffMins}m ${diffSecs}s`;
  };

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50">
      <TableCell className="font-medium">#{attemptNumber}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span>{format(new Date(attempt.completed_at), 'MMM d, yyyy')}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(attempt.completed_at), { addSuffix: true })}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={getScoreColor(attempt.score)}>
          {attempt.score}%
        </Badge>
      </TableCell>
      <TableCell>
        {formatTimeTaken(attempt.started_at, attempt.completed_at)}
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="sm" asChild>
          <a href={`/quizzes/${quizId}/results?attemptId=${attempt.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </a>
        </Button>
      </TableCell>
    </TableRow>
  );
}
```

### 5.6 AttemptCard (React)

**Description**: Mobile-optimized card component displaying a single attempt's summary data.

**Main Elements**:
- `<Card>` from Shadcn/ui
- All attempt information in vertical layout
- Clickable card to view details

**Handled Events**:
- `onClick`: Navigate to detailed results

**Validation**: None

**Types**:
- `QuizAttemptSummary` (ViewModel)

**Props**:
```typescript
interface AttemptCardProps {
  attempt: QuizAttemptSummary;
  attemptNumber: number;
  quizId: string;
}
```

**Implementation Notes**:
```typescript
export function AttemptCard({ attempt, attemptNumber, quizId }: AttemptCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    return 'text-destructive';
  };

  return (
    <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" asChild>
      <a href={`/quizzes/${quizId}/results?attemptId=${attempt.id}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">
            Attempt #{attemptNumber}
          </span>
          <Badge className={getScoreColor(attempt.score)}>
            {attempt.score}%
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date:</span>
            <span>{format(new Date(attempt.completed_at), 'MMM d, yyyy')}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Time Taken:</span>
            <span>{formatTimeTaken(attempt.started_at, attempt.completed_at)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Score:</span>
            <span className="font-semibold">
              {attempt.correct_answers}/{attempt.total_questions} correct
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t flex items-center justify-center text-primary">
          <Eye className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">View Details</span>
        </div>
      </a>
    </Card>
  );
}
```

### 5.7 EmptyState (React)

**Description**: Empty state component shown when user has no attempts for this quiz.

**Main Elements**:
- Icon or illustration
- Message encouraging first attempt
- Call-to-action button to take quiz

**Handled Events**:
- `onClick`: Navigate to quiz taking page

**Validation**: None

**Types**: None

**Props**:
```typescript
interface EmptyStateProps {
  quizId: string;
}
```

**Implementation Notes**:
```typescript
import { ClipboardList } from 'lucide-react';

export function EmptyState({ quizId }: EmptyStateProps) {
  return (
    <div className="text-center py-12 bg-muted/30 rounded-lg">
      <ClipboardList className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">No Attempts Yet</h3>
      <p className="text-muted-foreground mb-6">
        Take this quiz to track your progress and see your improvement over time.
      </p>
      <Button asChild>
        <a href={`/quizzes/${quizId}/take`}>
          Take Your First Quiz
        </a>
      </Button>
    </div>
  );
}
```

### 5.8 LoadingSpinner (React)

**Description**: Loading state indicator shown while attempt data is being fetched.

**Usage**: Reuse existing component from `src/components/ui/LoadingSpinner.tsx`

### 5.9 ErrorAlert (React)

**Description**: Error display component for failed data fetching.

**Usage**: Reuse existing component from `src/components/ui/Alert.tsx`

## 6. Types

### 6.1 Existing Types (from src/types.ts)

**QuizAttemptDTO**: Complete quiz attempt information
```typescript
interface QuizAttemptDTO {
  id: string;
  quiz_id: string;
  user_id: string | null;
  started_at: string; // ISO8601 timestamp
  completed_at: string | null; // ISO8601 timestamp
  score: number; // 0-100 percentage
  total_questions: number;
  correct_answers: number;
  created_at: string;
  updated_at: string;
}
```

### 6.2 New ViewModel Types

**QuizAttemptSummary**: Simplified attempt data for table display
```typescript
interface QuizAttemptSummary {
  id: string;
  quiz_id: string;
  started_at: string;
  completed_at: string;
  score: number;
  total_questions: number;
  correct_answers: number;
}
```

**QuickStatsData**: Summary statistics across all attempts
```typescript
interface QuickStatsData {
  bestScore: number; // Highest score percentage
  averageScore: number; // Average of all scores
  totalAttempts: number; // Count of attempts
  trend: 'improving' | 'declining' | 'stable';
  trendValue: number; // Percentage change (last vs first)
}
```

**QuizAttemptHistoryState**: Overall state for attempt history
```typescript
interface QuizAttemptHistoryState {
  attempts: QuizAttemptSummary[];
  quickStats: QuickStatsData | null;
  isLoading: boolean;
  error: string | null;
}
```

### 6.3 API Response Types

**QuizAttemptsListResponse**: API response for GET /api/quizzes/:quizId/attempts
```typescript
interface QuizAttemptsListResponse {
  attempts: QuizAttemptDTO[];
  stats: {
    best_score: number;
    average_score: number;
    total_attempts: number;
  };
}
```

## 7. State Management

### 7.1 Overview

State management for the Quiz Attempt History is handled through a custom React hook (`useQuizAttemptHistory`) that fetches and computes all necessary data.

### 7.2 Custom Hook: useQuizAttemptHistory

**Purpose**: Fetch user's attempt history for a specific quiz and compute summary statistics.

**Location**: `src/hooks/useQuizAttemptHistory.ts`

**Hook Signature**:
```typescript
function useQuizAttemptHistory(
  quizId: string,
  userId?: string
): {
  // Data
  attempts: QuizAttemptSummary[];
  quickStats: QuickStatsData | null;

  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  refetch: () => Promise<void>;
}
```

**Internal State**:
- `attempts`: List of all attempts for this quiz by this user
- `quickStats`: Computed statistics
- `isLoading`: Loading state
- `error`: Error message if fetch fails

**Dependencies**:
- Uses `fetch` API to call GET /api/quizzes/:quizId/attempts
- Uses `useMemo` to compute quickStats from attempts data
- Uses `useEffect` to fetch data on mount

**Behavior**:
- Only fetches if userId is provided (authenticated)
- Returns empty array for unauthenticated users
- Computes trend by comparing last 3 attempts vs first 3 attempts
- Sorts attempts by date (newest first)

**Implementation Outline**:
```typescript
import { useState, useEffect, useMemo } from 'react';
import { navigate } from 'astro:transitions/client';

export function useQuizAttemptHistory(quizId: string, userId?: string) {
  const [attempts, setAttempts] = useState<QuizAttemptSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttempts = async () => {
    if (!userId) {
      // No user, no attempts
      setAttempts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quizzes/${quizId}/attempts`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          throw new Error('Authentication required');
        }
        throw new Error('Failed to load attempt history');
      }

      const data: QuizAttemptsListResponse = await response.json();

      // Sort by date, newest first
      const sortedAttempts = data.attempts.sort((a, b) =>
        new Date(b.completed_at || b.created_at).getTime() -
        new Date(a.completed_at || a.created_at).getTime()
      );

      setAttempts(sortedAttempts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, [quizId, userId]);

  // Compute quick stats
  const quickStats = useMemo<QuickStatsData | null>(() => {
    if (attempts.length === 0) return null;

    const scores = attempts.map(a => a.score);
    const bestScore = Math.max(...scores);
    const averageScore = Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    );

    // Calculate trend (compare recent vs early attempts)
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    let trendValue = 0;

    if (attempts.length >= 2) {
      // Compare last attempt to first attempt
      const lastScore = attempts[0].score; // Newest (sorted desc)
      const firstScore = attempts[attempts.length - 1].score; // Oldest
      const diff = lastScore - firstScore;

      if (diff > 5) {
        trend = 'improving';
        trendValue = diff;
      } else if (diff < -5) {
        trend = 'declining';
        trendValue = diff;
      }
    }

    return {
      bestScore,
      averageScore,
      totalAttempts: attempts.length,
      trend,
      trendValue,
    };
  }, [attempts]);

  return {
    attempts,
    quickStats,
    isLoading,
    error,
    refetch: fetchAttempts,
  };
}
```

### 7.3 State Flow

1. **Component Mounts**:
   - QuizAttemptHistory renders on quiz detail page
   - useQuizAttemptHistory hook initializes
   - If authenticated: fetch attempts from API
   - If unauthenticated: return empty state (component returns null)

2. **Data Loading**:
   - isLoading = true
   - API call to GET /api/quizzes/:quizId/attempts
   - On success: set attempts, compute quickStats
   - On error: set error message
   - isLoading = false

3. **Data Display**:
   - If no attempts: show EmptyState
   - If has attempts: show QuickStats + AttemptsTable
   - Table/cards render from attempts array

4. **User Interaction**:
   - User clicks on attempt row/card
   - Navigate to `/quizzes/:quizId/results?attemptId={id}`
   - User views detailed results
   - Can navigate back (browser back button works)

5. **Error Recovery**:
   - Error occurs
   - ErrorAlert displays with retry button
   - User clicks retry
   - refetch() called
   - Process repeats from step 2

## 8. API Integration

### 8.1 Endpoint Details

**Endpoint**: `GET /api/quizzes/:quizId/attempts`

**Purpose**: Retrieve all attempts for a specific quiz by the authenticated user

**Authentication**: Required (only authenticated users can view attempt history)

**Path Parameters**:
```typescript
{
  quizId: string; // UUID of quiz
}
```

**Query Parameters**: None (user inferred from session)

**Response Type**: `QuizAttemptsListResponse`

**Response Structure**:
```typescript
{
  attempts: QuizAttemptDTO[],
  stats: {
    best_score: number,
    average_score: number,
    total_attempts: number
  }
}
```

**Example Response**:
```json
{
  "attempts": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "quiz_id": "223e4567-e89b-12d3-a456-426614174000",
      "user_id": "323e4567-e89b-12d3-a456-426614174000",
      "started_at": "2025-01-20T10:00:00Z",
      "completed_at": "2025-01-20T10:15:00Z",
      "score": 80,
      "total_questions": 10,
      "correct_answers": 8,
      "created_at": "2025-01-20T10:00:00Z",
      "updated_at": "2025-01-20T10:15:00Z"
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "quiz_id": "223e4567-e89b-12d3-a456-426614174000",
      "user_id": "323e4567-e89b-12d3-a456-426614174000",
      "started_at": "2025-01-18T14:00:00Z",
      "completed_at": "2025-01-18T14:12:00Z",
      "score": 70,
      "total_questions": 10,
      "correct_answers": 7,
      "created_at": "2025-01-18T14:00:00Z",
      "updated_at": "2025-01-18T14:12:00Z"
    }
  ],
  "stats": {
    "best_score": 80,
    "average_score": 75,
    "total_attempts": 2
  }
}
```

### 8.2 API Implementation

**Backend Endpoint**: `src/pages/api/quizzes/[quizId]/attempts/index.ts`

**Implementation Requirements**:
1. Validate user is authenticated
2. Validate quiz exists
3. Fetch all completed attempts by this user for this quiz
4. Compute stats (best, average, total)
5. Return structured response
6. Handle errors appropriately

**Pseudo-code**:
```typescript
export const GET: APIRoute = async ({ params, locals }) => {
  const { quizId } = params;
  const { supabase, user } = locals;

  // Check authentication
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Validate quiz exists
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('id', quizId)
      .single();

    if (quizError || !quiz) {
      return new Response(
        JSON.stringify({ error: 'Quiz not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all completed attempts by this user
    const { data: attempts, error: attemptsError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

    if (attemptsError) {
      throw attemptsError;
    }

    // Compute stats
    const scores = attempts.map(a => a.score);
    const stats = {
      best_score: scores.length > 0 ? Math.max(...scores) : 0,
      average_score: scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : 0,
      total_attempts: attempts.length,
    };

    return new Response(
      JSON.stringify({
        attempts: attempts || [],
        stats,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### 8.3 Error Response Handling

**401 Unauthorized** (Not authenticated):
```json
{
  "error": "Unauthorized",
  "message": "Authentication is required to view attempt history"
}
```
Action: Redirect to login page

**404 Not Found** (Quiz doesn't exist):
```json
{
  "error": "Not Found",
  "message": "Quiz not found"
}
```
Action: Display error alert

**500 Internal Server Error**:
```json
{
  "error": "Internal Server Error",
  "message": "Failed to retrieve attempt history"
}
```
Action: Display error alert with retry option

### 8.4 Loading States

- **Initial Load**: Show LoadingSpinner in history section
- **Retry**: Show LoadingSpinner, clear error state

## 9. User Interactions

### 9.1 View Quiz Detail Page with History

**Interaction**: Authenticated user views quiz detail page and sees their attempt history

**User Flow**:
1. User navigates to quiz detail page `/quizzes/:id`
2. Page loads with quiz info and description
3. If authenticated and has attempts: Attempt history section appears below
4. User sees quick stats (best score, average, total attempts, trend)
5. User sees table/cards of all attempts

**Expected Behavior**:
- History section only visible to authenticated users
- Seamlessly integrated into quiz detail page
- No additional click required to see history
- Empty state shown if no attempts

**Implementation**: Component conditionally rendered in quiz detail page

### 9.2 View Detailed Results for Specific Attempt

**Interaction**: User clicks on attempt row/card to view detailed results

**User Flow**:
1. User views attempt history table
2. User clicks on specific attempt row (or card on mobile)
3. Navigate to `/quizzes/:id/results?attemptId={id}`
4. Detailed results page loads showing question-by-question review
5. User can navigate back to quiz detail (browser back button)

**Expected Behavior**:
- Smooth navigation using Astro's client-side navigation
- Entire row/card is clickable for better UX
- Hover state indicates clickability
- Works with keyboard navigation (Tab + Enter)
- Opens in same tab (can open in new tab with Ctrl/Cmd+Click)

**Implementation**:
```typescript
// Using <a> tag for better accessibility
<TableRow asChild>
  <a href={`/quizzes/${quizId}/results?attemptId=${attempt.id}`}>
    {/* row content */}
  </a>
</TableRow>
```

### 9.3 Take First Quiz (Empty State)

**Interaction**: User with no attempts clicks CTA button in empty state

**User Flow**:
1. User views quiz detail page
2. Sees empty state: "No Attempts Yet"
3. Clicks "Take Your First Quiz" button
4. Navigate to `/quizzes/:id/take`
5. User takes quiz
6. After completion, results display
7. User returns to quiz detail page
8. History section now shows first attempt

**Expected Behavior**:
- Clear call-to-action for first-time users
- Smooth navigation to quiz taking page
- After completion, history updates automatically (on next page load)

### 9.4 Retry Quiz After Viewing History

**Interaction**: User wants to improve score after reviewing history

**User Flow**:
1. User views attempt history and sees their scores
2. User decides to retry to improve
3. User scrolls up to "Take Quiz" button (already on page)
4. Or: User clicks "View Details" on an attempt
5. On results page: clicks "Retry Quiz" button
6. Navigate to `/quizzes/:id/take`
7. User takes quiz again
8. New attempt added to history

**Expected Behavior**:
- History motivates users to retry and improve
- Clear path to retake quiz (button above history)
- New attempts appear at top of history list

### 9.5 Compare Scores Across Attempts

**Interaction**: User reviews their scores to track progress

**User Flow**:
1. User views attempt history table
2. User sees scores listed chronologically
3. Quick stats show overall progress (trend indicator)
4. User can visually compare scores across attempts
5. Color coding helps identify good vs poor performance

**Expected Behavior**:
- Easy to scan and compare scores
- Visual indicators (colors, badges) aid comparison
- Trend indicator shows if user is improving
- Sorted newest first for easy access to recent attempts

### 9.6 Error Recovery

**Interaction**: User encounters error loading history and retries

**User Flow**:
1. Page loads quiz detail
2. Attempt history fails to load (network error)
3. Error alert displays: "Failed to Load History"
4. User clicks "Retry" button
5. Data fetches again
6. History displays successfully

**Expected Behavior**:
- Clear error message
- Retry button available
- Error doesn't block rest of page (quiz info still visible)
- Successful retry clears error

## 10. Conditions and Validation

### 10.1 Authentication Check

**Condition**: User must be authenticated to view attempt history

**Validation Location**: Component level and API endpoint

**Implementation**:
```typescript
// In QuizAttemptHistory component
if (!userId) {
  return null; // Don't render for unauthenticated users
}

// In API endpoint
if (!user) {
  return new Response(
    JSON.stringify({ error: 'Authentication required' }),
    { status: 401 }
  );
}
```

**UI Impact**: History section not visible to anonymous users

### 10.2 Quiz Exists

**Condition**: Quiz must exist to fetch attempts

**Validation Location**: Backend API endpoint

**Implementation**:
```typescript
const { data: quiz } = await supabase
  .from('quizzes')
  .select('id')
  .eq('id', quizId)
  .single();

if (!quiz) {
  return new Response(
    JSON.stringify({ error: 'Quiz not found' }),
    { status: 404 }
  );
}
```

**UI Impact**: Error alert displayed if quiz not found

### 10.3 Completed Attempts Only

**Condition**: Only show completed attempts (not in-progress)

**Validation Location**: API query filter

**Implementation**:
```typescript
const { data: attempts } = await supabase
  .from('quiz_attempts')
  .select('*')
  .eq('quiz_id', quizId)
  .eq('user_id', user.id)
  .not('completed_at', 'is', null); // Filter for completed only
```

**UI Impact**: In-progress attempts not shown in history

### 10.4 Data Loading States

**Condition**: Cannot interact with history while data is loading

**Validation Location**: Component render logic

**Implementation**:
```typescript
if (isLoading) {
  return <LoadingSpinner message="Loading your attempt history..." />;
}
```

**UI Impact**: Show loading spinner, prevent interaction

### 10.5 Empty State Handling

**Condition**: Display empty state when user has no attempts

**Validation Location**: Component render logic

**Implementation**:
```typescript
if (attempts.length === 0 && !isLoading && !error) {
  return <EmptyState quizId={quizId} />;
}
```

**UI Impact**: Show encouragement message and CTA button

### 10.6 Error State Handling

**Condition**: Display error UI when data fetching fails

**Validation Location**: Component render logic

**Implementation**:
```typescript
if (error) {
  return (
    <ErrorAlert
      title="Failed to Load History"
      message={error}
      onRetry={refetch}
    />
  );
}
```

**UI Impact**: Show error alert with retry button

## 11. Error Handling

### 11.1 Error Categories

#### Authentication Errors (401)

**Scenario**: User session expired or unauthenticated user accessing protected endpoint

**Detection**: API returns 401 status code

**Handling**:
```typescript
import { navigate } from 'astro:transitions/client';

if (response.status === 401) {
  navigate('/login?redirect=/quizzes/${quizId}');
  return;
}
```

**User Experience**: Redirect to login, return to quiz page after login

#### Network Errors

**Scenario**: No internet connection

**Detection**: Fetch throws network error

**Handling**:
```typescript
catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    setError('Network error. Please check your connection.');
  }
}
```

**User Experience**: Error alert with network message and retry button

#### Server Errors (500)

**Scenario**: Database error or backend issue

**Detection**: API returns 500 status code

**Handling**:
```typescript
if (response.status === 500) {
  setError('Something went wrong. Please try again later.');
  console.error('Server error fetching attempts');
}
```

**User Experience**: User-friendly error message with retry option

#### Not Found Errors (404)

**Scenario**: Quiz doesn't exist

**Detection**: API returns 404 status code

**Handling**:
```typescript
if (response.status === 404) {
  setError('Quiz not found.');
}
```

**User Experience**: Error alert, suggest going back to quiz list

### 11.2 Error Display Patterns

#### Inline Errors (Recommended)

**Usage**: Show error within attempt history section

**Implementation**:
```typescript
if (error) {
  return (
    <section className="mt-8 border-t pt-8">
      <h2 className="text-2xl font-semibold mb-4">Your Attempt History</h2>
      <ErrorAlert
        message={error}
        onRetry={refetch}
      />
    </section>
  );
}
```

**Best For**: Non-critical errors that don't prevent viewing quiz info

### 11.3 Error Recovery Strategies

#### Manual Retry

**Implementation**:
```typescript
const handleRetry = async () => {
  setError(null);
  await refetch();
};
```

**User Action**: Click retry button in error alert

#### Silent Background Retry

**Implementation** (optional):
```typescript
useEffect(() => {
  if (error && retryCount < 3) {
    const timer = setTimeout(() => {
      refetch();
      setRetryCount(prev => prev + 1);
    }, 2000 * Math.pow(2, retryCount));

    return () => clearTimeout(timer);
  }
}, [error, retryCount]);
```

**User Experience**: Automatic retry with exponential backoff

### 11.4 Error Logging

**Implementation**:
```typescript
const logError = (error: Error, context: Record<string, any>) => {
  console.error('Quiz Attempt History Error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });

  // Send to error tracking service (e.g., Sentry)
  // sendToErrorTracking(error, context);
};
```

### 11.5 Edge Cases

#### No Completed Attempts (All In-Progress)

**Scenario**: User has started quizzes but not completed any

**Handling**: Show empty state (in-progress attempts filtered out)

#### Deleted Quiz

**Scenario**: Quiz deleted while user viewing page

**Handling**: 404 error from API, show error alert

#### Very Long History (100+ Attempts)

**Scenario**: User has taken quiz many times

**Handling** (future enhancement):
- Add pagination to table
- Show last 20 attempts by default
- "Load More" button or infinite scroll

## 12. Implementation Steps

### Step 1: Set Up Project Structure

**Tasks**:
1. Create component directories:
   ```
   src/components/QuizAttempts/
   ├── QuizAttemptHistory.tsx
   ├── AttemptHistoryHeader.tsx
   ├── QuickStats.tsx
   ├── AttemptsTable.tsx
   ├── AttemptRow.tsx
   ├── AttemptCard.tsx
   └── EmptyState.tsx
   ```

2. Create hooks directory (if doesn't exist):
   ```
   src/hooks/
   └── useQuizAttemptHistory.ts
   ```

3. Create types file:
   ```
   src/types/quiz-attempts.types.ts
   ```

**Verification**: Directory structure created, empty files in place

### Step 2: Define Types

**Tasks**:
1. Add new ViewModel types to `src/types/quiz-attempts.types.ts`:
   - `QuizAttemptSummary`
   - `QuickStatsData`
   - `QuizAttemptHistoryState`
   - `QuizAttemptsListResponse`

2. Export types from `src/types.ts` or `src/types/index.ts`

**Code**:
```typescript
// src/types/quiz-attempts.types.ts
export interface QuizAttemptSummary {
  id: string;
  quiz_id: string;
  started_at: string;
  completed_at: string;
  score: number;
  total_questions: number;
  correct_answers: number;
}

export interface QuickStatsData {
  bestScore: number;
  averageScore: number;
  totalAttempts: number;
  trend: 'improving' | 'declining' | 'stable';
  trendValue: number;
}

export interface QuizAttemptHistoryState {
  attempts: QuizAttemptSummary[];
  quickStats: QuickStatsData | null;
  isLoading: boolean;
  error: string | null;
}

export interface QuizAttemptsListResponse {
  attempts: QuizAttemptDTO[];
  stats: {
    best_score: number;
    average_score: number;
    total_attempts: number;
  };
}
```

**Verification**: TypeScript types compile without errors

### Step 3: Implement Backend API Endpoint

**Tasks**:
1. Create `src/pages/api/quizzes/[quizId]/attempts/index.ts`
2. Implement GET handler
3. Add authentication check
4. Fetch completed attempts for user
5. Compute stats
6. Return structured response
7. Handle errors (401, 404, 500)

**Code**: (See section 8.2 for full implementation)

**Verification**:
- Test with authenticated user: returns attempts
- Test with unauthenticated user: returns 401
- Test with invalid quizId: returns 404
- Test with user who has no attempts: returns empty array

### Step 4: Implement useQuizAttemptHistory Hook

**Tasks**:
1. Create `src/hooks/useQuizAttemptHistory.ts`
2. Implement fetch logic
3. Manage loading, error, and data states
4. Compute quickStats from attempts data
5. Handle authentication errors
6. Add TypeScript types

**Code**: (See section 7.2 for full implementation)

**Verification**: Hook returns correct data structure, computes stats correctly

### Step 5: Implement QuickStats Component

**Tasks**:
1. Create `src/components/QuizAttempts/QuickStats.tsx`
2. Display 4 stat cards in grid
3. Add icons (Trophy, TrendingUp, etc.)
4. Implement responsive layout
5. Add semantic colors

**Code**: (See section 5.3 for full implementation)

**Verification**: Stats display correctly with proper styling

### Step 6: Implement AttemptRow and AttemptCard Components

**Tasks**:
1. Create `src/components/QuizAttempts/AttemptRow.tsx` (desktop)
2. Create `src/components/QuizAttempts/AttemptCard.tsx` (mobile)
3. Display all attempt information
4. Add color-coded score badges
5. Format dates and durations
6. Make clickable (link to results)

**Code**: (See sections 5.5 and 5.6 for full implementations)

**Verification**: Rows and cards display correctly, clickable, responsive

### Step 7: Implement AttemptsTable Component

**Tasks**:
1. Create `src/components/QuizAttempts/AttemptsTable.tsx`
2. Implement responsive wrapper
3. Desktop: Use Shadcn/ui Table with headers
4. Mobile: Use card grid
5. Map over attempts and render row/card components

**Code**: (See section 5.4 for full implementation)

**Verification**: Table/cards switch correctly between mobile and desktop

### Step 8: Implement EmptyState Component

**Tasks**:
1. Create `src/components/QuizAttempts/EmptyState.tsx`
2. Add icon/illustration
3. Add encouraging message
4. Add CTA button to take quiz

**Code**: (See section 5.7 for full implementation)

**Verification**: Empty state displays correctly with working CTA

### Step 9: Implement AttemptHistoryHeader Component

**Tasks**:
1. Create `src/components/QuizAttempts/AttemptHistoryHeader.tsx`
2. Display section title
3. Integrate QuickStats component

**Code**: (See section 5.2 for full implementation)

**Verification**: Header displays with stats

### Step 10: Implement QuizAttemptHistory Container Component

**Tasks**:
1. Create `src/components/QuizAttempts/QuizAttemptHistory.tsx`
2. Use `useQuizAttemptHistory` hook
3. Implement conditional rendering:
   - Return null if no userId
   - Show LoadingSpinner when loading
   - Show ErrorAlert when error
   - Show EmptyState when no attempts
   - Show Header + Table when has attempts
4. Handle errors and retry

**Code**: (See section 5.1 for full implementation)

**Verification**: All conditional states work correctly

### Step 11: Integrate into Quiz Detail Page

**Tasks**:
1. Open existing `src/pages/quizzes/[id].astro` or `src/components/QuizDetail/QuizDetailContainer.tsx`
2. Import QuizAttemptHistory component
3. Add component below quiz description
4. Pass quizId and userId props
5. Add `client:load` directive if needed

**Code**:
```typescript
// In QuizDetailContainer or similar
import { QuizAttemptHistory } from '@/components/QuizAttempts/QuizAttemptHistory';

// ... existing quiz detail code ...

<QuizAttemptHistory
  quizId={quizId}
  userId={currentUser?.id}
/>
```

**Verification**: History section appears on quiz detail page for authenticated users

### Step 12: Testing

**Tasks**:

1. **Unit Tests**:
   - Test `useQuizAttemptHistory` hook
   - Test stats computation
   - Test date/duration formatting
   - Test component rendering

2. **Integration Tests**:
   - Test full flow: view quiz → see history → click attempt → view results
   - Test with 0, 1, and multiple attempts
   - Test authentication scenarios

3. **Manual Testing**:
   - Test on different browsers
   - Test on different screen sizes (table vs cards)
   - Test with different attempt counts
   - Test error scenarios
   - Test navigation flows

**Verification**: All tests pass, no console errors

### Step 13: Performance Optimization

**Tasks**:
1. Add React.memo to components
2. Optimize re-renders with useMemo/useCallback
3. Consider virtual scrolling for long lists (future)

**Verification**: No unnecessary re-renders

### Step 14: Accessibility Audit

**Tasks**:
1. Run Lighthouse audit
2. Test keyboard navigation
3. Test screen reader
4. Check color contrast
5. Add ARIA labels

**Verification**: Lighthouse score >90, keyboard accessible

### Step 15: Documentation

**Tasks**:
1. Add JSDoc comments
2. Document component props
3. Add README
4. Document API endpoint

**Verification**: Code well-documented

### Step 16: Deploy and Monitor

**Tasks**:
1. Code review
2. Merge to main
3. Deploy to staging
4. Test on staging
5. Deploy to production
6. Monitor for errors

**Verification**: Feature live and working

---

## Additional Considerations

### Future Enhancements

1. **Pagination**: For users with 50+ attempts
2. **Filtering**: Filter by date range, score range
3. **Sorting**: Sort by date, score, duration
4. **Charts**: Visual chart showing score progression over time
5. **Export**: Download attempt history as CSV
6. **Compare**: Side-by-side comparison of two attempts
7. **Time Stats**: Average time per question, fastest attempt
8. **Streaks**: Track consecutive attempts, best streak
9. **Achievements**: Badges for milestones (10 attempts, perfect score, etc.)
10. **Notes**: Allow users to add notes to specific attempts

### Performance Metrics

Monitor:
- API response time for attempts endpoint (<200ms)
- Component render time
- Table scroll performance
- Error rate

### Accessibility

Ensure:
- WCAG 2.1 Level AA compliance
- Keyboard navigation (Tab through rows)
- Screen reader announces table headers
- Color contrast for score badges

### Browser Support

Test on:
- Chrome, Firefox, Safari, Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Dependencies

Required:
- React 19
- Astro 5
- Tailwind CSS 4
- Shadcn/ui (Table, Card, Badge, Button)
- date-fns (date formatting)
- lucide-react (icons)

### Security

Considerations:
- Validate attempt ownership on backend
- Prevent enumeration attacks (don't reveal if quiz exists for non-attempts)
- Rate limit API endpoint
- Sanitize data before display

### Analytics

Track:
- How many users view attempt history
- Average attempts per quiz
- Retry rate after viewing history
- Most attempted quizzes
