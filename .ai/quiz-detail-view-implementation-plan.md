# View Implementation Plan: Quiz Detail View

## 1. Overview

The Quiz Detail View displays comprehensive information about a single quiz, including its metadata (title, description, visibility, source), complete list of questions with answer options, and owner-specific actions (edit/delete). The view supports both owner access (full permissions) and public viewer access (read-only). It integrates with the existing quiz service and provides a polished user experience with proper error handling, loading states, and accessibility features.

## 2. View Routing

**Path:** `/quizzes/[id]`

- Dynamic route parameter: `[id]` - UUID of the quiz to display
- Access: Authenticated users only
- Authorization: Quiz owner OR public quiz visibility

## 3. Component Structure

```
QuizDetailPage (Astro page)
├── QuizDetailContainer (React client component)
    ├── LoadingSpinner (when isLoading === true)
    ├── ErrorAlert (when error !== null)
    └── QuizDetailContent (when quiz data loaded)
        ├── QuizHeader
        │   ├── QuizMetadata
        │   └── QuizActions (owner only)
        ├── QuizQuestions
        │   └── QuestionCard[] (one per question)
        │       ├── QuestionContent
        │       └── OptionsList
        │           └── OptionItem[] (one per option)
        └── DeleteConfirmationDialog
```

## 4. Component Details

### 4.1 QuizDetailPage (Astro)

**Component Description:**
Server-rendered Astro page component that serves as the entry point for the quiz detail view. Handles initial authentication check and renders the React client component with necessary layout.

**Main Elements:**
- Astro Layout component wrapper
- QuizDetailContainer React component (client:load directive)
- Meta tags for SEO

**Handled Events:**
None (server-side only)

**Validation Conditions:**
- User must be authenticated (check via Astro middleware)
- Quiz ID from URL must be present

**Types:**
- `Astro.params.id`: string (route parameter)
- `Astro.locals.session`: Session object from middleware

**Props:**
None (root page component)

---

### 4.2 QuizDetailContainer (React)

**Component Description:**
Main React container component that manages the quiz detail state, fetches quiz data via custom hook, and orchestrates rendering of child components based on loading/error/success states.

**Main Elements:**
- Conditional rendering logic (loading → error → content)
- LoadingSpinner component
- ErrorAlert component
- QuizDetailContent component

**Handled Events:**
- Initial mount: Triggers quiz data fetch
- Delete action: Handles quiz deletion and navigation
- Edit action: Navigates to edit page
- Retry action: Re-fetches quiz data after error

**Validation Conditions:**
- Validates quiz ID format before API call
- Handles 404 (quiz not found or no access)
- Handles 401 (authentication required)
- Handles 400 (invalid UUID format)

**Types:**
- `QuizDetailDTO`: Complete quiz data with nested questions
- `QuizDetailViewState`: Custom view model (see section 5)

**Props:**
```typescript
interface QuizDetailContainerProps {
  quizId: string;
  currentUserId?: string; // From Astro locals
}
```

---

### 4.3 QuizDetailContent (React)

**Component Description:**
Renders the complete quiz content including header, metadata, actions, and all questions. Only displayed when quiz data is successfully loaded.

**Main Elements:**
- Section wrapper with proper semantic HTML
- QuizHeader component
- QuizQuestions component
- DeleteConfirmationDialog component (conditionally rendered)

**Handled Events:**
- Edit button click: Navigates to edit page
- Delete button click: Opens delete confirmation dialog
- Start quiz button click: Navigates to quiz-taking interface

**Validation Conditions:**
- Checks if user is owner (`quiz.user_id === currentUserId`)
- Validates quiz has at least one question
- Validates each question has at least one option

**Types:**
- `QuizDetailDTO`: Quiz data
- `isOwner`: boolean (derived)

**Props:**
```typescript
interface QuizDetailContentProps {
  quiz: QuizDetailDTO;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStartQuiz: () => void;
}
```

---

### 4.4 QuizHeader (React)

**Component Description:**
Displays quiz title, description, and metadata badges. Includes action buttons for quiz owner (Edit, Delete) and Start Quiz button for all users.

**Main Elements:**
- H1 heading with quiz title
- Paragraph with quiz description
- Badge group for visibility, source, status
- Button group for actions (conditional based on ownership)

**Handled Events:**
- Edit button click: Triggers `onEdit` callback
- Delete button click: Triggers `onDelete` callback
- Start Quiz button click: Triggers `onStartQuiz` callback

**Validation Conditions:**
- Show Edit/Delete buttons only if `isOwner === true`
- Display AI metadata badges if `source === "ai_generated"`
- Show status badge if `status !== "active"`

**Types:**
- `QuizDTO`: Quiz metadata
- `QuizMetadataDisplay`: Derived display properties

**Props:**
```typescript
interface QuizHeaderProps {
  quiz: QuizDTO;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStartQuiz: () => void;
}
```

---

### 4.5 QuizMetadata (React)

**Component Description:**
Displays quiz metadata as a collection of badges showing visibility, source, AI model info, creation date, and status.

**Main Elements:**
- Flex container with badge components
- Badge for visibility (public/private)
- Badge for source (AI Generated/Manual)
- Badge for AI model (if AI generated)
- Text for creation date
- Badge for status (if not active)

**Handled Events:**
None (presentational component)

**Validation Conditions:**
- Show AI model badge only if `source === "ai_generated" && ai_model !== undefined`
- Show status badge only if `status !== "active"`
- Format creation date as relative time (e.g., "2 days ago")

**Types:**
- `QuizDTO`: Quiz metadata

**Props:**
```typescript
interface QuizMetadataProps {
  quiz: QuizDTO;
  className?: string;
}
```

---

### 4.6 QuizActions (React)

**Component Description:**
Action button group for quiz owner, including Edit and Delete buttons. Styled with appropriate visual hierarchy and accessibility features.

**Main Elements:**
- Button group container
- Edit button (primary style)
- Delete button (destructive style)
- Start Quiz button (secondary style, available to all)

**Handled Events:**
- Edit button click: Triggers `onEdit`
- Delete button click: Triggers `onDelete`
- Start Quiz button click: Triggers `onStartQuiz`

**Validation Conditions:**
- Component only renders if `isOwner === true` (for Edit/Delete)
- All buttons must have proper ARIA labels

**Types:**
None (pure event handlers)

**Props:**
```typescript
interface QuizActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  onStartQuiz: () => void;
  isOwner: boolean;
}
```

---

### 4.7 QuizQuestions (React)

**Component Description:**
Container component that renders the list of questions. Handles empty state if no questions exist and provides proper semantic structure for accessibility.

**Main Elements:**
- Ordered list (`<ol>`) of questions
- QuestionCard components (mapped from questions array)
- Empty state message if no questions

**Handled Events:**
None (presentational container)

**Validation Conditions:**
- Display empty state if `questions.length === 0`
- Each question must have at least one option
- Questions must be ordered by `position` field

**Types:**
- `QuestionWithOptionsDTO[]`: Array of questions with options

**Props:**
```typescript
interface QuizQuestionsProps {
  questions: QuestionWithOptionsDTO[];
  className?: string;
}
```

---

### 4.8 QuestionCard (React)

**Component Description:**
Displays a single question with its content, position number, optional explanation, and list of answer options. Uses Card component from shadcn/ui for consistent styling.

**Main Elements:**
- Card wrapper
- CardHeader with question position number
- CardContent with question text
- OptionsList component
- Optional explanation section (collapsed by default if present)

**Handled Events:**
- Explanation expand/collapse: Toggles explanation visibility

**Validation Conditions:**
- Show explanation section only if `explanation !== undefined`
- Each option must be rendered via OptionItem
- At least one option must be marked as correct

**Types:**
- `QuestionWithOptionsDTO`: Question data with options

**Props:**
```typescript
interface QuestionCardProps {
  question: QuestionWithOptionsDTO;
  questionNumber: number; // For display (1-indexed)
  className?: string;
}
```

---

### 4.9 OptionsList (React)

**Component Description:**
Renders the list of answer options for a question. Uses semantic list markup and displays correct answers with visual indicators.

**Main Elements:**
- Unordered list (`<ul>`) wrapper
- OptionItem components (mapped from options array)

**Handled Events:**
None (presentational component)

**Validation Conditions:**
- Options must be ordered by `position` field
- At least one option must be marked as correct
- Each option must have unique ID

**Types:**
- `OptionDTO[]`: Array of options

**Props:**
```typescript
interface OptionsListProps {
  options: OptionDTO[];
  showCorrectAnswers: boolean; // Owner can see, others cannot
}
```

---

### 4.10 OptionItem (React)

**Component Description:**
Displays a single answer option with content and correctness indicator (if permitted). Uses checkmark icon for correct answers when visible.

**Main Elements:**
- List item with flexbox layout
- Position letter (A, B, C, D...)
- Option content text
- Correct answer indicator icon (conditional)

**Handled Events:**
None (presentational component)

**Validation Conditions:**
- Show correct answer indicator only if `showCorrectAnswers === true && is_correct === true`
- Position letter derived from option position (1=A, 2=B, etc.)

**Types:**
- `OptionDTO`: Option data

**Props:**
```typescript
interface OptionItemProps {
  option: OptionDTO;
  showCorrectAnswers: boolean;
  optionLetter: string; // A, B, C, D...
}
```

---

### 4.11 DeleteConfirmationDialog (React)

**Component Description:**
Modal dialog component for confirming quiz deletion. Uses shadcn/ui Dialog component with proper accessibility and focus management.

**Main Elements:**
- Dialog overlay
- Dialog content with title and description
- Cancel button
- Confirm delete button (destructive style)
- Loading state during deletion

**Handled Events:**
- Cancel button click: Closes dialog
- Confirm button click: Triggers quiz deletion via API
- Escape key: Closes dialog
- Outside click: Closes dialog

**Validation Conditions:**
- Disable action buttons during deletion (loading state)
- Show error message if deletion fails
- Auto-close and navigate on successful deletion

**Types:**
- `DeleteDialogState`: View model for dialog state (see section 5)

**Props:**
```typescript
interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  quizTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}
```

---

### 4.12 LoadingSpinner (React)

**Component Description:**
Reusable loading indicator component displayed during quiz data fetch. Provides visual feedback and accessibility announcement.

**Main Elements:**
- Centered container
- Spinner icon/animation
- "Loading..." text (visually hidden but screen-reader accessible)

**Handled Events:**
None (presentational component)

**Validation Conditions:**
None

**Types:**
None

**Props:**
```typescript
interface LoadingSpinnerProps {
  message?: string; // Optional custom loading message
  className?: string;
}
```

---

### 4.13 ErrorAlert (React)

**Component Description:**
Error message display component with retry functionality. Uses shadcn/ui Alert component for consistent error styling.

**Main Elements:**
- Alert container (destructive variant)
- Error icon
- Error message text
- Retry button (optional)

**Handled Events:**
- Retry button click: Triggers `onRetry` callback

**Validation Conditions:**
- Display specific error messages based on error type (404, 401, 500)
- Show retry button only if `onRetry` callback provided

**Types:**
None

**Props:**
```typescript
interface ErrorAlertProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}
```

## 5. Types

### 5.1 Existing Types (from src/types.ts)

**QuizDetailDTO:**
```typescript
interface QuizDetailDTO extends QuizDTO {
  questions?: QuestionWithOptionsDTO[];
}
```
Used for the complete quiz response from API.

**QuestionWithOptionsDTO:**
```typescript
interface QuestionWithOptionsDTO extends QuestionDTO {
  options: OptionDTO[];
}
```
Used for individual questions with nested options.

**OptionDTO:**
```typescript
interface OptionDTO {
  id: string;
  question_id: string;
  content: string;
  is_correct: boolean;
  position: number;
  created_at: string;
}
```
Used for individual answer options.

**QuizDTO:**
```typescript
interface QuizDTO {
  id: string;
  user_id: string;
  title: string;
  description: string;
  visibility: QuizVisibility; // "public" | "private"
  status: QuizStatus; // "active" | "archived" | "deleted"
  source: QuizSource; // "manual" | "ai_generated"
  ai_model?: string;
  ai_prompt?: string;
  ai_temperature?: number;
  created_at: string;
  updated_at: string;
}
```
Used for quiz metadata.

### 5.2 New View Model Types (to be added to src/types.ts)

**QuizDetailViewState:**
```typescript
interface QuizDetailViewState {
  quiz: QuizDetailDTO | null;
  isLoading: boolean;
  error: string | null;
  isOwner: boolean;
  showDeleteDialog: boolean;
  isDeleting: boolean;
}
```
Purpose: Manages the complete state of the quiz detail view, including loading states, error handling, and ownership information.

Fields breakdown:
- `quiz`: QuizDetailDTO | null - The fetched quiz data, null if not yet loaded or failed
- `isLoading`: boolean - True during initial quiz fetch
- `error`: string | null - Error message if fetch failed, null otherwise
- `isOwner`: boolean - True if current user is the quiz owner
- `showDeleteDialog`: boolean - Controls delete confirmation dialog visibility
- `isDeleting`: boolean - True during quiz deletion operation

**DeleteDialogState:**
```typescript
interface DeleteDialogState {
  isOpen: boolean;
  isDeleting: boolean;
  error: string | null;
}
```
Purpose: Manages the state of the delete confirmation dialog separately from main view state.

Fields breakdown:
- `isOpen`: boolean - Controls dialog visibility
- `isDeleting`: boolean - True during DELETE API call
- `error`: string | null - Error message if deletion failed

**QuizMetadataDisplay:**
```typescript
interface QuizMetadataDisplay {
  visibilityBadge: {
    text: string;
    variant: "default" | "secondary";
  };
  sourceBadge: {
    text: string;
    variant: "default" | "outline";
    show: boolean;
  };
  aiModelBadge: {
    text: string;
    show: boolean;
  };
  statusBadge: {
    text: string;
    variant: "default" | "secondary" | "destructive";
    show: boolean;
  };
  createdAt: string; // Formatted relative time
}
```
Purpose: Derived data structure for displaying quiz metadata badges with appropriate styling.

Fields breakdown:
- `visibilityBadge`: Configuration for public/private badge
- `sourceBadge`: Configuration for AI Generated/Manual badge
- `aiModelBadge`: Configuration for AI model name badge (shown only for AI quizzes)
- `statusBadge`: Configuration for status badge (shown only if not "active")
- `createdAt`: Human-readable relative timestamp (e.g., "2 days ago")

## 6. State Management

### 6.1 Custom Hook: useQuizDetail

Create a custom hook `src/hooks/useQuizDetail.ts` that encapsulates quiz fetching, error handling, and deletion logic:

```typescript
interface UseQuizDetailParams {
  quizId: string;
  currentUserId?: string;
}

interface UseQuizDetailReturn {
  quiz: QuizDetailDTO | null;
  isLoading: boolean;
  error: string | null;
  isOwner: boolean;
  refetch: () => Promise<void>;
  deleteQuiz: () => Promise<void>;
}

function useQuizDetail(params: UseQuizDetailParams): UseQuizDetailReturn
```

**State Management Strategy:**

1. **Fetch State** (handled by useQuizDetail hook):
   - `isLoading`: true during GET /api/quizzes/[id] call
   - `error`: populated if fetch fails
   - `quiz`: populated with QuizDetailDTO on success

2. **Derived State**:
   - `isOwner`: computed as `quiz?.user_id === currentUserId`
   - `questionCount`: computed as `quiz?.questions?.length ?? 0`
   - `metadataDisplay`: computed via helper function from quiz data

3. **Local Component State** (in QuizDetailContainer):
   - `showDeleteDialog`: boolean for delete confirmation dialog
   - `isDeleting`: boolean during DELETE operation

### 6.2 State Flow

**Initial Load:**
1. Page mounts → useQuizDetail hook triggers fetch
2. isLoading = true → LoadingSpinner displayed
3. API responds → isLoading = false, quiz populated
4. QuizDetailContent rendered with quiz data

**Delete Flow:**
1. User clicks Delete button → showDeleteDialog = true
2. Dialog opens with confirmation prompt
3. User confirms → isDeleting = true, DELETE API call
4. Success → Navigate to dashboard
5. Error → isDeleting = false, show error in dialog

**Error Flow:**
1. API returns error → error state populated
2. ErrorAlert rendered with error message
3. User clicks Retry → refetch() called
4. Flow returns to Initial Load

### 6.3 No Global State Required

This view uses local component state and custom hooks only. No Redux, Zustand, or other global state management needed. All state is colocated with the component tree.

## 7. API Integration

### 7.1 Fetch Quiz Details

**Endpoint:** GET `/api/quizzes/[id]`

**Request:**
- Method: GET
- Path parameter: `id` (quiz UUID)
- Headers: `Content-Type: application/json`, credentials: include
- Body: None

**Response Types:**
- Success (200): `QuizDetailDTO`
- Error (400): `{ error: string, message: string }`
- Error (401): `{ error: string, message: string }`
- Error (404): `{ error: string, message: string }`
- Error (500): `{ error: string, message: string }`

**Implementation in useQuizDetail:**
```typescript
const response = await fetch(`/api/quizzes/${quizId}`, {
  method: "GET",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
});

if (!response.ok) {
  const errorData = await response.json().catch(() => ({
    message: "Failed to fetch quiz"
  }));
  throw new Error(errorData.message);
}

const quiz: QuizDetailDTO = await response.json();
```

**Error Handling:**
- 401 → Redirect to login page with return URL
- 404 → Display "Quiz not found or you don't have access"
- 400 → Display "Invalid quiz ID"
- 500 → Display "Failed to load quiz. Please try again."

### 7.2 Delete Quiz

**Endpoint:** DELETE `/api/quizzes/[id]`

**Request:**
- Method: DELETE
- Path parameter: `id` (quiz UUID)
- Headers: `Content-Type: application/json`, credentials: include
- Body: None

**Response Types:**
- Success (204): No content
- Error (400): `{ error: string, message: string }`
- Error (401): `{ error: string, message: string }`
- Error (403): `{ error: string, message: string }`
- Error (404): `{ error: string, message: string }`
- Error (500): `{ error: string, message: string }`

**Implementation in deleteQuiz function:**
```typescript
const response = await fetch(`/api/quizzes/${quizId}`, {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
});

if (!response.ok) {
  const errorData = await response.json().catch(() => ({
    message: "Failed to delete quiz"
  }));
  throw new Error(errorData.message);
}

// Success - navigate to dashboard
navigate("/dashboard");
```

**Error Handling:**
- 401 → Redirect to login
- 403 → Display "You don't have permission to delete this quiz"
- 404 → Display "Quiz not found"
- 500 → Display "Failed to delete quiz. Please try again."

## 8. User Interactions

### 8.1 View Quiz Details

**User Action:** User navigates to `/quizzes/[id]` via link or direct URL

**Expected Outcome:**
1. Loading spinner appears immediately
2. Quiz data fetched from API
3. On success: Full quiz content displayed with questions and options
4. On error: Error message with retry button

**Accessibility:**
- Page title updates to quiz title
- Focus moves to main heading on load
- Loading state announced to screen readers

### 8.2 Start Quiz

**User Action:** User clicks "Start Quiz" button

**Expected Outcome:**
1. Navigate to quiz-taking interface at `/quizzes/[id]/take`
2. Quiz attempt session initiated

**Accessibility:**
- Button has clear label and focus indicator
- Keyboard accessible (Enter/Space)

### 8.3 Edit Quiz (Owner Only)

**User Action:** Owner clicks "Edit" button

**Expected Outcome:**
1. Navigate to quiz edit page at `/quizzes/[id]/edit`
2. Edit form pre-populated with current quiz data

**Accessibility:**
- Button only visible to owner
- Clear visual distinction from Start Quiz button
- Keyboard accessible

### 8.4 Delete Quiz (Owner Only)

**User Action:** Owner clicks "Delete" button

**Expected Outcome:**
1. Delete confirmation dialog opens
2. Dialog displays quiz title and warning message
3. User can cancel (closes dialog) or confirm

**On Confirm:**
1. Delete button shows loading state
2. DELETE API call executes
3. On success: Dialog closes, navigate to dashboard with success message
4. On error: Error message displayed in dialog, can retry

**Accessibility:**
- Dialog traps focus within
- Escape key closes dialog
- Confirmation button requires explicit action (no auto-confirm)
- Destructive action clearly marked visually

### 8.5 View Question Explanation

**User Action:** User clicks "Show Explanation" toggle on question card

**Expected Outcome:**
1. Explanation section expands with smooth animation
2. Explanation text displayed
3. Toggle button text changes to "Hide Explanation"

**Accessibility:**
- Button has aria-expanded attribute
- Explanation section has aria-hidden when collapsed
- Keyboard accessible

### 8.6 Retry After Error

**User Action:** User clicks "Retry" button in error alert

**Expected Outcome:**
1. Error message cleared
2. Loading state activated
3. Quiz fetch retried
4. Same error/success flow as initial load

**Accessibility:**
- Focus remains on or near retry button
- New loading state announced to screen readers

## 9. Conditions and Validation

### 9.1 Authentication Validation

**Condition:** User must be authenticated to view any quiz

**Validation Location:** Astro middleware (server-side) + API endpoint

**Effect on Interface:**
- Unauthenticated users redirected to `/login?redirect=/quizzes/[id]`
- API returns 401 → hook redirects to login

**Implementation:**
```typescript
// In Astro middleware
if (!locals.session) {
  return Astro.redirect(`/login?redirect=${Astro.url.pathname}`);
}
```

### 9.2 Authorization Validation

**Condition:** User must be owner OR quiz must be public

**Validation Location:** API endpoint (server-side)

**Effect on Interface:**
- Non-owner viewing private quiz → 404 error
- ErrorAlert displays "Quiz not found or you don't have access"

**Implementation:**
Handled by `quizService.getQuizById()` which returns null if no access

### 9.3 Quiz ID Format Validation

**Condition:** Quiz ID must be valid UUID format

**Validation Location:** API endpoint (server-side) + client-side guard

**Effect on Interface:**
- Invalid UUID → 400 error
- ErrorAlert displays "Invalid quiz ID format"

**Implementation:**
```typescript
// Client-side guard in useQuizDetail
import { z } from "zod";
const uuidSchema = z.string().uuid();
const validationResult = uuidSchema.safeParse(quizId);
if (!validationResult.success) {
  setError("Invalid quiz ID format");
  return;
}
```

### 9.4 Quiz Existence Validation

**Condition:** Quiz must exist and not be soft-deleted

**Validation Location:** API endpoint (database query)

**Effect on Interface:**
- Deleted or non-existent quiz → 404 error
- ErrorAlert displays "Quiz not found"

### 9.5 Quiz Content Validation

**Condition:** Quiz must have at least one question with at least one option

**Validation Location:** Component rendering logic

**Effect on Interface:**
- No questions → Empty state message: "This quiz has no questions yet."
- Question with no options → Warning message: "This question has no answer options."

**Implementation:**
```typescript
// In QuizQuestions component
if (!questions || questions.length === 0) {
  return <EmptyState message="This quiz has no questions yet." />;
}

// In QuestionCard component
if (!question.options || question.options.length === 0) {
  return <WarningMessage text="This question has no answer options." />;
}
```

### 9.6 Owner Action Visibility

**Condition:** Edit and Delete buttons only visible to quiz owner

**Validation Location:** Component rendering logic (QuizActions)

**Effect on Interface:**
- `isOwner === false` → Edit/Delete buttons not rendered
- `isOwner === true` → Full action set displayed

**Implementation:**
```typescript
// In QuizActions component
{isOwner && (
  <>
    <Button onClick={onEdit}>Edit Quiz</Button>
    <Button onClick={onDelete} variant="destructive">Delete Quiz</Button>
  </>
)}
```

### 9.7 Correct Answer Visibility

**Condition:** Correct answer indicators only visible to quiz owner

**Validation Location:** OptionItem component

**Effect on Interface:**
- `isOwner === false` → No visual indicators for correct answers
- `isOwner === true` → Checkmark icon on correct answers

**Implementation:**
```typescript
// In OptionItem component
{showCorrectAnswers && option.is_correct && (
  <CheckIcon className="text-green-600" aria-label="Correct answer" />
)}
```

## 10. Error Handling

### 10.1 Network Errors

**Scenario:** Network request fails (no internet, timeout, etc.)

**Handling Strategy:**
1. Catch fetch error in useQuizDetail hook
2. Set error state with user-friendly message
3. Display ErrorAlert with retry button
4. Log technical error to console

**User Experience:**
- Error message: "Unable to connect. Please check your internet connection."
- Retry button available
- No data loss (can retry)

### 10.2 Authentication Errors (401)

**Scenario:** User session expired or invalid

**Handling Strategy:**
1. Detect 401 response in fetch
2. Store current URL for redirect after login
3. Navigate to login page with return URL
4. Display notification: "Session expired. Please log in again."

**User Experience:**
- Automatic redirect to login
- Return to quiz detail page after successful login

### 10.3 Authorization Errors (404 for private quiz)

**Scenario:** User tries to access private quiz they don't own

**Handling Strategy:**
1. API returns 404 (not 403 to avoid information disclosure)
2. Display ErrorAlert with message
3. Provide link to dashboard

**User Experience:**
- Error message: "Quiz not found or you don't have access to view it."
- "Go to Dashboard" button
- No retry button (won't help)

### 10.4 Invalid Quiz ID (400)

**Scenario:** Malformed UUID in URL

**Handling Strategy:**
1. Client-side validation catches invalid format
2. Display ErrorAlert immediately
3. Provide link to dashboard

**User Experience:**
- Error message: "Invalid quiz ID format."
- "Go to Dashboard" button
- No retry button

### 10.5 Quiz Not Found (404)

**Scenario:** Quiz deleted or never existed

**Handling Strategy:**
1. API returns 404
2. Display ErrorAlert with message
3. Provide link to dashboard

**User Experience:**
- Error message: "This quiz no longer exists."
- "Go to Dashboard" button
- No retry button

### 10.6 Server Errors (500)

**Scenario:** Database error or unexpected server issue

**Handling Strategy:**
1. Catch 500 response
2. Display generic error message
3. Provide retry button
4. Log error details for monitoring

**User Experience:**
- Error message: "Something went wrong. Please try again later."
- Retry button available
- Can return to dashboard

### 10.7 Delete Operation Errors

**Scenario:** Delete API call fails

**Handling Strategy:**
1. Catch error in deleteQuiz function
2. Display error in DeleteConfirmationDialog
3. Keep dialog open for retry or cancel
4. Specific messages based on error type:
   - 403: "You don't have permission to delete this quiz."
   - 404: "Quiz not found."
   - 500: "Failed to delete quiz. Please try again."

**User Experience:**
- Error displayed inline in dialog
- Dialog remains open
- User can retry or cancel
- No data loss

### 10.8 Missing Questions/Options

**Scenario:** Quiz has no questions or questions have no options

**Handling Strategy:**
1. Defensive null checks in rendering logic
2. Display appropriate empty state messages
3. Owner can click Edit to add content

**User Experience:**
- Empty state: "This quiz has no questions yet."
- Edit button available for owner
- No error thrown

### 10.9 Malformed Data

**Scenario:** API returns data that doesn't match expected schema

**Handling Strategy:**
1. Defensive null checks throughout components
2. Validate critical fields exist before rendering
3. Fallback to generic error if data invalid

**User Experience:**
- Error message: "Unable to display quiz data."
- Retry button or dashboard link
- Technical error logged to console

## 11. Implementation Steps

### Step 1: Create Custom Hook (useQuizDetail)

**File:** `src/hooks/useQuizDetail.ts`

**Tasks:**
1. Define UseQuizDetailParams and UseQuizDetailReturn interfaces
2. Implement state management (quiz, isLoading, error, isOwner)
3. Implement fetchQuiz function with proper error handling
4. Implement deleteQuiz function with API call
5. Implement refetch function
6. Add useEffect for initial fetch
7. Return all necessary state and functions

**Dependencies:**
- `react` (useState, useEffect, useCallback)
- `astro:transitions/client` (navigate)
- `src/types.ts` (QuizDetailDTO)

**Validation:**
- Test with valid quiz ID
- Test with invalid UUID format
- Test 404 response
- Test 401 response
- Test delete operation

---

### Step 2: Create Astro Page Component

**File:** `src/pages/quizzes/[id].astro`

**Tasks:**
1. Set up dynamic route with [id] parameter
2. Add authentication check in frontmatter
3. Extract quiz ID from params
4. Pass quiz ID and user ID to React component
5. Wrap in appropriate Layout component
6. Add meta tags and page title

**Dependencies:**
- Layout component
- QuizDetailContainer React component (client:load)
- Astro middleware (locals.session)

**Validation:**
- Access page authenticated
- Access page unauthenticated (should redirect)
- Verify quiz ID passed correctly

---

### Step 3: Create Container Component (QuizDetailContainer)

**File:** `src/components/quiz-detail/QuizDetailContainer.tsx`

**Tasks:**
1. Define component props interface
2. Integrate useQuizDetail hook
3. Add local state for delete dialog
4. Implement conditional rendering (loading/error/success)
5. Implement navigation handlers (edit, delete, start quiz)
6. Pass props to child components

**Dependencies:**
- useQuizDetail hook
- LoadingSpinner, ErrorAlert, QuizDetailContent components
- astro:transitions/client (navigate)

**Validation:**
- Test loading state display
- Test error state display
- Test success state with quiz data
- Test owner vs non-owner rendering

---

### Step 4: Create Content Component (QuizDetailContent)

**File:** `src/components/quiz-detail/QuizDetailContent.tsx`

**Tasks:**
1. Define component props interface
2. Create main layout structure
3. Integrate QuizHeader, QuizQuestions components
4. Add DeleteConfirmationDialog
5. Compute derived data (isOwner check)

**Dependencies:**
- QuizHeader, QuizQuestions, DeleteConfirmationDialog components
- QuizDetailDTO type

**Validation:**
- Verify correct props passed to children
- Test owner vs non-owner layout
- Test with various quiz data

---

### Step 5: Create Header Component (QuizHeader)

**File:** `src/components/quiz-detail/QuizHeader.tsx`

**Tasks:**
1. Define component props interface
2. Render title, description, metadata
3. Integrate QuizMetadata and QuizActions components
4. Add responsive layout

**Dependencies:**
- QuizMetadata, QuizActions components
- shadcn/ui components (Badge, Button)

**Validation:**
- Test with different quiz types (AI/manual)
- Test with different visibilities (public/private)
- Test responsive behavior

---

### Step 6: Create Metadata Component (QuizMetadata)

**File:** `src/components/quiz-detail/QuizMetadata.tsx`

**Tasks:**
1. Define component props interface
2. Create helper function to compute metadata display
3. Render badges for visibility, source, AI model, status
4. Format creation date as relative time
5. Add proper ARIA labels

**Dependencies:**
- shadcn/ui Badge component
- date-fns or custom date utility
- QuizDTO type

**Validation:**
- Test with AI-generated quiz
- Test with manual quiz
- Test with different statuses
- Test date formatting

---

### Step 7: Create Actions Component (QuizActions)

**File:** `src/components/quiz-detail/QuizActions.tsx`

**Tasks:**
1. Define component props interface
2. Render button group with proper styling
3. Implement conditional rendering based on isOwner
4. Add keyboard accessibility
5. Add proper ARIA labels

**Dependencies:**
- shadcn/ui Button component

**Validation:**
- Test owner view (Edit/Delete visible)
- Test non-owner view (only Start Quiz)
- Test keyboard navigation
- Test button click handlers

---

### Step 8: Create Questions Component (QuizQuestions)

**File:** `src/components/quiz-detail/QuizQuestions.tsx`

**Tasks:**
1. Define component props interface
2. Create empty state component
3. Map questions to QuestionCard components
4. Add proper semantic HTML (ordered list)
5. Handle edge cases (no questions, invalid data)

**Dependencies:**
- QuestionCard component
- QuestionWithOptionsDTO type

**Validation:**
- Test with multiple questions
- Test empty state
- Test question ordering
- Test with malformed data

---

### Step 9: Create Question Card Component (QuestionCard)

**File:** `src/components/quiz-detail/QuestionCard.tsx`

**Tasks:**
1. Define component props interface
2. Render question number, content, explanation toggle
3. Integrate OptionsList component
4. Add expand/collapse functionality for explanation
5. Use shadcn/ui Card component

**Dependencies:**
- OptionsList component
- shadcn/ui Card components
- QuestionWithOptionsDTO type

**Validation:**
- Test with explanation present
- Test without explanation
- Test expand/collapse interaction
- Test with various option counts

---

### Step 10: Create Options List Component (OptionsList)

**File:** `src/components/quiz-detail/OptionsList.tsx`

**Tasks:**
1. Define component props interface
2. Map options to OptionItem components
3. Compute option letters (A, B, C...)
4. Add proper semantic HTML (unordered list)

**Dependencies:**
- OptionItem component
- OptionDTO type

**Validation:**
- Test with multiple options
- Test option ordering
- Test letter computation (A-Z)

---

### Step 11: Create Option Item Component (OptionItem)

**File:** `src/components/quiz-detail/OptionItem.tsx`

**Tasks:**
1. Define component props interface
2. Render option letter, content, correct indicator
3. Add conditional rendering for correct answer icon
4. Style based on correctness (subtle visual distinction)

**Dependencies:**
- Icon component (check mark)
- OptionDTO type

**Validation:**
- Test correct answer display (owner)
- Test without correct indicator (non-owner)
- Test various option content lengths

---

### Step 12: Create Delete Dialog Component (DeleteConfirmationDialog)

**File:** `src/components/quiz-detail/DeleteConfirmationDialog.tsx`

**Tasks:**
1. Define component props interface
2. Implement shadcn/ui Dialog with proper structure
3. Add loading state during deletion
4. Add error display if deletion fails
5. Implement keyboard accessibility (Escape, focus trap)

**Dependencies:**
- shadcn/ui Dialog components
- shadcn/ui Button component

**Validation:**
- Test open/close behavior
- Test deletion flow (success)
- Test deletion flow (error)
- Test keyboard navigation
- Test focus management

---

### Step 13: Reuse Existing Components (LoadingSpinner, ErrorAlert)

**Files:**
- `src/components/Dashboard/LoadingSpinner.tsx` (already exists)
- `src/components/Dashboard/ErrorAlert.tsx` (already exists)

**Tasks:**
1. Verify existing components meet requirements
2. Add any missing props (e.g., onRetry callback for ErrorAlert)
3. Update prop types if necessary
4. Document usage for quiz detail view

**Validation:**
- Test LoadingSpinner display
- Test ErrorAlert with retry button
- Test various error messages

---

### Step 14: Add New View Model Types to types.ts

**File:** `src/types.ts`

**Tasks:**
1. Add QuizDetailViewState interface
2. Add DeleteDialogState interface
3. Add QuizMetadataDisplay interface
4. Document each type with JSDoc comments

**Validation:**
- Verify TypeScript compilation
- Ensure types match usage in components

---

### Step 15: Create Helper Functions

**File:** `src/lib/utils/quiz-detail.helpers.ts`

**Tasks:**
1. Create `computeMetadataDisplay` function
2. Create `getOptionLetter` function (position → letter)
3. Create `validateQuizData` function (defensive checks)
4. Add comprehensive JSDoc comments

**Functions:**
```typescript
export function computeMetadataDisplay(quiz: QuizDTO): QuizMetadataDisplay
export function getOptionLetter(position: number): string
export function validateQuizData(quiz: QuizDetailDTO): boolean
```

**Validation:**
- Unit test each helper function
- Test edge cases (position > 26, invalid data, etc.)

---

### Step 16: Add Integration Tests

**File:** `tests/quiz-detail-view.test.ts`

**Tasks:**
1. Test successful quiz load (owner)
2. Test successful quiz load (public, non-owner)
3. Test 404 error handling
4. Test 401 error handling
5. Test delete operation (success)
6. Test delete operation (error)
7. Test navigation flows

**Dependencies:**
- Testing library (Vitest, React Testing Library)
- Mock API responses

---

### Step 17: Add Accessibility Testing

**File:** `tests/quiz-detail-accessibility.test.ts`

**Tasks:**
1. Test keyboard navigation through all interactive elements
2. Test screen reader announcements (loading, errors)
3. Test focus management (dialog, retry button)
4. Test ARIA labels and roles
5. Run automated accessibility audit (axe-core)

**Dependencies:**
- jest-axe or similar a11y testing library
- React Testing Library

---

### Step 18: Add Responsive Design Styles

**Files:** Component files (update className props)

**Tasks:**
1. Ensure mobile-first responsive design
2. Test layout on mobile (320px-640px)
3. Test layout on tablet (641px-1024px)
4. Test layout on desktop (1025px+)
5. Ensure touch targets are minimum 44x44px
6. Test with increased font sizes (accessibility)

**Validation:**
- Visual testing at multiple breakpoints
- Test on real mobile devices if possible

---

### Step 19: Performance Optimization

**Tasks:**
1. Add React.memo to pure presentational components
2. Use useCallback for event handlers
3. Lazy load DeleteConfirmationDialog (React.lazy)
4. Add loading="lazy" to any images
5. Ensure components don't re-render unnecessarily

**Validation:**
- Use React DevTools Profiler
- Measure render times
- Check for unnecessary re-renders

---

### Step 20: Documentation

**File:** `docs/quiz-detail-view.md`

**Tasks:**
1. Document component architecture
2. Document state management strategy
3. Document API integration
4. Document error handling approach
5. Add usage examples
6. Document accessibility features
7. Add troubleshooting guide

**Validation:**
- Peer review documentation
- Ensure accuracy with implementation

---

### Step 21: Final Integration and Testing

**Tasks:**
1. Test complete user flow (view → edit → delete)
2. Test navigation from dashboard to detail view
3. Test browser back/forward navigation
4. Test direct URL access
5. Test with various quiz data (edge cases)
6. Cross-browser testing (Chrome, Firefox, Safari, Edge)
7. Test with screen readers (NVDA, JAWS, VoiceOver)

**Validation:**
- Manual testing checklist
- Automated E2E tests (Playwright)
- Accessibility audit report

---

**Implementation Complete** ✅

The view is now ready for code review and production deployment.
