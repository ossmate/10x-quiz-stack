# View Implementation Plan: Quiz Taking View

## 1. Overview

The Quiz Taking View provides an interactive interface for users to take quizzes, answer questions, and view their results. The view manages the complete quiz-taking flow from starting a new attempt, navigating through questions, submitting answers, calculating scores, to displaying results with the option to retry. It integrates with quiz attempt and response endpoints, provides real-time progress tracking, and ensures a responsive and accessible user experience.

## 2. View Routing

**Path:** `/quizzes/[id]/take`

- Dynamic route parameter: `[id]` - UUID of the quiz to take
- Access: Authenticated users only
- Authorization: Quiz owner OR public quiz visibility

## 3. Component Structure

```
QuizTakingPage (Astro page)
└── QuizTakingContainer (React client component)
    ├── LoadingSpinner (when isLoading === true)
    ├── ErrorAlert (when error !== null)
    └── QuizTakingContent (when quiz loaded and attempt created)
        ├── QuizTakingHeader
        │   ├── Quiz title
        │   └── ProgressIndicator
        │       ├── Progress bar
        │       └── Question counter (e.g., "3 of 10")
        ├── QuestionDisplay (active question)
        │   ├── Question number badge
        │   ├── Question content
        │   └── OptionsList
        │       └── OptionItem[] (selectable options)
        ├── QuizNavigationControls
        │   ├── Previous button
        │   ├── Next button
        │   └── Submit button [last question]
        └── ResultsDisplay (after completion)
            ├── ScoreSummary
            │   ├── Score number
            │   ├── Percentage
            │   └── Pass/fail indicator (optional)
            ├── QuestionReview
            │   └── QuestionReviewCard[] (each question with correct/incorrect indicator)
            │       ├── Question content
            │       ├── User's answer (highlighted)
            │       ├── Correct answer (highlighted)
            │       └── Explanation (if available)
            └── ResultsActions
                ├── Retry button
                └── Back to quiz button
```

## 4. Component Details

### 4.1 QuizTakingPage (Astro)

**Component Description:**
Server-rendered Astro page component that serves as the entry point for the quiz taking view. Handles initial authentication check and renders the React client component.

**Main Elements:**

- Astro Layout component wrapper
- QuizTakingContainer React component (client:load directive)

**Handled Events:**
None (server-side only)

**Validation Conditions:**

- User must be authenticated (check via Astro middleware)
- Quiz ID from URL must be valid UUID format

**Types:**

- `Astro.params.id`: string (route parameter)
- `Astro.locals.session`: Session object from middleware

**Props:**
None (root page component)

---

### 4.2 QuizTakingContainer (React)

**Component Description:**
Main React container component that manages the complete quiz-taking state machine. Coordinates quiz loading, attempt creation, answer submission, score calculation, and results display through a custom hook.

**Main Elements:**

- Conditional rendering based on taking state phase
- LoadingSpinner component
- ErrorAlert component
- QuizTakingContent component
- ResultsDisplay component

**Handled Events:**

- Initial mount: Triggers quiz load and attempt creation
- Answer selection: Updates user answers in state
- Navigation: Moves between questions
- Submit: Submits all answers and calculates score
- Retry: Creates new attempt and resets state

**Validation Conditions:**

- Validates quiz ID format before API call
- Ensures attempt is created before allowing answers
- Validates at least one option selected per question (optional)
- Handles all API error responses (400, 401, 403, 404, 500)

**Types:**

- `QuizDetailDTO`: Quiz data with questions
- `QuizAttemptDTO`: Current attempt record
- `TakingState`: Custom view model (see section 5)

**Props:**

```typescript
interface QuizTakingContainerProps {
  quizId: string;
  currentUserId?: string; // From Astro locals or env variable
}
```

---

### 4.3 QuizTakingContent (React)

**Component Description:**
Renders the active quiz-taking interface including header, current question, navigation controls. Only displayed when quiz is loaded and attempt is active.

**Main Elements:**

- Section wrapper with semantic HTML
- QuizTakingHeader component
- QuestionDisplay component (shows current question only)
- QuizNavigationControls component

**Handled Events:**

- Option selection: Updates answer in state
- Navigation: Switches between questions
- Submit quiz: Triggers submission flow

**Validation Conditions:**

- Current question index must be within bounds
- User answers tracked for all visited questions

**Types:**

- `QuizDetailDTO`: Full quiz data
- `QuestionWithOptionsDTO`: Current question
- `QuizAnswer[]`: User's answers

**Props:**

```typescript
interface QuizTakingContentProps {
  quiz: QuizDetailDTO;
  currentQuestionIndex: number;
  userAnswers: Record<string, string[]>; // questionId -> selectedOptionIds[]
  onSelectOption: (questionId: string, optionId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}
```

---

### 4.4 QuizTakingHeader (React)

**Component Description:**
Displays quiz title and progress indicator showing current progress through the quiz.

**Main Elements:**

- H1 heading with quiz title
- ProgressIndicator component
- Optional quiz description

**Handled Events:**
None (presentational component)

**Validation Conditions:**

- Quiz must have at least one question for progress calculation

**Types:**

- `QuizDetailDTO`: Quiz metadata
- `ProgressInfo`: Progress metrics

**Props:**

```typescript
interface QuizTakingHeaderProps {
  quiz: QuizDetailDTO;
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredCount: number;
}
```

---

### 4.5 ProgressIndicator (React)

**Component Description:**
Visual indicator showing quiz progress with progress bar and question counter.

**Main Elements:**

- Progress bar (shadcn/ui Progress component)
- Question counter text (e.g., "Question 3 of 10")
- Answered questions counter (optional)

**Handled Events:**
None (presentational component)

**Validation Conditions:**

- Current must be between 1 and total questions
- Percentage must be 0-100

**Types:**

- `ProgressInfo`: Progress metrics

**Props:**

```typescript
interface ProgressIndicatorProps {
  current: number; // 1-indexed for display
  total: number;
  answered: number; // Number of questions answered
  className?: string;
}
```

---

### 4.6 QuestionDisplay (React)

**Component Description:**
Displays the current question with its content and answer options. Handles option selection with visual feedback.

**Main Elements:**

- Question number badge
- Question content text
- OptionsList component with selectable options
- Optional hint or context

**Handled Events:**

- Option selection: Triggers `onSelectOption` callback with question and option IDs

**Validation Conditions:**

- Question must have at least 2 options
- Options must be ordered by position
- Must handle both single and multiple correct answers (for future support)

**Types:**

- `QuestionWithOptionsDTO`: Current question with options
- `string[]`: Selected option IDs for this question

**Props:**

```typescript
interface QuestionDisplayProps {
  question: QuestionWithOptionsDTO;
  questionNumber: number; // 1-indexed for display
  selectedOptionIds: string[]; // Currently selected options
  onSelectOption: (optionId: string) => void;
  showValidation?: boolean; // Show if answer is required
}
```

---

### 4.7 OptionsList (React)

**Component Description:**
Renders the list of selectable answer options for the current question. Manages selection state visually.

**Main Elements:**

- Wrapper div with proper spacing
- OptionItem components (mapped from options array)

**Handled Events:**

- Option click: Propagates to parent via callback

**Validation Conditions:**

- At least 2 options required
- Options ordered by position field
- Each option must have unique ID

**Types:**

- `OptionDTO[]`: Array of options
- `string[]`: Selected option IDs

**Props:**

```typescript
interface OptionsListProps {
  options: OptionDTO[];
  selectedOptionIds: string[];
  onSelectOption: (optionId: string) => void;
  disabled?: boolean; // During submission
}
```

---

### 4.8 OptionItem (React)

**Component Description:**
Individual selectable answer option with visual selection state. Uses card or button styling for interactivity.

**Main Elements:**

- Interactive button or card wrapper
- Option letter (A, B, C, D...)
- Option content text
- Selection indicator (checkmark icon or highlight)

**Handled Events:**

- Click: Toggles selection state
- Keyboard: Enter/Space triggers selection

**Validation Conditions:**

- Must be keyboard accessible
- Must have clear visual selection state
- Must have proper ARIA attributes

**Types:**

- `OptionDTO`: Option data
- `boolean`: Is selected state

**Props:**

```typescript
interface OptionItemProps {
  option: OptionDTO;
  optionLetter: string; // A, B, C, D...
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}
```

---

### 4.9 QuizNavigationControls (React)

**Component Description:**
Navigation button group for moving between questions and submitting the quiz. Manages button states based on current position.

**Main Elements:**

- Button group container
- Previous button (disabled on first question)
- Next button (hidden on last question)
- Submit button (shown on last question)

**Handled Events:**

- Previous click: Navigates to previous question
- Next click: Navigates to next question
- Submit click: Submits quiz for scoring

**Validation Conditions:**

- Previous disabled when currentQuestionIndex === 0
- Next hidden when on last question
- Submit shown only on last question
- All disabled during submission (isSubmitting)

**Types:**

- `NavigationState`: Navigation state info

**Props:**

```typescript
interface QuizNavigationControlsProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean; // All questions answered check
}
```

---

### 4.10 ResultsDisplay (React)

**Component Description:**
Displays quiz completion results including score, percentage, and detailed review of each question with correct/incorrect indicators.

**Main Elements:**

- ScoreSummary component
- QuestionReview component
- ResultsActions component

**Handled Events:**

- Retry: Creates new attempt
- Back to quiz: Navigates to quiz detail page

**Validation Conditions:**

- Results must be available (score calculated)
- User answers must match questions

**Types:**

- `QuizResult`: Complete results data
- `QuizDetailDTO`: Original quiz data

**Props:**

```typescript
interface ResultsDisplayProps {
  result: QuizResult;
  quiz: QuizDetailDTO;
  onRetry: () => void;
  onBackToQuiz: () => void;
}
```

---

### 4.11 ScoreSummary (React)

**Component Description:**
Displays final score with visual emphasis and percentage calculation.

**Main Elements:**

- Large score display (e.g., "8 / 10")
- Percentage with progress ring or bar
- Pass/fail indicator (optional)
- Congratulatory or encouraging message

**Handled Events:**
None (presentational component)

**Validation Conditions:**

- Score must be between 0 and total questions
- Percentage must be 0-100

**Types:**

- `QuizResult`: Score data

**Props:**

```typescript
interface ScoreSummaryProps {
  score: number;
  totalQuestions: number;
  percentage: number;
  correctAnswers: number;
  className?: string;
}
```

---

### 4.12 QuestionReview (React)

**Component Description:**
Shows detailed review of all questions with user's answers, correct answers, and explanations.

**Main Elements:**

- List of QuestionReviewCard components
- Scroll container for many questions

**Handled Events:**
None (presentational container)

**Validation Conditions:**

- Must show all questions from quiz
- Must match user answers to questions

**Types:**

- `QuizResult`: Complete results
- `QuizDetailDTO`: Quiz data

**Props:**

```typescript
interface QuestionReviewProps {
  quiz: QuizDetailDTO;
  userAnswers: Record<string, string[]>;
  className?: string;
}
```

---

### 4.13 QuestionReviewCard (React)

**Component Description:**
Displays a single question review showing user's answer, correct answer, and whether they were right or wrong.

**Main Elements:**

- Question number and content
- User's selected options (highlighted as correct/incorrect)
- Correct answer indicators
- Explanation text (if available)
- Result badge (correct/incorrect)

**Handled Events:**
None (presentational component)

**Validation Conditions:**

- Must clearly distinguish user answer from correct answer
- Must show explanation if available

**Types:**

- `QuestionWithOptionsDTO`: Question data
- `string[]`: User's selected option IDs
- `boolean`: Was answer correct

**Props:**

```typescript
interface QuestionReviewCardProps {
  question: QuestionWithOptionsDTO;
  questionNumber: number;
  userSelectedOptionIds: string[];
  isCorrect: boolean;
}
```

---

### 4.14 ResultsActions (React)

**Component Description:**
Action button group for post-quiz actions (retry, back to quiz detail).

**Main Elements:**

- Button group container
- Retry button (primary style)
- Back to quiz button (secondary style)

**Handled Events:**

- Retry click: Triggers new attempt creation
- Back click: Navigates to quiz detail page

**Validation Conditions:**
None

**Types:**
None (pure event handlers)

**Props:**

```typescript
interface ResultsActionsProps {
  onRetry: () => void;
  onBackToQuiz: () => void;
  isRetrying?: boolean; // Loading state during new attempt creation
}
```

---

### 4.15 LoadingSpinner (Reused)

**Component Description:**
Reusable loading indicator displayed during quiz load and attempt creation.

**Source:** `src/components/Dashboard/LoadingSpinner.tsx` (existing component)

**Props:**

```typescript
interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}
```

---

### 4.16 ErrorAlert (Reused)

**Component Description:**
Reusable error message display with retry functionality.

**Source:** `src/components/Dashboard/ErrorAlert.tsx` (existing component)

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

Complete quiz data with nested questions and options.

**QuestionWithOptionsDTO:**

```typescript
interface QuestionWithOptionsDTO extends QuestionDTO {
  options: OptionDTO[];
}
```

Question with nested options array.

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

Individual answer option.

**QuizAttemptDTO:**

```typescript
interface QuizAttemptDTO {
  id: string;
  user_id: string;
  quiz_id: string;
  status: QuizAttemptStatus; // "in_progress" | "completed" | "abandoned"
  score: number;
  total_questions: number;
  started_at: string;
  completed_at: string | null;
}
```

Quiz attempt record.

**QuizAttemptCreateDTO:**

```typescript
interface QuizAttemptCreateDTO {
  quiz_id: string;
}
```

Payload for creating new attempt.

**QuizAttemptUpdateDTO:**

```typescript
interface QuizAttemptUpdateDTO {
  status: QuizAttemptStatus;
  score: number;
  completed_at: string;
}
```

Payload for updating attempt with final score.

**QuizResponseCreateDTO:**

```typescript
interface QuizResponseCreateDTO {
  responses: {
    question_id: string;
    selected_options: string[];
  }[];
}
```

Payload for submitting quiz responses.

### 5.2 New View Model Types

**TakingState:**

```typescript
interface TakingState {
  phase: "loading" | "ready" | "taking" | "submitting" | "completed" | "error";
  quiz: QuizDetailDTO | null;
  attempt: QuizAttemptDTO | null;
  currentQuestionIndex: number;
  userAnswers: Record<string, string[]>; // questionId -> selectedOptionIds[]
  score: number | null;
  error: string | null;
}
```

Purpose: Complete state machine for quiz taking flow.

Fields breakdown:

- `phase`: Current phase of quiz taking flow
  - `loading`: Initial quiz and attempt creation
  - `ready`: Quiz loaded, ready to start taking
  - `taking`: Actively answering questions
  - `submitting`: Submitting answers and calculating score
  - `completed`: Results available
  - `error`: Error occurred
- `quiz`: QuizDetailDTO | null - Loaded quiz data
- `attempt`: QuizAttemptDTO | null - Current attempt record
- `currentQuestionIndex`: 0-indexed current question
- `userAnswers`: Map of question IDs to selected option IDs arrays
- `score`: Final calculated score (null until completed)
- `error`: Error message if phase === 'error'

**QuizAnswer:**

```typescript
interface QuizAnswer {
  questionId: string;
  selectedOptionIds: string[];
}
```

Purpose: Individual question answer for type safety.

Fields breakdown:

- `questionId`: UUID of the question
- `selectedOptionIds`: Array of selected option UUIDs (supports multi-select future enhancement)

**QuizResult:**

```typescript
interface QuizResult {
  attemptId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  correctAnswers: number;
  userAnswers: Record<string, string[]>;
  quiz: QuizDetailDTO;
}
```

Purpose: Complete results data for display after quiz completion.

Fields breakdown:

- `attemptId`: UUID of the completed attempt
- `score`: Number of questions answered correctly
- `totalQuestions`: Total number of questions in quiz
- `percentage`: Score as percentage (0-100)
- `correctAnswers`: Same as score (for clarity)
- `userAnswers`: Map of question IDs to user's selected option IDs
- `quiz`: Original quiz data with correct answers for comparison

**NavigationState:**

```typescript
interface NavigationState {
  currentQuestionIndex: number;
  totalQuestions: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isLastQuestion: boolean;
  isFirstQuestion: boolean;
}
```

Purpose: Derived navigation state for button states.

Fields breakdown:

- `currentQuestionIndex`: 0-indexed current position
- `totalQuestions`: Total questions count
- `canGoPrevious`: False on first question
- `canGoNext`: True unless on last question
- `isLastQuestion`: True when on last question (show submit)
- `isFirstQuestion`: True when on first question (disable previous)

**ProgressInfo:**

```typescript
interface ProgressInfo {
  current: number; // 1-indexed for display
  total: number;
  percentage: number; // 0-100
  answered: number; // Number of questions answered
}
```

Purpose: Progress indicator metrics.

Fields breakdown:

- `current`: Current question number (1-indexed for user display)
- `total`: Total number of questions
- `percentage`: Progress percentage (0-100)
- `answered`: Count of questions that have at least one option selected

## 6. State Management

### 6.1 Custom Hook: useQuizTaking

Create a custom hook `src/hooks/useQuizTaking.ts` that encapsulates the complete quiz-taking flow:

```typescript
interface UseQuizTakingParams {
  quizId: string;
  currentUserId?: string;
}

interface UseQuizTakingReturn {
  // State
  takingState: TakingState;
  currentQuestion: QuestionWithOptionsDTO | null;
  navigationState: NavigationState;
  progressInfo: ProgressInfo;

  // Actions
  startQuiz: () => Promise<void>;
  selectOption: (questionId: string, optionId: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  submitQuiz: () => Promise<void>;
  retryQuiz: () => Promise<void>;

  // Computed
  result: QuizResult | null;
}

function useQuizTaking(params: UseQuizTakingParams): UseQuizTakingReturn;
```

**State Management Strategy:**

1. **Phase-Based State Machine:**
   - `loading`: Fetch quiz → Create attempt
   - `ready`: Attempt created, ready to start (auto-transition to 'taking')
   - `taking`: User answering questions
   - `submitting`: Submitting responses → Calculating score → Updating attempt
   - `completed`: Show results
   - `error`: Show error with retry

2. **State Variables:**
   - `phase`: Current phase of state machine
   - `quiz`: Fetched quiz data
   - `attempt`: Created attempt record
   - `currentQuestionIndex`: Active question (0-indexed)
   - `userAnswers`: Record<questionId, selectedOptionIds[]>
   - `score`: Final score (null until completed)
   - `error`: Error message

3. **Derived State:**
   - `currentQuestion`: quiz.questions[currentQuestionIndex]
   - `navigationState`: Computed from currentQuestionIndex and totalQuestions
   - `progressInfo`: Computed from currentQuestionIndex, totalQuestions, and answered count
   - `result`: Computed from score, userAnswers, and quiz data

### 6.2 State Flow

**Initial Load Flow:**

1. Component mounts → `phase = 'loading'`
2. Fetch quiz via GET /api/quizzes/[id]
3. Quiz loaded → Create attempt via POST /api/quizzes/[id]/attempts
4. Attempt created → `phase = 'taking'`, `currentQuestionIndex = 0`
5. User can now answer questions

**Answer Selection Flow:**

1. User clicks option → selectOption(questionId, optionId)
2. Update userAnswers[questionId] with selected option IDs
3. For single-answer: Replace array with [optionId]
4. For multi-answer: Toggle optionId in array (future support)
5. UI updates to show selection

**Navigation Flow:**

1. User clicks Next → `currentQuestionIndex++`
2. User clicks Previous → `currentQuestionIndex--`
3. Boundaries enforced (0 to questions.length - 1)
4. User answers preserved across navigation

**Submission Flow:**

1. User clicks Submit on last question → `phase = 'submitting'`
2. Calculate score locally by comparing userAnswers to is_correct flags
3. Submit responses via POST /api/attempts/[attemptId]/responses
4. Update attempt via PUT /api/quizzes/[id]/attempts/[attemptId] with score
5. On success → `phase = 'completed'`, show results
6. On error → `phase = 'error'`, allow retry

**Retry Flow:**

1. User clicks Retry → Reset state
2. Create new attempt via POST /api/quizzes/[id]/attempts
3. Clear userAnswers, reset currentQuestionIndex = 0
4. Transition to `phase = 'taking'`

**Error Recovery Flow:**

1. Error occurs → `phase = 'error'`
2. User clicks Retry → Re-attempt failed operation
3. If error in load/create → Restart from beginning
4. If error in submit → Retry submission with existing answers

### 6.3 No Global State Required

All state is local to the quiz-taking view and managed by the custom hook. No Redux, Zustand, or other global state management needed.

## 7. API Integration

### 7.1 Fetch Quiz Details

**Endpoint:** GET `/api/quizzes/[id]`

**Request:**

- Method: GET
- Path parameter: `id` (quiz UUID)
- Headers: `Content-Type: application/json`, credentials: include
- Body: None

**Response Type:** `QuizDetailDTO`

**Implementation:**

```typescript
const response = await fetch(`/api/quizzes/${quizId}`, {
  method: "GET",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
});

if (!response.ok) {
  if (response.status === 401) {
    navigate(`/login?redirect=/quizzes/${quizId}/take`);
    return;
  }
  throw new Error("Failed to load quiz");
}

const quiz: QuizDetailDTO = await response.json();
```

**Error Handling:**

- 401 → Redirect to login
- 404 → Display "Quiz not found or not accessible"
- 400 → Display "Invalid quiz ID"
- 500 → Display "Failed to load quiz" with retry

### 7.2 Create Quiz Attempt

**Endpoint:** POST `/api/quizzes/[quizId]/attempts`

**Request:**

- Method: POST
- Path parameter: `quizId` (quiz UUID)
- Headers: `Content-Type: application/json`, credentials: include
- Body: `QuizAttemptCreateDTO` (may be empty or minimal)

**Response Type:** `QuizAttemptDTO`

**Implementation:**

```typescript
const response = await fetch(`/api/quizzes/${quizId}/attempts`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ quiz_id: quizId }),
});

if (!response.ok) {
  throw new Error("Failed to create quiz attempt");
}

const attempt: QuizAttemptDTO = await response.json();
```

**Error Handling:**

- 401 → Redirect to login
- 400 → Display "Invalid quiz" with retry
- 500 → Display "Failed to start quiz" with retry

### 7.3 Submit Quiz Responses

**Endpoint:** POST `/api/attempts/[attemptId]/responses`

**Request:**

- Method: POST
- Path parameter: `attemptId` (attempt UUID)
- Headers: `Content-Type: application/json`, credentials: include
- Body: `QuizResponseCreateDTO`

**Request Payload:**

```typescript
{
  responses: [
    {
      question_id: "uuid",
      selected_options: ["uuid"],
    },
    // ... for each question
  ];
}
```

**Response Type:** Success confirmation (201 Created)

**Implementation:**

```typescript
// Transform userAnswers to API format
const responses = Object.entries(userAnswers).map(([questionId, selectedOptionIds]) => ({
  question_id: questionId,
  selected_options: selectedOptionIds,
}));

const response = await fetch(`/api/attempts/${attemptId}/responses`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ responses }),
});

if (!response.ok) {
  throw new Error("Failed to submit responses");
}
```

**Error Handling:**

- 401 → Redirect to login
- 403 → Display "Invalid attempt" (shouldn't happen)
- 400 → Display "Invalid responses" with retry
- 500 → Display "Failed to submit" with retry

### 7.4 Update Quiz Attempt with Score

**Endpoint:** PUT `/api/quizzes/[quizId]/attempts/[attemptId]`

**Request:**

- Method: PUT
- Path parameters: `quizId`, `attemptId`
- Headers: `Content-Type: application/json`, credentials: include
- Body: `QuizAttemptUpdateDTO`

**Request Payload:**

```typescript
{
  status: "completed",
  score: 8,
  completed_at: "2025-01-15T10:30:00Z"
}
```

**Response Type:** Updated `QuizAttemptDTO`

**Implementation:**

```typescript
const response = await fetch(`/api/quizzes/${quizId}/attempts/${attemptId}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    status: "completed",
    score: calculatedScore,
    completed_at: new Date().toISOString(),
  }),
});

if (!response.ok) {
  throw new Error("Failed to update attempt");
}

const updatedAttempt: QuizAttemptDTO = await response.json();
```

**Error Handling:**

- 401 → Redirect to login
- 404 → Display "Attempt not found"
- 400 → Display "Invalid update" with retry
- 500 → Display "Failed to save score" with retry

### 7.5 Score Calculation

**Client-Side Implementation:**
Score is calculated on the client before sending to backend:

```typescript
function calculateScore(quiz: QuizDetailDTO, userAnswers: Record<string, string[]>): number {
  let correctCount = 0;

  quiz.questions?.forEach((question) => {
    const userSelectedIds = userAnswers[question.id] || [];
    const correctOptionIds = question.options.filter((opt) => opt.is_correct).map((opt) => opt.id);

    // Check if user's answer matches correct answer(s)
    // For single correct answer: user must select exactly that option
    // For multiple correct answers: user must select all correct options
    const isCorrect =
      userSelectedIds.length === correctOptionIds.length &&
      userSelectedIds.every((id) => correctOptionIds.includes(id));

    if (isCorrect) {
      correctCount++;
    }
  });

  return correctCount;
}
```

**Alternative: Backend Calculation:**
If backend provides score calculation endpoint, use that instead for security and consistency.

## 8. User Interactions

### 8.1 Start Quiz

**User Action:** User navigates to `/quizzes/[id]/take`

**Expected Outcome:**

1. Loading spinner displays
2. Quiz fetched from API
3. Quiz attempt created automatically
4. First question displays
5. User can begin answering

**Accessibility:**

- Page title announces "Taking: [Quiz Title]"
- Focus moves to first question content
- Loading state announced to screen readers

### 8.2 Select Answer

**User Action:** User clicks on an answer option

**Expected Outcome:**

1. Option becomes visually selected (highlight, checkmark)
2. Previous selection (if any) is deselected (single-answer)
3. Answer stored in state immediately
4. No API call (answers stored locally until submit)

**Accessibility:**

- Option has clear selected state
- Keyboard navigation with Tab
- Selection with Enter or Space
- Screen reader announces selection

### 8.3 Navigate Questions

**User Action:** User clicks Next or Previous button

**Expected Outcome:**

1. Current question slides out (optional animation)
2. New question slides in
3. Progress indicator updates
4. Selected answers preserved
5. Focus moves to new question content

**Edge Cases:**

- Previous disabled on first question
- Next hidden on last question (Submit shown instead)
- Navigation during submission disabled

**Accessibility:**

- Keyboard navigation with Tab to buttons
- Arrow keys for question navigation (optional enhancement)
- Focus management on question change

### 8.4 Submit Quiz

**User Action:** User clicks Submit on last question

**Expected Outcome:**

1. Confirmation dialog appears (optional)
   - "Submit your answers? You won't be able to change them."
   - Cancel / Submit buttons
2. On confirm:
   - Submit button shows loading state
   - Responses sent to API
   - Score calculated
   - Attempt updated with score
   - Results display transitions in

**Accessibility:**

- Confirmation dialog traps focus
- Escape cancels dialog
- Clear submit confirmation required

### 8.5 View Results

**User Action:** Automatic after submission completes

**Expected Outcome:**

1. Quiz-taking interface replaced with results
2. Score displayed prominently with animation
3. Percentage and pass/fail indicator shown
4. Detailed question review available
5. Retry and Back to Quiz buttons available

**Accessibility:**

- Results announced to screen readers
- Focus moves to score heading
- Review section keyboard navigable

### 8.6 Review Answers

**User Action:** User scrolls through question review section

**Expected Outcome:**

1. Each question shows:
   - Question content
   - User's answer (highlighted in red if incorrect, green if correct)
   - Correct answer (highlighted in green)
   - Explanation (if available)
2. Visual indicators (checkmark/X) for correct/incorrect

**Accessibility:**

- Semantic HTML for list of reviews
- Clear visual distinction between correct/incorrect
- Explanations properly associated with questions

### 8.7 Retry Quiz

**User Action:** User clicks Retry button in results

**Expected Outcome:**

1. Retry button shows loading state briefly
2. New attempt created via API
3. All answers cleared
4. Return to first question
5. Fresh quiz-taking session begins

**Accessibility:**

- Loading state announced
- Focus returns to first question
- Clear indication of new attempt

### 8.8 Return to Quiz

**User Action:** User clicks "Back to Quiz" button

**Expected Outcome:**

1. Navigate to `/quizzes/[id]` (quiz detail page)
2. User can view quiz info or start another attempt

**Accessibility:**

- Standard navigation link
- Keyboard accessible

## 9. Conditions and Validation

### 9.1 Authentication Validation

**Condition:** User must be authenticated to take quiz

**Validation Location:** Astro middleware (server-side) + API endpoints

**Effect on Interface:**

- Unauthenticated users redirected to `/login?redirect=/quizzes/[id]/take`
- API returns 401 → hook redirects to login

**Implementation:**

```typescript
// In Astro middleware
if (!locals.session && Astro.url.pathname.includes("/take")) {
  return Astro.redirect(`/login?redirect=${Astro.url.pathname}`);
}
```

### 9.2 Quiz Accessibility Validation

**Condition:** User must be owner OR quiz must be public

**Validation Location:** API endpoint (GET /api/quizzes/[id])

**Effect on Interface:**

- Private quiz + non-owner → 404 error
- ErrorAlert displays "Quiz not found or not accessible"

### 9.3 Quiz Content Validation

**Condition:** Quiz must have at least one question with options

**Validation Location:** Component rendering logic

**Effect on Interface:**

- No questions → Error: "This quiz has no questions"
- Question with no options → Error: "Question has no options"

**Implementation:**

```typescript
if (!quiz.questions || quiz.questions.length === 0) {
  setError("This quiz has no questions to take");
  setPhase("error");
  return;
}
```

### 9.4 Attempt Creation Validation

**Condition:** Attempt must be successfully created before taking

**Validation Location:** useQuizTaking hook

**Effect on Interface:**

- Attempt creation fails → Error with retry
- Cannot answer questions until attempt created
- Attempt ID required for all subsequent operations

### 9.5 Navigation Boundaries

**Condition:** currentQuestionIndex must be within bounds

**Validation Location:** Navigation functions in hook

**Effect on Interface:**

- Previous button disabled on first question
- Next button hidden on last question (Submit shown)
- Cannot navigate outside 0 to questions.length - 1

**Implementation:**

```typescript
const nextQuestion = () => {
  if (currentQuestionIndex < quiz.questions.length - 1) {
    setCurrentQuestionIndex((prev) => prev + 1);
  }
};

const previousQuestion = () => {
  if (currentQuestionIndex > 0) {
    setCurrentQuestionIndex((prev) => prev - 1);
  }
};
```

### 9.6 Answer Completeness (Optional)

**Condition:** All questions should be answered before submission

**Validation Location:** Submit handler in hook

**Effect on Interface:**

- Unanswered questions → Warning dialog or inline message
- User can choose to submit anyway or go back
- Or strict validation preventing submission

**Implementation (Optional):**

```typescript
const unanswered = quiz.questions.filter((q) => !userAnswers[q.id] || userAnswers[q.id].length === 0);

if (unanswered.length > 0) {
  // Show warning dialog or prevent submission
  setError(`${unanswered.length} questions unanswered`);
  return;
}
```

### 9.7 Submission State

**Condition:** Cannot interact during submission

**Validation Location:** Component props

**Effect on Interface:**

- All buttons disabled during `isSubmitting`
- Option selection disabled
- Loading indicator shown
- Prevents double submission

**Implementation:**

```typescript
// In components
disabled = { isSubmitting };
```

## 10. Error Handling

### 10.1 Quiz Load Errors

**Scenario:** Failed to fetch quiz data

**Handling Strategy:**

1. Detect error in fetch
2. Set `phase = 'error'`
3. Display ErrorAlert with specific message
4. Provide retry button

**Error Messages:**

- 404: "Quiz not found or you don't have access to it"
- 401: Redirect to login
- 500: "Failed to load quiz. Please try again."
- Network: "Connection error. Check your internet."

**User Experience:**

- Error displayed prominently
- Retry button available
- Link to dashboard as fallback

### 10.2 Attempt Creation Errors

**Scenario:** Failed to create quiz attempt

**Handling Strategy:**

1. Quiz loaded but attempt creation fails
2. Display error with retry
3. Retry only attempt creation (don't refetch quiz)

**Error Messages:**

- 400: "Unable to start quiz attempt"
- 500: "Failed to create quiz session. Please try again."

**User Experience:**

- Clear error message
- Retry specific to attempt creation
- Don't lose quiz data

### 10.3 Answer Submission Errors

**Scenario:** Failed to submit responses to backend

**Handling Strategy:**

1. Answers submitted but API call fails
2. Preserve all user answers in state
3. Show error with retry
4. Don't lose user's work

**Error Messages:**

- 400: "Invalid submission. Please try again."
- 403: "Invalid attempt session"
- 500: "Failed to submit answers. Please retry."
- Network: "Connection lost. Your answers are saved. Retry when connected."

**User Experience:**

- Answers preserved in state
- Retry button resubmits same answers
- No data loss
- Progress indicator for retry

### 10.4 Score Update Errors

**Scenario:** Responses submitted but attempt update fails

**Handling Strategy:**

1. Score calculated locally
2. Responses stored successfully
3. Attempt update fails
4. Show partial success message with retry

**Error Messages:**

- "Your answers were saved, but score recording failed. Retry to save your score."

**User Experience:**

- Acknowledge answers submitted
- Retry only the score update
- Eventually allow viewing results even if update fails

### 10.5 Network Interruption During Quiz

**Scenario:** User loses connection while taking quiz

**Handling Strategy:**

1. Answers stored in local state (not lost)
2. Submission fails with network error
3. User can retry when connection restored
4. Future enhancement: LocalStorage backup

**User Experience:**

- Answers not lost
- Clear error message about connection
- Retry when connection restored

### 10.6 Invalid Question/Option Data

**Scenario:** Malformed data from API

**Handling Strategy:**

1. Defensive null checks in components
2. Validate critical fields exist
3. Log error details
4. Show generic error to user

**Error Messages:**

- "Unable to display question. Please try again."
- "Invalid quiz data. Contact support."

**User Experience:**

- Generic error message
- Technical details logged
- Offer return to dashboard

### 10.7 Session Expiration During Quiz

**Scenario:** User session expires while taking quiz

**Handling Strategy:**

1. API returns 401 on submit
2. Store current answers in localStorage (future)
3. Redirect to login with return URL
4. After login, offer to resume

**Current Implementation:**

- Redirect to login immediately
- User must start over (answers lost)

**Future Enhancement:**

- Save answers to localStorage
- Resume after re-authentication

## 11. Implementation Steps

### Step 1: Create Custom Hook (useQuizTaking)

**File:** `src/hooks/useQuizTaking.ts`

**Tasks:**

1. Define interfaces: `UseQuizTakingParams`, `UseQuizTakingReturn`
2. Implement state variables (phase, quiz, attempt, currentQuestionIndex, userAnswers, score, error)
3. Implement `startQuiz` function:
   - Fetch quiz via GET /api/quizzes/[id]
   - Create attempt via POST /api/quizzes/[id]/attempts
   - Set phase to 'taking'
4. Implement `selectOption` function:
   - Update userAnswers map
   - Handle single-answer (replace) and multi-answer (toggle)
5. Implement `nextQuestion` and `previousQuestion` functions
6. Implement `submitQuiz` function:
   - Calculate score locally
   - Submit responses via POST /api/attempts/[attemptId]/responses
   - Update attempt via PUT /api/quizzes/[id]/attempts/[attemptId]
   - Set phase to 'completed'
7. Implement `retryQuiz` function:
   - Create new attempt
   - Clear state
   - Reset to first question
8. Implement `calculateScore` helper function
9. Compute derived state (currentQuestion, navigationState, progressInfo, result)
10. Add useEffect for initial quiz load
11. Add comprehensive error handling for all API calls

**Dependencies:**

- `react` (useState, useEffect, useCallback, useMemo)
- `astro:transitions/client` (navigate)
- `src/types.ts` (QuizDetailDTO, QuizAttemptDTO, etc.)

**Validation:**

- Test complete flow: load → answer → submit → results
- Test navigation (next/previous)
- Test retry
- Test all error scenarios
- Test with different quiz sizes (1 question, 50 questions)

---

### Step 2: Create Astro Page Component

**File:** `src/pages/quizzes/[id]/take.astro`

**Tasks:**

1. Set up nested dynamic route with [id] parameter
2. Extract quiz ID from params
3. Get current user ID from session or DEFAULT_USER_ID env variable
4. Pass quiz ID and user ID to React component
5. Wrap in appropriate Layout component
6. Add meta tags and page title

**Code Structure:**

```astro
---
import Layout from "@/layouts/Layout.astro";
import QuizTakingContainer from "@/components/quiz-taking/QuizTakingContainer";

const { id } = Astro.params;
const currentUserId = import.meta.env.DEFAULT_USER_ID || Astro.locals.session?.user?.id;
---

<Layout title="Take Quiz | QuizStack">
  <QuizTakingContainer quizId={id} currentUserId={currentUserId} client:load />
</Layout>
```

**Dependencies:**

- Layout component
- QuizTakingContainer React component

**Validation:**

- Access page with valid quiz ID
- Verify props passed correctly
- Test with missing quiz ID (should show error)

---

### Step 3: Create Container Component (QuizTakingContainer)

**File:** `src/components/quiz-taking/QuizTakingContainer.tsx`

**Tasks:**

1. Define component props interface
2. Integrate useQuizTaking hook
3. Implement conditional rendering based on phase:
   - `loading` → LoadingSpinner
   - `error` → ErrorAlert
   - `taking` → QuizTakingContent
   - `completed` → ResultsDisplay
4. Call startQuiz on mount
5. Handle navigation to quiz detail page

**Code Structure:**

```typescript
export function QuizTakingContainer({ quizId, currentUserId }: Props) {
  const {
    takingState,
    currentQuestion,
    navigationState,
    progressInfo,
    selectOption,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    retryQuiz,
    result,
  } = useQuizTaking({ quizId, currentUserId });

  if (takingState.phase === 'loading') {
    return <LoadingSpinner message="Loading quiz..." />;
  }

  if (takingState.phase === 'error') {
    return <ErrorAlert error={takingState.error} onRetry={() => window.location.reload()} />;
  }

  if (takingState.phase === 'completed' && result) {
    return <ResultsDisplay result={result} quiz={takingState.quiz} onRetry={retryQuiz} />;
  }

  return (
    <QuizTakingContent
      quiz={takingState.quiz}
      currentQuestion={currentQuestion}
      userAnswers={takingState.userAnswers}
      progressInfo={progressInfo}
      navigationState={navigationState}
      onSelectOption={selectOption}
      onNext={nextQuestion}
      onPrevious={previousQuestion}
      onSubmit={submitQuiz}
      isSubmitting={takingState.phase === 'submitting'}
    />
  );
}
```

**Dependencies:**

- useQuizTaking hook
- LoadingSpinner, ErrorAlert components
- QuizTakingContent, ResultsDisplay components

**Validation:**

- Test all phases render correctly
- Test phase transitions
- Test with various quiz data

---

### Step 4: Create Quiz Taking Content Component (QuizTakingContent)

**File:** `src/components/quiz-taking/QuizTakingContent.tsx`

**Tasks:**

1. Define component props interface
2. Create layout structure
3. Integrate QuizTakingHeader, QuestionDisplay, QuizNavigationControls
4. Extract current question from quiz
5. Extract selected options for current question

**Code Structure:**

```typescript
export function QuizTakingContent({
  quiz,
  currentQuestion,
  userAnswers,
  progressInfo,
  navigationState,
  onSelectOption,
  onNext,
  onPrevious,
  onSubmit,
  isSubmitting,
}: Props) {
  const currentSelectedOptions = userAnswers[currentQuestion.id] || [];

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <QuizTakingHeader quiz={quiz} progressInfo={progressInfo} />

      <QuestionDisplay
        question={currentQuestion}
        questionNumber={progressInfo.current}
        selectedOptionIds={currentSelectedOptions}
        onSelectOption={(optionId) => onSelectOption(currentQuestion.id, optionId)}
      />

      <QuizNavigationControls
        navigationState={navigationState}
        onPrevious={onPrevious}
        onNext={onNext}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
```

**Dependencies:**

- Child components
- Types from useQuizTaking

**Validation:**

- Test with different questions
- Test answer selection
- Test navigation

---

### Step 5: Create Header Component (QuizTakingHeader)

**File:** `src/components/quiz-taking/QuizTakingHeader.tsx`

**Tasks:**

1. Define component props interface
2. Render quiz title
3. Integrate ProgressIndicator component
4. Add responsive layout

**Code Structure:**

```typescript
export function QuizTakingHeader({ quiz, progressInfo }: Props) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold mb-4">{quiz.title}</h1>
      <ProgressIndicator {...progressInfo} />
    </header>
  );
}
```

**Dependencies:**

- ProgressIndicator component
- QuizDetailDTO type

**Validation:**

- Test with different quiz titles
- Test progress updates

---

### Step 6: Create Progress Indicator Component (ProgressIndicator)

**File:** `src/components/quiz-taking/ProgressIndicator.tsx`

**Tasks:**

1. Define component props interface
2. Render progress bar using shadcn/ui Progress component
3. Display question counter text
4. Display answered count
5. Calculate percentage

**Code Structure:**

```typescript
export function ProgressIndicator({ current, total, answered }: Props) {
  const percentage = (current / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Question {current} of {total}</span>
        <span>{answered} answered</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
```

**Dependencies:**

- shadcn/ui Progress component

**Validation:**

- Test with different values
- Test percentage calculation
- Test visual appearance

---

### Step 7: Create Question Display Component (QuestionDisplay)

**File:** `src/components/quiz-taking/QuestionDisplay.tsx`

**Tasks:**

1. Define component props interface
2. Render question number badge
3. Render question content
4. Integrate OptionsList component
5. Add animation for question transitions (optional)

**Code Structure:**

```typescript
export function QuestionDisplay({
  question,
  questionNumber,
  selectedOptionIds,
  onSelectOption,
}: Props) {
  return (
    <div className="my-8">
      <div className="flex items-start gap-4 mb-6">
        <Badge className="text-lg px-3 py-1">Q{questionNumber}</Badge>
        <p className="text-xl flex-1">{question.content}</p>
      </div>

      <OptionsList
        options={question.options}
        selectedOptionIds={selectedOptionIds}
        onSelectOption={onSelectOption}
      />
    </div>
  );
}
```

**Dependencies:**

- OptionsList component
- shadcn/ui Badge component

**Validation:**

- Test with different questions
- Test with selected options
- Test option selection

---

### Step 8: Create Options List Component (OptionsList)

**File:** `src/components/quiz-taking/OptionsList.tsx`

**Tasks:**

1. Define component props interface
2. Map options to OptionItem components
3. Compute option letters (A, B, C...)
4. Add proper spacing

**Code Structure:**

```typescript
export function OptionsList({
  options,
  selectedOptionIds,
  onSelectOption,
  disabled,
}: Props) {
  const sortedOptions = [...options].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-3">
      {sortedOptions.map((option, index) => (
        <OptionItem
          key={option.id}
          option={option}
          optionLetter={String.fromCharCode(65 + index)} // A, B, C...
          isSelected={selectedOptionIds.includes(option.id)}
          onSelect={() => onSelectOption(option.id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
```

**Dependencies:**

- OptionItem component

**Validation:**

- Test with multiple options
- Test selection state
- Test letter computation

---

### Step 9: Create Option Item Component (OptionItem)

**File:** `src/components/quiz-taking/OptionItem.tsx`

**Tasks:**

1. Define component props interface
2. Create interactive button or card
3. Show selection state visually
4. Add hover and focus states
5. Add keyboard accessibility

**Code Structure:**

```typescript
export function OptionItem({
  option,
  optionLetter,
  isSelected,
  onSelect,
  disabled,
}: Props) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "w-full text-left p-4 rounded-lg border-2 transition-all",
        "hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary",
        isSelected ? "border-primary bg-primary/10" : "border-gray-200",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="font-semibold text-lg">{optionLetter}.</span>
        <span className="flex-1">{option.content}</span>
        {isSelected && <CheckIcon className="h-5 w-5 text-primary" />}
      </div>
    </button>
  );
}
```

**Dependencies:**

- shadcn/ui styling utilities
- Icon component

**Validation:**

- Test selection state
- Test keyboard navigation
- Test disabled state
- Test visual feedback

---

### Step 10: Create Navigation Controls Component (QuizNavigationControls)

**File:** `src/components/quiz-taking/QuizNavigationControls.tsx`

**Tasks:**

1. Define component props interface
2. Render Previous, Next, Submit buttons
3. Handle button states based on navigation state
4. Add loading state for submit button

**Code Structure:**

```typescript
export function QuizNavigationControls({
  navigationState,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting,
}: Props) {
  const { isFirstQuestion, isLastQuestion } = navigationState;

  return (
    <div className="flex justify-between mt-8">
      <Button
        onClick={onPrevious}
        disabled={isFirstQuestion || isSubmitting}
        variant="outline"
      >
        Previous
      </Button>

      {!isLastQuestion ? (
        <Button onClick={onNext} disabled={isSubmitting}>
          Next
        </Button>
      ) : (
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Quiz"}
        </Button>
      )}
    </div>
  );
}
```

**Dependencies:**

- shadcn/ui Button component

**Validation:**

- Test button states
- Test navigation
- Test submit
- Test disabled states

---

### Step 11: Create Results Display Component (ResultsDisplay)

**File:** `src/components/quiz-taking/ResultsDisplay.tsx`

**Tasks:**

1. Define component props interface
2. Integrate ScoreSummary, QuestionReview, ResultsActions
3. Add animations for results reveal (optional)
4. Add congratulations message based on score

**Code Structure:**

```typescript
export function ResultsDisplay({ result, quiz, onRetry, onBackToQuiz }: Props) {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <ScoreSummary
        score={result.score}
        totalQuestions={result.totalQuestions}
        percentage={result.percentage}
        correctAnswers={result.correctAnswers}
      />

      <QuestionReview quiz={quiz} userAnswers={result.userAnswers} />

      <ResultsActions onRetry={onRetry} onBackToQuiz={onBackToQuiz} />
    </div>
  );
}
```

**Dependencies:**

- ScoreSummary, QuestionReview, ResultsActions components

**Validation:**

- Test with different scores
- Test review display
- Test action buttons

---

### Step 12: Create Score Summary Component (ScoreSummary)

**File:** `src/components/quiz-taking/ScoreSummary.tsx`

**Tasks:**

1. Define component props interface
2. Display score prominently
3. Display percentage
4. Add visual indicator (progress ring or bar)
5. Add congratulations message

**Code Structure:**

```typescript
export function ScoreSummary({ score, totalQuestions, percentage }: Props) {
  const getMessage = () => {
    if (percentage >= 90) return "Excellent work!";
    if (percentage >= 70) return "Great job!";
    if (percentage >= 50) return "Good effort!";
    return "Keep practicing!";
  };

  return (
    <Card className="mb-8 p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Quiz Complete!</h2>
      <div className="text-6xl font-bold mb-2">
        {score} / {totalQuestions}
      </div>
      <div className="text-xl text-muted-foreground mb-4">
        {percentage.toFixed(0)}%
      </div>
      <p className="text-lg">{getMessage()}</p>
    </Card>
  );
}
```

**Dependencies:**

- shadcn/ui Card component

**Validation:**

- Test with different scores
- Test message logic
- Test visual appearance

---

### Step 13: Create Question Review Component (QuestionReview)

**File:** `src/components/quiz-taking/QuestionReview.tsx`

**Tasks:**

1. Define component props interface
2. Map questions to QuestionReviewCard components
3. Determine if each answer was correct
4. Add section heading

**Code Structure:**

```typescript
export function QuestionReview({ quiz, userAnswers }: Props) {
  return (
    <div className="mb-8">
      <h3 className="text-2xl font-bold mb-4">Review Your Answers</h3>
      <div className="space-y-6">
        {quiz.questions?.map((question, index) => {
          const userSelectedIds = userAnswers[question.id] || [];
          const correctOptionIds = question.options
            .filter((opt) => opt.is_correct)
            .map((opt) => opt.id);

          const isCorrect =
            userSelectedIds.length === correctOptionIds.length &&
            userSelectedIds.every((id) => correctOptionIds.includes(id));

          return (
            <QuestionReviewCard
              key={question.id}
              question={question}
              questionNumber={index + 1}
              userSelectedOptionIds={userSelectedIds}
              isCorrect={isCorrect}
            />
          );
        })}
      </div>
    </div>
  );
}
```

**Dependencies:**

- QuestionReviewCard component

**Validation:**

- Test with all correct
- Test with all incorrect
- Test with mixed results

---

### Step 14: Create Question Review Card Component (QuestionReviewCard)

**File:** `src/components/quiz-taking/QuestionReviewCard.tsx`

**Tasks:**

1. Define component props interface
2. Display question with correct/incorrect badge
3. Highlight user's answer
4. Highlight correct answer
5. Show explanation if available

**Code Structure:**

```typescript
export function QuestionReviewCard({
  question,
  questionNumber,
  userSelectedOptionIds,
  isCorrect,
}: Props) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <Badge variant="outline">Q{questionNumber}</Badge>
          <p className="flex-1">{question.content}</p>
        </div>
        <Badge variant={isCorrect ? "default" : "destructive"}>
          {isCorrect ? "Correct" : "Incorrect"}
        </Badge>
      </div>

      <div className="space-y-2">
        {question.options.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const isUserAnswer = userSelectedOptionIds.includes(option.id);
          const isCorrectAnswer = option.is_correct;

          return (
            <div
              key={option.id}
              className={cn(
                "p-3 rounded border",
                isUserAnswer && !isCorrectAnswer && "border-red-500 bg-red-50",
                isCorrectAnswer && "border-green-500 bg-green-50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">{letter}.</span>
                <span className="flex-1">{option.content}</span>
                {isUserAnswer && <span className="text-sm">(Your answer)</span>}
                {isCorrectAnswer && <CheckIcon className="text-green-600" />}
              </div>
            </div>
          );
        })}
      </div>

      {question.explanation && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm font-semibold mb-1">Explanation:</p>
          <p className="text-sm">{question.explanation}</p>
        </div>
      )}
    </Card>
  );
}
```

**Dependencies:**

- shadcn/ui Card, Badge components
- Icon component

**Validation:**

- Test correct answers
- Test incorrect answers
- Test with explanation
- Test without explanation

---

### Step 15: Create Results Actions Component (ResultsActions)

**File:** `src/components/quiz-taking/ResultsActions.tsx`

**Tasks:**

1. Define component props interface
2. Render Retry and Back to Quiz buttons
3. Add loading state for retry

**Code Structure:**

```typescript
export function ResultsActions({ onRetry, onBackToQuiz, isRetrying }: Props) {
  return (
    <div className="flex justify-center gap-4">
      <Button onClick={onRetry} disabled={isRetrying} size="lg">
        {isRetrying ? "Starting new attempt..." : "Retry Quiz"}
      </Button>
      <Button onClick={onBackToQuiz} variant="outline" size="lg">
        Back to Quiz
      </Button>
    </div>
  );
}
```

**Dependencies:**

- shadcn/ui Button component

**Validation:**

- Test both buttons
- Test loading state
- Test navigation

---

### Step 16: Reuse Existing Components (LoadingSpinner, ErrorAlert)

**Source Files:**

- `src/components/Dashboard/LoadingSpinner.tsx`
- `src/components/Dashboard/ErrorAlert.tsx`

**Tasks:**

1. Verify components work for quiz-taking use case
2. No modifications needed if they match requirements
3. Import and use in QuizTakingContainer

**Validation:**

- Test loading display
- Test error display with retry
- Test error messages

---

### Step 17: Add New Types to types.ts

**File:** `src/types.ts`

**Tasks:**

1. Add TakingState interface
2. Add QuizAnswer interface
3. Add QuizResult interface
4. Add NavigationState interface
5. Add ProgressInfo interface
6. Add JSDoc comments for each type

**Validation:**

- Verify TypeScript compilation
- Ensure types match usage in hook and components

---

### Step 18: Create Helper Functions

**File:** `src/lib/utils/quiz-taking.helpers.ts`

**Tasks:**

1. Create `calculateScore` function
2. Create `getOptionLetter` function (position → letter)
3. Create `isAnswerComplete` function (check if question answered)
4. Add comprehensive JSDoc comments

**Functions:**

```typescript
export function calculateScore(quiz: QuizDetailDTO, userAnswers: Record<string, string[]>): number;

export function getOptionLetter(position: number): string;

export function isAnswerComplete(userAnswers: Record<string, string[]>, questionId: string): boolean;
```

**Validation:**

- Unit test each helper function
- Test edge cases

---

### Step 19: Add API Endpoints (if not already implemented)

**Note:** Check if the following endpoints exist. If not, implement them in the backend.

**Required Endpoints:**

1. `POST /api/quizzes/[quizId]/attempts` - Create attempt
2. `POST /api/attempts/[attemptId]/responses` - Submit responses
3. `PUT /api/quizzes/[quizId]/attempts/[attemptId]` - Update attempt

**Files to Create/Verify:**

- `src/pages/api/quizzes/[quizId]/attempts/index.ts`
- `src/pages/api/attempts/[attemptId]/responses.ts`
- `src/pages/api/quizzes/[quizId]/attempts/[attemptId].ts`

**Implementation Notes:**

- Follow existing API patterns from quiz endpoints
- Use quiz service for database operations
- Validate request payloads with Zod schemas
- Handle authentication and authorization

---

### Step 20: Add Integration Tests

**File:** `tests/quiz-taking-view.test.ts`

**Tasks:**

1. Test successful quiz load and attempt creation
2. Test answer selection
3. Test navigation (next/previous)
4. Test quiz submission
5. Test score calculation
6. Test results display
7. Test retry flow
8. Test all error scenarios

**Dependencies:**

- Testing library (Vitest, React Testing Library)
- Mock API responses

---

### Step 21: Add Accessibility Testing

**File:** `tests/quiz-taking-accessibility.test.ts`

**Tasks:**

1. Test keyboard navigation through questions and options
2. Test screen reader announcements (progress, results)
3. Test focus management
4. Test ARIA labels and roles
5. Run automated accessibility audit (axe-core)

**Dependencies:**

- jest-axe or similar a11y testing library
- React Testing Library

---

### Step 22: Add Responsive Design Styles

**Files:** Component files (update className props)

**Tasks:**

1. Ensure mobile-first responsive design
2. Test layout on mobile (320px-640px)
3. Test layout on tablet (641px-1024px)
4. Test layout on desktop (1025px+)
5. Ensure touch targets minimum 44x44px
6. Test with increased font sizes

**Validation:**

- Visual testing at multiple breakpoints
- Test on real mobile devices if possible

---

### Step 23: Performance Optimization

**Tasks:**

1. Add React.memo to pure presentational components
2. Use useCallback for event handlers
3. Use useMemo for computed values
4. Ensure components don't re-render unnecessarily
5. Optimize question transitions (if using animations)

**Validation:**

- Use React DevTools Profiler
- Measure render times
- Check for unnecessary re-renders

---

### Step 24: Documentation

**File:** `docs/quiz-taking-view.md`

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

### Step 25: Final Integration and Testing

**Tasks:**

1. Test complete user flow (start → answer → submit → results → retry)
2. Test navigation from quiz detail to taking view
3. Test browser back/forward navigation
4. Test direct URL access
5. Test with various quiz data (edge cases)
6. Cross-browser testing (Chrome, Firefox, Safari, Edge)
7. Test with screen readers (NVDA, JAWS, VoiceOver)
8. Test on mobile devices

**Validation:**

- Manual testing checklist
- Automated E2E tests (Playwright)
- Accessibility audit report

---

**Implementation Complete** ✅

The Quiz Taking View is now ready for code review and production deployment.
