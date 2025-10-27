# View Implementation Plan: Quiz Results/Score Display

## 1. Overview

The Quiz Results view displays the final score and detailed feedback after a user completes a quiz. It serves as the completion page for the quiz-taking experience (US-007), providing users with immediate feedback on their performance. The view is accessible to all users (both authenticated and unauthenticated), with the key difference being that authenticated users have their attempts persisted in the database while anonymous users see session-only results.

The view implements a comprehensive results display including:
- **Final Score**: Percentage and fraction (e.g., "8/10 - 80%")
- **Performance Feedback**: Visual indicators and contextual messages based on score
- **Question Review**: Detailed breakdown of each question with correct/incorrect indicators
- **Answer Comparison**: Side-by-side view of user's answer vs. correct answer
- **Retry Functionality**: Option to retake the quiz
- **Navigation Options**: Return to quiz list, share results (future), or take another quiz

The view supports both immediate results display (after quiz submission) and historical results viewing (for authenticated users accessing past attempts).

## 2. Navigation in Astro

This implementation uses Astro's client-side navigation for smooth transitions and state preservation during quiz interactions.

### 2.1 Client-Side Navigation API

**Using navigate() for programmatic navigation:**
```typescript
import { navigate } from 'astro:transitions/client';

// Navigate to results after quiz submission
navigate(`/quizzes/${quizId}/results?attemptId=${attemptId}`);

// Navigate back to quiz taking page for retry
navigate(`/quizzes/${quizId}/take`);

// Navigate to quiz list
navigate('/');
```

**Key benefits:**
- No full page reload between quiz taking → results
- Smooth transitions with View Transitions API
- Maintains quiz state during navigation
- Better performance than `window.location.href`
- Supports browser back/forward buttons

### 2.2 Using Links for Better Accessibility

For navigation elements, prefer native `<a>` tags over `onClick` handlers:

```typescript
// ✅ Better approach - semantic HTML with accessibility
<Button asChild>
  <a href={`/quizzes/${quizId}/take`}>
    Retry Quiz
  </a>
</Button>

// ✅ Also good for external actions
<Button onClick={handleShareResults}>
  Share Results
</Button>

// ❌ Avoid for navigation
<Button onClick={() => navigate(`/quizzes/${quizId}/take`)}>
  Retry Quiz
</Button>
```

**Benefits of using `<a>` tags for navigation:**
- Works without JavaScript
- Supports right-click "Open in new tab"
- Proper keyboard navigation (Tab key)
- Screen reader accessibility
- Browser context menu support
- SEO-friendly

### 2.3 View Transitions Setup

Ensure your layout includes View Transitions for smooth animations:

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

With View Transitions enabled, both `<a>` tags and `navigate()` will automatically use smooth transitions between quiz pages.

## 3. View Routing

**Path**: `/quizzes/:quizId/results`

**Query Parameters**:
- `attemptId` (optional): For authenticated users viewing historical attempts
- Without `attemptId`: Shows results from current session (for anonymous users or immediate post-submission)

**Access Control**:
- Public route (accessible to all users, both authenticated and unauthenticated)
- No authentication required (per PRD: "The result is displayed upon completion for all users")
- However, historical attempts are only available to authenticated users

**Route Configuration**:
```typescript
// src/pages/quizzes/[id]/results.astro
---
// Public route - accessible to all users
// Authenticated users can view historical attempts via attemptId
// Anonymous users see session-only results
---
```

**Navigation Flow**:
1. **Immediate Results (Post-Submission)**:
   - User completes quiz on `/quizzes/:id/take`
   - Submits answers via API
   - API returns attempt data
   - Navigate to `/quizzes/:id/results?attemptId={id}` (authenticated) or `/quizzes/:id/results` with session state (anonymous)

2. **Historical Results (Authenticated Only)**:
   - User views attempt history on profile/dashboard
   - Clicks on past attempt
   - Navigate to `/quizzes/:id/results?attemptId={id}`

## 4. Component Structure

```
QuizResultsPage (Astro - src/pages/quizzes/[id]/results.astro)
└── Layout (Astro - uses existing Layout.astro)
    └── QuizResultsContainer (React - src/components/QuizResults/QuizResultsContainer.tsx)
        ├── ResultsHeader (React - src/components/QuizResults/ResultsHeader.tsx)
        │   ├── QuizTitle (displays quiz metadata)
        │   └── BackButton (return to quiz list)
        ├── ScoreCard (React - src/components/QuizResults/ScoreCard.tsx)
        │   ├── ScoreDisplay (large percentage/fraction display)
        │   ├── ScoreVisualization (circular progress or bar chart)
        │   └── PerformanceFeedback (contextual message based on score)
        ├── LoadingSpinner (React - src/components/ui/LoadingSpinner.tsx) [conditional]
        ├── ErrorAlert (React - src/components/ui/Alert.tsx) [conditional]
        ├── QuestionReviewList (React - src/components/QuizResults/QuestionReviewList.tsx) [conditional]
        │   └── QuestionReviewItem (React - src/components/QuizResults/QuestionReviewItem.tsx) [multiple]
        │       ├── QuestionText (displays question)
        │       ├── AnswerComparison (React - src/components/QuizResults/AnswerComparison.tsx)
        │       │   ├── UserAnswer (with correct/incorrect indicator)
        │       │   └── CorrectAnswer (if user was incorrect)
        │       └── ExplanationText (optional, future enhancement)
        └── ResultsActions (React - src/components/QuizResults/ResultsActions.tsx)
            ├── RetryButton (navigate to take quiz again)
            ├── ViewQuizDetailsButton (navigate to quiz detail page)
            └── ShareResultsButton (future enhancement)
```

## 5. Component Details

### 5.1 QuizResultsPage (Astro)

**Description**: The main Astro page component that serves as the entry point for the Quiz Results view. It's a static page that hydrates the React components on the client side.

**Main Elements**:
- Layout wrapper (uses existing Layout.astro)
- Server-side data fetching for initial attempt data (if attemptId provided)
- Client-side React container with `client:load` directive

**Handled Events**: None (static page)

**Validation**:
- Check if quiz exists
- Check if attemptId is valid (if provided)
- For authenticated users: verify attempt ownership

**Types**: None directly

**Props**: None (data passed via URL params)

**Implementation Notes**:
```astro
---
import Layout from '@/layouts/Layout.astro';
import QuizResultsContainer from '@/components/QuizResults/QuizResultsContainer';

const { id: quizId } = Astro.params;
const { attemptId } = Astro.url.searchParams;

// Optional: Fetch initial data server-side for SEO and performance
// For anonymous users, data comes from client-side session state
---

<Layout title="Quiz Results | QuizStack">
  <QuizResultsContainer
    client:load
    quizId={quizId}
    attemptId={attemptId}
  />
</Layout>
```

### 5.2 QuizResultsContainer (React)

**Description**: The main React container component that orchestrates the entire results display. It manages data fetching for both the quiz and attempt data, handles loading and error states, and coordinates all child components.

**Main Elements**:
- `<ResultsHeader />` - Quiz title and navigation
- `<LoadingSpinner />` if loading
- `<ErrorAlert />` if error exists
- `<ScoreCard />` if data loaded
- `<QuestionReviewList />` if data loaded
- `<ResultsActions />` if data loaded

**Handled Events**:
- `onRetry`: Triggered when user clicks retry button
- `onShare`: Triggered when user clicks share button (future)
- `onBackToQuiz`: Navigate to quiz detail page

**Validation**:
- Validate quiz and attempt data exists
- Check attempt belongs to current user (if authenticated)

**Types**:
- `QuizResultsViewState` (ViewModel)
- `QuizAttemptWithDetails` (includes quiz, questions, responses)

**Props**:
```typescript
interface QuizResultsContainerProps {
  quizId: string;
  attemptId?: string; // Optional for anonymous users
}
```

**State Management**:
- Uses `useQuizResults` custom hook to fetch and manage results data
- Manages loading, error, and data states
- For anonymous users: retrieves attempt data from session storage or React context

**Implementation Notes**:
```typescript
export function QuizResultsContainer({ quizId, attemptId }: QuizResultsContainerProps) {
  const {
    quiz,
    attempt,
    isLoading,
    error,
    refetch
  } = useQuizResults(quizId, attemptId);

  if (isLoading) {
    return <LoadingSpinner message="Loading your results..." />;
  }

  if (error) {
    return (
      <ErrorAlert
        title="Failed to Load Results"
        message={error}
        onRetry={refetch}
      />
    );
  }

  if (!quiz || !attempt) {
    return (
      <ErrorAlert
        title="Results Not Found"
        message="The quiz results you're looking for could not be found."
      />
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <ResultsHeader quiz={quiz} />
      <ScoreCard attempt={attempt} />
      <QuestionReviewList
        questions={quiz.questions}
        responses={attempt.responses}
      />
      <ResultsActions quizId={quizId} />
    </div>
  );
}
```

### 5.3 ResultsHeader (React)

**Description**: Header component that displays the quiz title, metadata, and navigation options at the top of the results page.

**Main Elements**:
- `<header>` with Tailwind classes
- `<Button>` for back navigation (to quiz list or dashboard)
- `<h1>` for quiz title
- `<p>` for quiz metadata (completion date, attempt number)

**Handled Events**:
- `onClick` for back button

**Validation**: None

**Types**:
- `QuizDTO` (from types.ts)

**Props**:
```typescript
interface ResultsHeaderProps {
  quiz: QuizDTO;
  completedAt?: string; // ISO timestamp
  attemptNumber?: number; // For authenticated users
}
```

**Implementation Notes**:
```typescript
export function ResultsHeader({ quiz, completedAt, attemptNumber }: ResultsHeaderProps) {
  const formattedDate = completedAt
    ? format(new Date(completedAt), 'PPpp')
    : null;

  return (
    <header className="space-y-4">
      <Button variant="ghost" asChild>
        <a href="/">
          ← Back to Quizzes
        </a>
      </Button>
      <div>
        <h1 className="text-4xl font-bold">{quiz.title}</h1>
        {formattedDate && (
          <p className="text-muted-foreground mt-2">
            Completed on {formattedDate}
            {attemptNumber && ` • Attempt #${attemptNumber}`}
          </p>
        )}
      </div>
    </header>
  );
}
```

### 5.4 ScoreCard (React)

**Description**: Prominent card component that displays the user's final score, visual representation, and performance feedback. This is the primary result display component.

**Main Elements**:
- `<Card>` wrapper from Shadcn/ui
- `<ScoreDisplay>` - Large text showing percentage and fraction
- `<ScoreVisualization>` - Circular progress indicator or bar chart
- `<PerformanceFeedback>` - Contextual message based on score
- Performance badges (e.g., "Perfect Score!", "Great Job!", "Keep Practicing")

**Handled Events**: None (display only)

**Validation**: None

**Types**:
- `QuizAttemptDTO` (from types.ts)
- `ScoreData` (computed from attempt)

**Props**:
```typescript
interface ScoreCardProps {
  attempt: QuizAttemptDTO;
  totalQuestions: number;
}
```

**Computed Properties**:
- `correctAnswers`: Count of correct responses
- `percentage`: (correctAnswers / totalQuestions) * 100
- `performanceLevel`: Categorize score (excellent, good, fair, needs improvement)
- `feedbackMessage`: Contextual message based on performance level

**Implementation Notes**:
```typescript
export function ScoreCard({ attempt, totalQuestions }: ScoreCardProps) {
  const correctAnswers = attempt.responses.filter(r => r.is_correct).length;
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);

  const getPerformanceLevel = (pct: number) => {
    if (pct === 100) return 'perfect';
    if (pct >= 80) return 'excellent';
    if (pct >= 60) return 'good';
    if (pct >= 40) return 'fair';
    return 'needs-improvement';
  };

  const getFeedbackMessage = (level: string) => {
    const messages = {
      perfect: "Perfect score! Outstanding work! 🎉",
      excellent: "Excellent work! You really know your stuff! 🌟",
      good: "Good job! You're on the right track! 👍",
      fair: "Not bad! Keep practicing to improve! 💪",
      'needs-improvement': "Keep studying! You'll get better with practice! 📚"
    };
    return messages[level];
  };

  const performanceLevel = getPerformanceLevel(percentage);
  const feedbackMessage = getFeedbackMessage(performanceLevel);

  return (
    <Card className="p-8 text-center space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Score</h2>
        <div className="text-6xl font-bold text-primary">
          {percentage}%
        </div>
        <div className="text-xl text-muted-foreground mt-2">
          {correctAnswers} out of {totalQuestions} correct
        </div>
      </div>

      <div className="flex justify-center">
        <CircularProgress value={percentage} size="lg" />
      </div>

      <div className="pt-4 border-t">
        <p className="text-lg font-medium">{feedbackMessage}</p>
      </div>
    </Card>
  );
}
```

### 5.5 QuestionReviewList (React)

**Description**: Container component that renders a list of all questions with the user's responses and correct answers for review.

**Main Elements**:
- `<div>` wrapper with spacing
- Multiple `<QuestionReviewItem />` components (one per question)
- Section header: "Question Review"

**Handled Events**: None

**Validation**: None

**Types**:
- `QuestionDTO[]` (from types.ts)
- `QuizResponseDTO[]` (from types.ts)

**Props**:
```typescript
interface QuestionReviewListProps {
  questions: QuestionDTO[];
  responses: QuizResponseDTO[];
}
```

**Implementation Notes**:
```typescript
export function QuestionReviewList({ questions, responses }: QuestionReviewListProps) {
  // Match responses to questions
  const reviewItems = questions.map((question, index) => {
    const response = responses.find(r => r.question_id === question.id);
    return { question, response, number: index + 1 };
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Question Review</h2>
      <div className="space-y-4">
        {reviewItems.map((item) => (
          <QuestionReviewItem
            key={item.question.id}
            question={item.question}
            response={item.response}
            questionNumber={item.number}
          />
        ))}
      </div>
    </div>
  );
}
```

### 5.6 QuestionReviewItem (React)

**Description**: Individual question review card that displays a single question, the user's answer, and the correct answer with visual indicators.

**Main Elements**:
- `<Card>` wrapper from Shadcn/ui
- `<CardHeader>` with question number and text
- `<CardContent>` with answer comparison
- `<AnswerComparison>` component
- Correct/Incorrect icon badge
- Optional explanation text (future enhancement)

**Handled Events**: None

**Validation**: None

**Types**:
- `QuestionDTO` (from types.ts)
- `QuizResponseDTO` (from types.ts)
- `AnswerOptionDTO` (from types.ts)

**Props**:
```typescript
interface QuestionReviewItemProps {
  question: QuestionDTO;
  response?: QuizResponseDTO; // May be undefined if not answered
  questionNumber: number;
}
```

**Implementation Notes**:
```typescript
export function QuestionReviewItem({
  question,
  response,
  questionNumber
}: QuestionReviewItemProps) {
  const isCorrect = response?.is_correct ?? false;
  const userAnswer = question.answer_options.find(
    opt => opt.id === response?.selected_option_id
  );
  const correctAnswer = question.answer_options.find(opt => opt.is_correct);

  return (
    <Card className={cn(
      "border-l-4",
      isCorrect ? "border-l-success" : "border-l-destructive"
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Question {questionNumber}
              </span>
              {isCorrect ? (
                <Badge variant="default" className="bg-success">
                  ✓ Correct
                </Badge>
              ) : (
                <Badge variant="destructive">
                  ✗ Incorrect
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg">{question.question_text}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AnswerComparison
          userAnswer={userAnswer}
          correctAnswer={correctAnswer}
          isCorrect={isCorrect}
        />
      </CardContent>
    </Card>
  );
}
```

### 5.7 AnswerComparison (React)

**Description**: Component that displays the user's selected answer compared to the correct answer, with clear visual differentiation.

**Main Elements**:
- `<div>` wrapper with grid layout
- User answer section with icon
- Correct answer section (only shown if user was incorrect)
- Color-coded backgrounds

**Handled Events**: None

**Validation**: None

**Types**:
- `AnswerOptionDTO` (from types.ts)

**Props**:
```typescript
interface AnswerComparisonProps {
  userAnswer?: AnswerOptionDTO; // Undefined if not answered
  correctAnswer: AnswerOptionDTO;
  isCorrect: boolean;
}
```

**Implementation Notes**:
```typescript
export function AnswerComparison({
  userAnswer,
  correctAnswer,
  isCorrect
}: AnswerComparisonProps) {
  return (
    <div className="space-y-3">
      {/* User's Answer */}
      <div className={cn(
        "p-4 rounded-lg border-2",
        isCorrect
          ? "bg-success/10 border-success"
          : "bg-destructive/10 border-destructive"
      )}>
        <div className="text-sm font-medium mb-1">Your Answer:</div>
        <div className="flex items-center gap-2">
          {isCorrect ? (
            <span className="text-success">✓</span>
          ) : (
            <span className="text-destructive">✗</span>
          )}
          <span>{userAnswer?.option_text || "Not answered"}</span>
        </div>
      </div>

      {/* Correct Answer (only show if user was wrong) */}
      {!isCorrect && (
        <div className="p-4 rounded-lg border-2 bg-success/10 border-success">
          <div className="text-sm font-medium mb-1">Correct Answer:</div>
          <div className="flex items-center gap-2">
            <span className="text-success">✓</span>
            <span>{correctAnswer.option_text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 5.8 ResultsActions (React)

**Description**: Action buttons section at the bottom of results page, providing navigation options for next steps.

**Main Elements**:
- `<div>` wrapper with button group layout
- `<Button>` for retry quiz
- `<Button>` for view quiz details
- `<Button>` for share results (future enhancement)
- `<Button>` for back to quizzes

**Handled Events**:
- `onClick` for retry button
- `onClick` for view details button

**Validation**: None

**Types**: None

**Props**:
```typescript
interface ResultsActionsProps {
  quizId: string;
  onRetry?: () => void; // Optional callback for analytics
}
```

**Implementation Notes**:
```typescript
import { navigate } from 'astro:transitions/client';

export function ResultsActions({ quizId, onRetry }: ResultsActionsProps) {
  const handleRetry = () => {
    onRetry?.();
    navigate(`/quizzes/${quizId}/take`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t">
      <Button size="lg" onClick={handleRetry}>
        <svg /* retry icon */ />
        Retry Quiz
      </Button>

      <Button variant="outline" size="lg" asChild>
        <a href={`/quizzes/${quizId}`}>
          View Quiz Details
        </a>
      </Button>

      <Button variant="outline" size="lg" asChild>
        <a href="/">
          Back to Quizzes
        </a>
      </Button>

      {/* Future: Share button */}
      {/* <Button variant="secondary" size="lg">
        <svg  share icon  />
        Share Results
      </Button> */}
    </div>
  );
}
```

### 5.9 LoadingSpinner (React)

**Description**: Loading state indicator shown while results data is being fetched.

**Main Elements**:
- `<div>` with centered layout
- Spinner animation
- Loading message

**Handled Events**: None

**Validation**: None

**Types**: None

**Props**:
```typescript
interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}
```

**Usage**: Reuse existing component from `src/components/ui/LoadingSpinner.tsx`

### 5.10 ErrorAlert (React)

**Description**: Error display component that shows user-friendly error messages with optional retry functionality.

**Main Elements**:
- `<Alert>` wrapper from Shadcn/ui with variant="destructive"
- `<AlertTitle>` for error title
- `<AlertDescription>` for error message
- `<Button>` for retry action

**Handled Events**:
- `onRetry`: Called when user clicks retry button

**Validation**: None

**Types**: None

**Props**:
```typescript
interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}
```

**Usage**: Reuse existing component from `src/components/ui/Alert.tsx`

## 6. Types

### 6.1 Existing Types (from src/types.ts)

**QuizAttemptDTO**: Complete quiz attempt information
```typescript
interface QuizAttemptDTO {
  id: string;
  quiz_id: string;
  user_id: string | null; // Null for anonymous users
  started_at: string; // ISO8601 timestamp
  completed_at: string | null; // ISO8601 timestamp
  score: number; // 0-100 percentage
  total_questions: number;
  correct_answers: number;
  created_at: string;
  updated_at: string;
}
```

**QuizResponseDTO**: Individual question response
```typescript
interface QuizResponseDTO {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: string;
  is_correct: boolean;
  created_at: string;
}
```

**QuestionDTO**: Question with answer options
```typescript
interface QuestionDTO {
  id: string;
  quiz_id: string;
  question_text: string;
  order_index: number;
  answer_options: AnswerOptionDTO[];
  created_at: string;
  updated_at: string;
}
```

**AnswerOptionDTO**: Individual answer option
```typescript
interface AnswerOptionDTO {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}
```

### 6.2 New ViewModel Types

**QuizResultsViewState**: Overall results view state
```typescript
interface QuizResultsViewState {
  quiz: QuizDTO | null;
  attempt: QuizAttemptDTO | null;
  questions: QuestionDTO[];
  responses: QuizResponseDTO[];
  isLoading: boolean;
  error: string | null;
}
```

**QuizAttemptWithDetails**: Enhanced attempt data with all related information
```typescript
interface QuizAttemptWithDetails extends QuizAttemptDTO {
  quiz: QuizDTO;
  questions: QuestionDTO[];
  responses: QuizResponseDTO[];
}
```

**ScoreData**: Computed score information
```typescript
interface ScoreData {
  correctAnswers: number;
  totalQuestions: number;
  percentage: number;
  performanceLevel: 'perfect' | 'excellent' | 'good' | 'fair' | 'needs-improvement';
  feedbackMessage: string;
}
```

**QuestionReviewData**: Combined question and response data for review
```typescript
interface QuestionReviewData {
  question: QuestionDTO;
  response: QuizResponseDTO | null;
  questionNumber: number;
  userAnswer: AnswerOptionDTO | null;
  correctAnswer: AnswerOptionDTO;
  isCorrect: boolean;
}
```

### 6.3 API Response Types

**QuizAttemptResponse**: API response for GET /api/quizzes/:id/attempts/:attemptId
```typescript
interface QuizAttemptResponse {
  attempt: QuizAttemptDTO;
  quiz: QuizDTO;
  questions: QuestionDTO[];
  responses: QuizResponseDTO[];
}
```

## 7. State Management

### 7.1 Overview

State management for the Quiz Results view is handled through a custom React hook (`useQuizResults`) that encapsulates all data fetching logic and state. For anonymous users, results data is retrieved from session storage or React context (passed from the quiz taking page). For authenticated users, data is fetched from the API using the attemptId.

### 7.2 Custom Hook: useQuizResults

**Purpose**: Centralize all quiz results state management, including data fetching for quiz, attempt, and response data.

**Location**: `src/hooks/useQuizResults.ts`

**Hook Signature**:
```typescript
function useQuizResults(
  quizId: string,
  attemptId?: string
): {
  // Data
  quiz: QuizDTO | null;
  attempt: QuizAttemptDTO | null;
  questions: QuestionDTO[];
  responses: QuizResponseDTO[];
  scoreData: ScoreData | null;
  questionReviews: QuestionReviewData[];

  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  refetch: () => Promise<void>;
}
```

**Internal State**:
- `quiz`: Quiz metadata and content
- `attempt`: Quiz attempt data
- `questions`: All questions in the quiz
- `responses`: User's responses to questions
- `isLoading`: Loading state
- `error`: Error message if fetch fails

**Dependencies**:
- Uses `fetch` API to call GET /api/quizzes/:id/attempts/:attemptId
- For anonymous users: retrieves data from session storage or context
- Uses `useMemo` to compute derived data (scoreData, questionReviews)

**Behavior**:
- Fetches data on mount if attemptId is provided
- For anonymous users without attemptId: retrieves from session storage
- Computes score data and question reviews from raw data
- Handles errors and loading states
- Redirects to login if 401 (for authenticated-only historical attempts)

**Implementation Outline**:
```typescript
export function useQuizResults(quizId: string, attemptId?: string) {
  const [quiz, setQuiz] = useState<QuizDTO | null>(null);
  const [attempt, setAttempt] = useState<QuizAttemptDTO | null>(null);
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [responses, setResponses] = useState<QuizResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    if (attemptId) {
      // Authenticated user viewing historical attempt
      const response = await fetch(
        `/api/quizzes/${quizId}/attempts/${attemptId}`
      );

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          throw new Error('Authentication required');
        }
        throw new Error('Failed to load results');
      }

      const data: QuizAttemptResponse = await response.json();
      setQuiz(data.quiz);
      setAttempt(data.attempt);
      setQuestions(data.questions);
      setResponses(data.responses);
    } else {
      // Anonymous user or immediate post-submission
      // Retrieve from session storage or context
      const sessionData = sessionStorage.getItem(`quiz-results-${quizId}`);
      if (sessionData) {
        const data = JSON.parse(sessionData);
        setQuiz(data.quiz);
        setAttempt(data.attempt);
        setQuestions(data.questions);
        setResponses(data.responses);
      } else {
        throw new Error('Results not found. Please retake the quiz.');
      }
    }
  };

  useEffect(() => {
    fetchResults()
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [quizId, attemptId]);

  // Computed data
  const scoreData = useMemo(() => {
    if (!attempt || !questions.length) return null;
    return computeScoreData(attempt, questions.length);
  }, [attempt, questions]);

  const questionReviews = useMemo(() => {
    if (!questions.length || !responses.length) return [];
    return buildQuestionReviews(questions, responses);
  }, [questions, responses]);

  return {
    quiz,
    attempt,
    questions,
    responses,
    scoreData,
    questionReviews,
    isLoading,
    error,
    refetch: fetchResults,
  };
}
```

### 7.3 Session Storage Strategy (Anonymous Users)

**Challenge**: Anonymous users complete quizzes but don't have attempts saved to the database. How do we display results?

**Solution**: Store attempt data in session storage immediately after quiz submission, then retrieve it on the results page.

**Implementation**:

1. **On Quiz Submission** (in quiz taking page):
```typescript
// After submitting quiz
const resultsData = {
  quiz: quizData,
  attempt: {
    id: generateTempId(),
    quiz_id: quizId,
    user_id: null,
    completed_at: new Date().toISOString(),
    score: calculatedScore,
    total_questions: questions.length,
    correct_answers: correctCount,
  },
  questions: questions,
  responses: userResponses,
};

sessionStorage.setItem(
  `quiz-results-${quizId}`,
  JSON.stringify(resultsData)
);

navigate(`/quizzes/${quizId}/results`);
```

2. **On Results Page Load** (in useQuizResults hook):
```typescript
// Retrieve from session storage
const sessionData = sessionStorage.getItem(`quiz-results-${quizId}`);
if (sessionData) {
  const data = JSON.parse(sessionData);
  // Use this data for results display
}
```

**Limitations**:
- Data is lost when session ends (browser close)
- No historical access for anonymous users
- Data not persisted across devices
- This is acceptable per PRD: "Anonymous users can complete quizzes and see results, but attempts are not persisted"

### 7.4 State Flow

1. **Authenticated User - Immediate Results**:
   - User completes quiz on `/quizzes/:id/take`
   - Quiz submission creates attempt in database
   - API returns attemptId
   - Navigate to `/quizzes/:id/results?attemptId={id}`
   - useQuizResults fetches data from API
   - Results display

2. **Anonymous User - Immediate Results**:
   - User completes quiz
   - Results calculated client-side
   - Data stored in session storage
   - Navigate to `/quizzes/:id/results`
   - useQuizResults retrieves from session storage
   - Results display

3. **Authenticated User - Historical Results**:
   - User views past attempts (from profile/history page)
   - Clicks on specific attempt
   - Navigate to `/quizzes/:id/results?attemptId={id}`
   - useQuizResults fetches from API
   - Results display

4. **Error Recovery**:
   - API call fails
   - Error state set
   - ErrorAlert renders with retry button
   - User clicks retry
   - refetch() called
   - Process repeats

## 8. API Integration

### 8.1 Endpoint Details

**Endpoint**: `GET /api/quizzes/:quizId/attempts/:attemptId`

**Purpose**: Retrieve detailed results for a specific quiz attempt

**Authentication**:
- Required for authenticated users viewing historical attempts
- Not required for immediate post-submission results (data from session)

**Path Parameters**:
```typescript
{
  quizId: string;    // UUID of quiz
  attemptId: string; // UUID of attempt
}
```

**Response Type**: `QuizAttemptResponse`

**Response Structure**:
```typescript
{
  attempt: QuizAttemptDTO,
  quiz: QuizDTO,
  questions: QuestionDTO[],
  responses: QuizResponseDTO[]
}
```

**Example Response**:
```json
{
  "attempt": {
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
  "quiz": {
    "id": "223e4567-e89b-12d3-a456-426614174000",
    "title": "JavaScript Fundamentals",
    "description": "Test your JavaScript knowledge",
    "visibility": "public",
    "status": "published",
    "source": "manual",
    "user_id": "423e4567-e89b-12d3-a456-426614174000",
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z"
  },
  "questions": [
    {
      "id": "523e4567-e89b-12d3-a456-426614174000",
      "quiz_id": "223e4567-e89b-12d3-a456-426614174000",
      "question_text": "What is a closure in JavaScript?",
      "order_index": 0,
      "answer_options": [
        {
          "id": "623e4567-e89b-12d3-a456-426614174000",
          "question_id": "523e4567-e89b-12d3-a456-426614174000",
          "option_text": "A function that has access to its outer scope",
          "is_correct": true,
          "order_index": 0,
          "created_at": "2025-01-15T10:00:00Z",
          "updated_at": "2025-01-15T10:00:00Z"
        },
        {
          "id": "723e4567-e89b-12d3-a456-426614174000",
          "question_id": "523e4567-e89b-12d3-a456-426614174000",
          "option_text": "A type of loop",
          "is_correct": false,
          "order_index": 1,
          "created_at": "2025-01-15T10:00:00Z",
          "updated_at": "2025-01-15T10:00:00Z"
        }
      ],
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    }
  ],
  "responses": [
    {
      "id": "823e4567-e89b-12d3-a456-426614174000",
      "attempt_id": "123e4567-e89b-12d3-a456-426614174000",
      "question_id": "523e4567-e89b-12d3-a456-426614174000",
      "selected_option_id": "623e4567-e89b-12d3-a456-426614174000",
      "is_correct": true,
      "created_at": "2025-01-20T10:10:00Z"
    }
  ]
}
```

### 8.2 API Implementation

**Backend Endpoint**: `src/pages/api/quizzes/[quizId]/attempts/[attemptId].ts`

**Implementation Requirements**:
1. Validate attemptId exists
2. Validate quiz exists
3. Check attempt ownership (if authenticated)
4. Fetch attempt, quiz, questions, and responses
5. Join data and return structured response
6. Handle errors appropriately

**Pseudo-code**:
```typescript
export const GET: APIRoute = async ({ params, locals }) => {
  const { quizId, attemptId } = params;
  const { supabase, user } = locals;

  // Fetch attempt
  const { data: attempt, error: attemptError } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('quiz_id', quizId)
    .single();

  if (attemptError || !attempt) {
    return new Response(
      JSON.stringify({ error: 'Attempt not found' }),
      { status: 404 }
    );
  }

  // Check ownership (if authenticated)
  if (user && attempt.user_id !== user.id) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 403 }
    );
  }

  // Fetch related data
  const [quizData, questionsData, responsesData] = await Promise.all([
    supabase.from('quizzes').select('*').eq('id', quizId).single(),
    supabase.from('questions').select('*, answer_options(*)').eq('quiz_id', quizId).order('order_index'),
    supabase.from('quiz_responses').select('*').eq('attempt_id', attemptId),
  ]);

  return new Response(
    JSON.stringify({
      attempt,
      quiz: quizData.data,
      questions: questionsData.data,
      responses: responsesData.data,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

### 8.3 Error Response Handling

**404 Not Found** (Attempt doesn't exist):
```json
{
  "error": "Not Found",
  "message": "Quiz attempt not found"
}
```
Action: Display error alert with message "Results not found"

**403 Forbidden** (Attempt belongs to different user):
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to view these results"
}
```
Action: Display error alert with message "Access denied"

**401 Unauthorized** (Authentication required for historical attempts):
```json
{
  "error": "Unauthorized",
  "message": "Authentication is required to view historical results"
}
```
Action: Redirect to login page

**500 Internal Server Error**:
```json
{
  "error": "Internal Server Error",
  "message": "Failed to retrieve quiz results"
}
```
Action: Display error alert with retry option

### 8.4 Loading States

- **Initial Load**: Show full-page LoadingSpinner with message "Loading your results..."
- **Retry**: Show LoadingSpinner, clear error state

### 8.5 Data Computation

**Score Calculation** (for anonymous users, computed client-side):
```typescript
function computeScore(responses: QuizResponseDTO[], questions: QuestionDTO[]) {
  const correctAnswers = responses.filter(r => r.is_correct).length;
  const totalQuestions = questions.length;
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);

  return {
    correctAnswers,
    totalQuestions,
    percentage,
    score: percentage,
  };
}
```

**Question Review Data Building**:
```typescript
function buildQuestionReviews(
  questions: QuestionDTO[],
  responses: QuizResponseDTO[]
): QuestionReviewData[] {
  return questions.map((question, index) => {
    const response = responses.find(r => r.question_id === question.id);
    const userAnswer = question.answer_options.find(
      opt => opt.id === response?.selected_option_id
    );
    const correctAnswer = question.answer_options.find(opt => opt.is_correct)!;

    return {
      question,
      response: response || null,
      questionNumber: index + 1,
      userAnswer: userAnswer || null,
      correctAnswer,
      isCorrect: response?.is_correct ?? false,
    };
  });
}
```

## 9. User Interactions

### 9.1 View Results After Quiz Completion

**Interaction**: User completes quiz and is automatically redirected to results page

**User Flow**:
1. User completes quiz on `/quizzes/:id/take`
2. User submits final answers
3. Quiz submission processed (attempt saved for authenticated users)
4. Automatic navigation to `/quizzes/:id/results?attemptId={id}`
5. Results page loads with score and detailed review

**Expected Behavior**:
- Smooth transition from quiz taking to results
- No loss of data during navigation
- Results display immediately (no additional loading for session data)
- For authenticated users: results are persisted and can be viewed later
- For anonymous users: results shown but not saved permanently

**Implementation**:
```typescript
import { navigate } from 'astro:transitions/client';

// In quiz taking component after submission
const handleQuizSubmit = async (answers: AnswerSubmission[]) => {
  const { attemptId, responses } = await submitQuiz(quizId, answers);

  if (isAuthenticated) {
    // Navigate with attemptId for authenticated users
    navigate(`/quizzes/${quizId}/results?attemptId=${attemptId}`);
  } else {
    // Store in session storage and navigate for anonymous users
    storeResultsInSession(quizId, { attempt, quiz, questions, responses });
    navigate(`/quizzes/${quizId}/results`);
  }
};
```

### 9.2 Review Individual Questions

**Interaction**: User scrolls through question review list to see performance

**User Flow**:
1. User views results page with score at top
2. User scrolls down to question review section
3. User sees each question with their answer and correctness indicator
4. For incorrect answers, correct answer is displayed for learning

**Expected Behavior**:
- Clear visual distinction between correct (green) and incorrect (red) answers
- User's answer always displayed
- Correct answer shown only when user was wrong
- Easy to scan through multiple questions
- Responsive layout on mobile devices

**Edge Cases**:
- User didn't answer a question: Show "Not answered" state
- Question has no correct answer marked (data error): Show error state

### 9.3 Retry Quiz

**Interaction**: User clicks "Retry Quiz" button to take the quiz again

**User Flow**:
1. User views results page
2. User decides to retry for better score
3. User clicks "Retry Quiz" button
4. Navigate to `/quizzes/:id/take`
5. Fresh quiz attempt starts (new attempt record for authenticated users)

**Expected Behavior**:
- Smooth navigation to quiz taking page
- Previous attempt preserved (for authenticated users)
- New attempt starts fresh (no pre-filled answers)
- For authenticated users: attempt history maintained
- Uses client-side navigation for smooth transitions

**Implementation**:
```typescript
import { navigate } from 'astro:transitions/client';

const handleRetry = () => {
  // Optional: Track retry analytics
  trackEvent('quiz_retry', { quizId, previousScore: attempt.score });

  // Navigate using Astro's client-side navigation
  navigate(`/quizzes/${quizId}/take`);
};
```

### 9.4 Navigate to Quiz Details

**Interaction**: User clicks "View Quiz Details" to see quiz information

**User Flow**:
1. User views results page
2. User wants to learn more about the quiz
3. User clicks "View Quiz Details" button
4. Navigate to `/quizzes/:id`
5. Quiz detail page displays with description, metadata, and option to take quiz

**Expected Behavior**:
- Navigate to quiz detail page
- User can see quiz description, creator, etc.
- From there, user can retry quiz or return to list

**Implementation**:
```typescript
// Using <a> tag for better accessibility
<Button variant="outline" size="lg" asChild>
  <a href={`/quizzes/${quizId}`}>
    View Quiz Details
  </a>
</Button>
```

### 9.5 Return to Quiz List

**Interaction**: User clicks "Back to Quizzes" to return to main quiz list

**User Flow**:
1. User views results page
2. User is done reviewing results
3. User clicks "Back to Quizzes" button
4. Navigate to `/` or `/dashboard`
5. Quiz list displays

**Expected Behavior**:
- Navigate to main quiz list page
- For authenticated users: might go to dashboard
- For anonymous users: go to public quiz list

**Implementation**:
```typescript
// Simple link navigation
<Button variant="outline" size="lg" asChild>
  <a href="/">
    Back to Quizzes
  </a>
</Button>
```

### 9.6 Share Results (Future Enhancement)

**Interaction**: User clicks "Share Results" to share their score on social media or via link

**User Flow**:
1. User views results page
2. User is proud of score and wants to share
3. User clicks "Share Results" button
4. Share dialog opens with options:
   - Copy shareable link
   - Share on Twitter/X
   - Share on LinkedIn
   - Share via email

**Expected Behavior**:
- Generate shareable URL (e.g., `/quizzes/:id/results/share/:shareId`)
- Share page shows score but not detailed answers (privacy)
- Only available for authenticated users (optional design decision)

**Implementation** (future):
```typescript
const handleShare = async () => {
  const shareId = await generateShareLink(attemptId);
  const shareUrl = `${window.location.origin}/quizzes/${quizId}/results/share/${shareId}`;

  // Open share dialog
  setShareDialogOpen(true);
  setShareUrl(shareUrl);
};
```

### 9.7 View Historical Attempts (Authenticated Users)

**Interaction**: User views past quiz attempts from profile or dashboard

**User Flow**:
1. User navigates to profile or attempt history page
2. User sees list of past attempts with scores
3. User clicks on specific attempt to view details
4. Navigate to `/quizzes/:id/results?attemptId={id}`
5. Results page displays historical attempt data

**Expected Behavior**:
- Fetch data from API using attemptId
- Display attempt with completion date and attempt number
- Same results display as immediate post-submission
- Data is read-only (can't change answers)

**Implementation**:
```typescript
// From attempt history page
<Button variant="ghost" asChild>
  <a href={`/quizzes/${attempt.quiz_id}/results?attemptId=${attempt.id}`}>
    View Results
  </a>
</Button>
```

## 10. Conditions and Validation

### 10.1 Results Data Availability

**Condition**: Results data must be available to display the page

**Validation Location**: `useQuizResults` hook and `QuizResultsContainer` component

**Implementation**:
```typescript
// In useQuizResults hook
if (!attemptId && !sessionStorage.getItem(`quiz-results-${quizId}`)) {
  throw new Error('Results not found. Please retake the quiz.');
}

// In QuizResultsContainer
if (!quiz || !attempt) {
  return (
    <ErrorAlert
      title="Results Not Found"
      message="The quiz results you're looking for could not be found."
    />
  );
}
```

**UI Impact**:
- Show error alert if data not found
- Provide link to retake quiz
- No results display if data unavailable

### 10.2 Attempt Ownership (Authenticated Users)

**Condition**: Authenticated users can only view their own attempts

**Validation Location**: Backend API endpoint `/api/quizzes/:quizId/attempts/:attemptId`

**Implementation**:
```typescript
// In API endpoint
if (user && attempt.user_id !== user.id) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 403 }
  );
}
```

**UI Impact**:
- 403 error returned from API
- Error alert displayed: "You do not have permission to view these results"
- User redirected to their own dashboard or login

### 10.3 Quiz Exists

**Condition**: Quiz must exist to display results

**Validation Location**: Backend API endpoint

**Implementation**:
```typescript
// In API endpoint
const { data: quiz, error } = await supabase
  .from('quizzes')
  .select('*')
  .eq('id', quizId)
  .single();

if (error || !quiz) {
  return new Response(
    JSON.stringify({ error: 'Quiz not found' }),
    { status: 404 }
  );
}
```

**UI Impact**:
- 404 error returned
- Error alert displayed: "Quiz not found"
- Provide link to quiz list

### 10.4 Attempt is Completed

**Condition**: Attempt must be completed to show results

**Validation Location**: Backend API endpoint and client-side validation

**Implementation**:
```typescript
// In API endpoint
if (!attempt.completed_at) {
  return new Response(
    JSON.stringify({ error: 'Attempt not completed' }),
    { status: 400 }
  );
}
```

**UI Impact**:
- Error alert: "This quiz attempt is not yet completed"
- Redirect to quiz taking page to complete it

### 10.5 Data Loading States

**Condition**: Cannot display results while data is loading

**Validation Location**: `QuizResultsContainer` component

**Implementation**:
```typescript
if (isLoading) {
  return <LoadingSpinner message="Loading your results..." />;
}
```

**UI Impact**:
- Show loading spinner during data fetch
- Prevent interaction with non-existent UI elements
- Clear message indicating loading state

### 10.6 Error States

**Condition**: Display error UI when data fetching fails

**Validation Location**: `QuizResultsContainer` component

**Implementation**:
```typescript
if (error) {
  return (
    <ErrorAlert
      title="Failed to Load Results"
      message={error}
      onRetry={refetch}
    />
  );
}
```

**UI Impact**:
- Show error alert with specific error message
- Provide retry button for transient errors
- For auth errors: redirect to login

### 10.7 Anonymous User Limitations

**Condition**: Anonymous users cannot view historical attempts

**Validation Location**: UI navigation and API endpoint

**Implementation**:
```typescript
// In attempt history UI (don't show for anonymous users)
if (!isAuthenticated) {
  return null; // Don't render attempt history link
}

// In API endpoint (if somehow accessed)
if (!user) {
  return new Response(
    JSON.stringify({ error: 'Authentication required for historical results' }),
    { status: 401 }
  );
}
```

**UI Impact**:
- Attempt history feature not visible to anonymous users
- If accessed directly, redirect to login
- Anonymous users only see immediate post-submission results

### 10.8 Response Data Completeness

**Condition**: All responses must have corresponding questions

**Validation Location**: `buildQuestionReviews` function

**Implementation**:
```typescript
function buildQuestionReviews(
  questions: QuestionDTO[],
  responses: QuizResponseDTO[]
): QuestionReviewData[] {
  return questions.map((question) => {
    const response = responses.find(r => r.question_id === question.id);

    // Handle missing response (unanswered question)
    if (!response) {
      return {
        question,
        response: null,
        userAnswer: null,
        correctAnswer: question.answer_options.find(opt => opt.is_correct)!,
        isCorrect: false,
        questionNumber: question.order_index + 1,
      };
    }

    // Normal case
    // ...
  });
}
```

**UI Impact**:
- Unanswered questions shown with "Not answered" state
- Marked as incorrect (red border)
- Correct answer still displayed for learning

## 11. Error Handling

### 11.1 Error Categories

#### Authentication Errors (401)

**Scenario**: User session expired or unauthenticated user trying to access historical results

**Detection**: API returns 401 status code

**Handling**:
```typescript
import { navigate } from 'astro:transitions/client';

if (response.status === 401) {
  // Redirect to login page with redirect parameter
  navigate(`/login?redirect=/quizzes/${quizId}/results?attemptId=${attemptId}`);
  return;
}
```

**User Experience**:
- Automatic redirect to login page using Astro's client-side navigation
- Preserve intended destination in redirect parameter
- After login, return to results page
- No full page reload for better UX

**Prevention**:
- Check authentication before allowing historical results access
- Refresh session token automatically
- Show appropriate UI for anonymous vs authenticated users

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
- For session data: still works offline (data already loaded)

**Prevention**:
- Cache results data when possible
- Implement offline support (future enhancement)
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

**Prevention**:
- Comprehensive error logging on backend
- Monitor error rates and alert on spikes
- Have fallback mechanisms for critical failures

#### Not Found Errors (404)

**Scenario**: Quiz or attempt doesn't exist

**Detection**: API returns 404 status code

**Handling**:
```typescript
if (response.status === 404) {
  setError('Quiz results not found. The quiz or attempt may have been deleted.');
}
```

**User Experience**:
- Show error alert with helpful message
- Provide link to return to quiz list
- For immediate results: suggest retaking quiz

**Prevention**:
- Validate quiz exists before allowing quiz taking
- Handle cascade deletes properly (delete attempts when quiz deleted)
- Soft delete instead of hard delete (optional)

#### Forbidden Errors (403)

**Scenario**: User trying to view another user's attempt

**Detection**: API returns 403 status code

**Handling**:
```typescript
if (response.status === 403) {
  setError('You do not have permission to view these results.');
}
```

**User Experience**:
- Show error alert with permission message
- Redirect to user's own dashboard
- Don't expose existence of other users' attempts

**Prevention**:
- Always validate attempt ownership on backend
- Don't expose attempt URLs in public UI
- Use RLS policies in Supabase

### 11.2 Error Display Patterns

#### Full-Page Errors

**Usage**: For critical errors that prevent entire page functionality

**Implementation**:
```typescript
if (error) {
  return (
    <div className="container mx-auto py-16 text-center">
      <ErrorAlert
        title="Failed to Load Results"
        message={error}
        onRetry={refetch}
      />
      <Button className="mt-4" asChild>
        <a href="/">Return to Quizzes</a>
      </Button>
    </div>
  );
}
```

**Best For**:
- Results not found
- Authentication failures
- Network errors on initial load

#### Inline Errors

**Usage**: For partial errors that don't prevent viewing main content

**Implementation**:
```typescript
<div>
  {error && (
    <ErrorAlert
      message={error}
      onRetry={refetch}
      onDismiss={() => setError(null)}
    />
  )}
  {/* Rest of content */}
</div>
```

**Best For**:
- Failed to load optional content
- Transient errors that can be dismissed

#### Toast Notifications (Future Enhancement)

**Usage**: For transient errors or success messages

**Best For**:
- Share link copied
- Retry successful
- Temporary network issues

### 11.3 Error Recovery Strategies

#### Automatic Retry with Exponential Backoff

For transient network errors:

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
  setError(null);
  setIsLoading(true);
  await refetch();
  setIsLoading(false);
};
```

#### Fallback to Session Data

If API fails but session data exists:

```typescript
try {
  // Try API first
  await fetchFromAPI();
} catch (error) {
  // Fallback to session storage
  const sessionData = sessionStorage.getItem(`quiz-results-${quizId}`);
  if (sessionData) {
    console.warn('API failed, using session data:', error);
    setDataFromSession(JSON.parse(sessionData));
  } else {
    throw error; // No fallback available
  }
}
```

### 11.4 Error Logging

Implement comprehensive error logging for debugging:

```typescript
const logError = (error: Error, context: Record<string, any>) => {
  console.error('Quiz Results Error:', {
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
  await fetchResults();
} catch (error) {
  logError(error as Error, {
    component: 'QuizResultsContainer',
    action: 'fetchResults',
    quizId,
    attemptId,
    isAuthenticated,
  });
}
```

### 11.5 Edge Cases

#### Results Data Incomplete

**Scenario**: Some responses missing from attempt data

**Handling**:
```typescript
// Show what we have, mark missing as "Not answered"
const questionReviews = questions.map(q => {
  const response = responses.find(r => r.question_id === q.id);
  return {
    question: q,
    response: response || null,
    isCorrect: response?.is_correct ?? false,
    userAnswer: response ? findAnswer(response.selected_option_id) : null,
  };
});
```

#### Session Storage Full

**Scenario**: Session storage quota exceeded when storing results

**Handling**:
```typescript
try {
  sessionStorage.setItem(`quiz-results-${quizId}`, JSON.stringify(data));
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Clear old results and retry
    clearOldResults();
    sessionStorage.setItem(`quiz-results-${quizId}`, JSON.stringify(data));
  }
}
```

#### Browser Back Button

**Scenario**: User navigates back from results to quiz taking page

**Handling**:
- With View Transitions: Smooth navigation back
- Quiz taking state preserved or reset based on implementation
- Results still accessible if user goes forward again

#### Multiple Tabs

**Scenario**: User opens results in multiple tabs

**Handling**:
- Each tab has independent state
- Session storage shared across tabs
- API calls independent per tab
- No conflicts in data display

## 12. Implementation Steps

### Step 1: Set Up Project Structure

**Tasks**:
1. Create component directories:
   ```
   src/components/QuizResults/
   ├── QuizResultsContainer.tsx
   ├── ResultsHeader.tsx
   ├── ScoreCard.tsx
   ├── QuestionReviewList.tsx
   ├── QuestionReviewItem.tsx
   ├── AnswerComparison.tsx
   └── ResultsActions.tsx
   ```

2. Create hooks directory (if doesn't exist):
   ```
   src/hooks/
   └── useQuizResults.ts
   ```

3. Create types file (if needed):
   ```
   src/types/quiz-results.types.ts
   ```

**Verification**: Directory structure created, empty files in place

### Step 2: Define Types

**Tasks**:
1. Add new ViewModel types to `src/types/quiz-results.types.ts`:
   - `QuizResultsViewState`
   - `QuizAttemptWithDetails`
   - `ScoreData`
   - `QuestionReviewData`
   - `QuizAttemptResponse`

2. Export types from `src/types.ts` or `src/types/index.ts`

3. Ensure existing types are properly exported:
   - `QuizAttemptDTO`
   - `QuizResponseDTO`
   - `QuestionDTO`
   - `AnswerOptionDTO`

**Code**:
```typescript
// src/types/quiz-results.types.ts
export interface QuizResultsViewState {
  quiz: QuizDTO | null;
  attempt: QuizAttemptDTO | null;
  questions: QuestionDTO[];
  responses: QuizResponseDTO[];
  isLoading: boolean;
  error: string | null;
}

export interface QuizAttemptWithDetails extends QuizAttemptDTO {
  quiz: QuizDTO;
  questions: QuestionDTO[];
  responses: QuizResponseDTO[];
}

export interface ScoreData {
  correctAnswers: number;
  totalQuestions: number;
  percentage: number;
  performanceLevel: 'perfect' | 'excellent' | 'good' | 'fair' | 'needs-improvement';
  feedbackMessage: string;
}

export interface QuestionReviewData {
  question: QuestionDTO;
  response: QuizResponseDTO | null;
  questionNumber: number;
  userAnswer: AnswerOptionDTO | null;
  correctAnswer: AnswerOptionDTO;
  isCorrect: boolean;
}

export interface QuizAttemptResponse {
  attempt: QuizAttemptDTO;
  quiz: QuizDTO;
  questions: QuestionDTO[];
  responses: QuizResponseDTO[];
}
```

**Verification**: TypeScript types compile without errors, can import types in components

### Step 3: Implement Backend API Endpoint

**Tasks**:
1. Create `src/pages/api/quizzes/[quizId]/attempts/[attemptId].ts`
2. Implement GET handler
3. Add authentication check for attempt ownership
4. Fetch attempt, quiz, questions, and responses
5. Join data properly (questions with answer_options)
6. Return structured response
7. Handle all error cases (404, 403, 500)

**Code Outline**:
```typescript
// src/pages/api/quizzes/[quizId]/attempts/[attemptId].ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals }) => {
  const { quizId, attemptId } = params;
  const { supabase, user } = locals;

  try {
    // Fetch attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('quiz_id', quizId)
      .single();

    if (attemptError || !attempt) {
      return new Response(
        JSON.stringify({ error: 'Attempt not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check ownership (if user is authenticated)
    if (user && attempt.user_id && attempt.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if attempt is completed
    if (!attempt.completed_at) {
      return new Response(
        JSON.stringify({ error: 'Attempt not completed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch related data in parallel
    const [quizData, questionsData, responsesData] = await Promise.all([
      supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single(),

      supabase
        .from('questions')
        .select(`
          *,
          answer_options (*)
        `)
        .eq('quiz_id', quizId)
        .order('order_index'),

      supabase
        .from('quiz_responses')
        .select('*')
        .eq('attempt_id', attemptId)
    ]);

    if (quizData.error || !quizData.data) {
      return new Response(
        JSON.stringify({ error: 'Quiz not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build response
    const response = {
      attempt,
      quiz: quizData.data,
      questions: questionsData.data || [],
      responses: responsesData.data || [],
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

**Verification**:
- Test endpoint with valid attemptId
- Test with invalid attemptId (404)
- Test with wrong user (403)
- Test with unauthenticated request
- Verify response structure matches type

### Step 4: Implement useQuizResults Hook

**Tasks**:
1. Create `src/hooks/useQuizResults.ts`
2. Implement data fetching logic (API vs session storage)
3. Manage loading, error, and data states
4. Implement refetch functionality
5. Compute derived data (scoreData, questionReviews)
6. Handle authentication errors (redirect to login)
7. Add TypeScript types for parameters and return value

**Code**:
```typescript
// src/hooks/useQuizResults.ts
import { useState, useEffect, useMemo } from 'react';
import { navigate } from 'astro:transitions/client';
import type {
  QuizDTO,
  QuizAttemptDTO,
  QuestionDTO,
  QuizResponseDTO,
  QuizAttemptResponse,
  ScoreData,
  QuestionReviewData
} from '@/types';

export function useQuizResults(quizId: string, attemptId?: string) {
  const [quiz, setQuiz] = useState<QuizDTO | null>(null);
  const [attempt, setAttempt] = useState<QuizAttemptDTO | null>(null);
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [responses, setResponses] = useState<QuizResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (attemptId) {
        // Fetch from API for authenticated users with attemptId
        const response = await fetch(
          `/api/quizzes/${quizId}/attempts/${attemptId}`
        );

        if (!response.ok) {
          if (response.status === 401) {
            navigate(`/login?redirect=/quizzes/${quizId}/results?attemptId=${attemptId}`);
            throw new Error('Authentication required');
          }
          if (response.status === 404) {
            throw new Error('Results not found');
          }
          if (response.status === 403) {
            throw new Error('You do not have permission to view these results');
          }
          throw new Error('Failed to load results');
        }

        const data: QuizAttemptResponse = await response.json();
        setQuiz(data.quiz);
        setAttempt(data.attempt);
        setQuestions(data.questions);
        setResponses(data.responses);
      } else {
        // Retrieve from session storage for anonymous users
        const sessionKey = `quiz-results-${quizId}`;
        const sessionData = sessionStorage.getItem(sessionKey);

        if (!sessionData) {
          throw new Error('Results not found. Please retake the quiz.');
        }

        const data = JSON.parse(sessionData);
        setQuiz(data.quiz);
        setAttempt(data.attempt);
        setQuestions(data.questions);
        setResponses(data.responses);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [quizId, attemptId]);

  // Compute score data
  const scoreData = useMemo<ScoreData | null>(() => {
    if (!attempt || !questions.length) return null;

    const correctAnswers = responses.filter(r => r.is_correct).length;
    const totalQuestions = questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    let performanceLevel: ScoreData['performanceLevel'];
    let feedbackMessage: string;

    if (percentage === 100) {
      performanceLevel = 'perfect';
      feedbackMessage = "Perfect score! Outstanding work! 🎉";
    } else if (percentage >= 80) {
      performanceLevel = 'excellent';
      feedbackMessage = "Excellent work! You really know your stuff! 🌟";
    } else if (percentage >= 60) {
      performanceLevel = 'good';
      feedbackMessage = "Good job! You're on the right track! 👍";
    } else if (percentage >= 40) {
      performanceLevel = 'fair';
      feedbackMessage = "Not bad! Keep practicing to improve! 💪";
    } else {
      performanceLevel = 'needs-improvement';
      feedbackMessage = "Keep studying! You'll get better with practice! 📚";
    }

    return {
      correctAnswers,
      totalQuestions,
      percentage,
      performanceLevel,
      feedbackMessage,
    };
  }, [attempt, questions, responses]);

  // Build question review data
  const questionReviews = useMemo<QuestionReviewData[]>(() => {
    if (!questions.length) return [];

    return questions.map((question, index) => {
      const response = responses.find(r => r.question_id === question.id);
      const userAnswer = question.answer_options.find(
        opt => opt.id === response?.selected_option_id
      );
      const correctAnswer = question.answer_options.find(opt => opt.is_correct)!;

      return {
        question,
        response: response || null,
        questionNumber: index + 1,
        userAnswer: userAnswer || null,
        correctAnswer,
        isCorrect: response?.is_correct ?? false,
      };
    });
  }, [questions, responses]);

  return {
    quiz,
    attempt,
    questions,
    responses,
    scoreData,
    questionReviews,
    isLoading,
    error,
    refetch: fetchResults,
  };
}
```

**Verification**:
- Hook returns correct data structure
- Handles API errors correctly
- Handles session storage fallback
- Computed data is accurate
- Loading states work correctly

### Step 5: Implement Presentational Components

**Tasks**:

1. **ResultsHeader.tsx**:
   - Display quiz title
   - Show completion date and attempt number
   - Back button to quiz list

2. **LoadingSpinner.tsx** (or reuse existing):
   - Centered spinner with message

3. **ErrorAlert.tsx** (reuse existing):
   - Use Shadcn/ui Alert component
   - Add retry button

**Code for ResultsHeader**:
```typescript
// src/components/QuizResults/ResultsHeader.tsx
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import type { QuizDTO } from '@/types';

interface ResultsHeaderProps {
  quiz: QuizDTO;
  completedAt?: string;
  attemptNumber?: number;
}

export function ResultsHeader({ quiz, completedAt, attemptNumber }: ResultsHeaderProps) {
  const formattedDate = completedAt
    ? format(new Date(completedAt), 'PPpp')
    : null;

  return (
    <header className="space-y-4">
      <Button variant="ghost" asChild>
        <a href="/">
          ← Back to Quizzes
        </a>
      </Button>
      <div>
        <h1 className="text-4xl font-bold">{quiz.title}</h1>
        {formattedDate && (
          <p className="text-muted-foreground mt-2">
            Completed on {formattedDate}
            {attemptNumber && ` • Attempt #${attemptNumber}`}
          </p>
        )}
      </div>
    </header>
  );
}
```

**Verification**: Components render correctly in isolation

### Step 6: Implement ScoreCard Component

**Tasks**:
1. Create `src/components/QuizResults/ScoreCard.tsx`
2. Display large percentage and fraction
3. Add circular progress visualization (using Shadcn/ui Progress or custom)
4. Show performance feedback message
5. Add performance badges
6. Implement responsive styling

**Code**:
```typescript
// src/components/QuizResults/ScoreCard.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { ScoreData } from '@/types/quiz-results.types';

interface ScoreCardProps {
  scoreData: ScoreData;
}

export function ScoreCard({ scoreData }: ScoreCardProps) {
  const { correctAnswers, totalQuestions, percentage, performanceLevel, feedbackMessage } = scoreData;

  const getBadgeVariant = (level: ScoreData['performanceLevel']) => {
    if (level === 'perfect' || level === 'excellent') return 'default';
    if (level === 'good') return 'secondary';
    return 'destructive';
  };

  return (
    <Card className="p-8 text-center space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Score</h2>
        <div className="text-6xl font-bold text-primary">
          {percentage}%
        </div>
        <div className="text-xl text-muted-foreground mt-2">
          {correctAnswers} out of {totalQuestions} correct
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <Progress value={percentage} className="h-4" />
      </div>

      <div className="pt-4 border-t">
        <Badge variant={getBadgeVariant(performanceLevel)} className="mb-2">
          {performanceLevel.replace('-', ' ').toUpperCase()}
        </Badge>
        <p className="text-lg font-medium">{feedbackMessage}</p>
      </div>
    </Card>
  );
}
```

**Verification**: Score displays correctly with proper styling and visualization

### Step 7: Implement AnswerComparison Component

**Tasks**:
1. Create `src/components/QuizResults/AnswerComparison.tsx`
2. Display user's answer with color coding
3. Show correct answer (if user was wrong)
4. Add visual indicators (checkmarks, x marks)
5. Implement responsive layout

**Code**:
```typescript
// src/components/QuizResults/AnswerComparison.tsx
import { cn } from '@/lib/utils';
import type { AnswerOptionDTO } from '@/types';

interface AnswerComparisonProps {
  userAnswer?: AnswerOptionDTO;
  correctAnswer: AnswerOptionDTO;
  isCorrect: boolean;
}

export function AnswerComparison({ userAnswer, correctAnswer, isCorrect }: AnswerComparisonProps) {
  return (
    <div className="space-y-3">
      {/* User's Answer */}
      <div className={cn(
        "p-4 rounded-lg border-2",
        isCorrect
          ? "bg-success/10 border-success"
          : "bg-destructive/10 border-destructive"
      )}>
        <div className="text-sm font-medium mb-1">Your Answer:</div>
        <div className="flex items-center gap-2">
          {isCorrect ? (
            <span className="text-success">✓</span>
          ) : (
            <span className="text-destructive">✗</span>
          )}
          <span>{userAnswer?.option_text || "Not answered"}</span>
        </div>
      </div>

      {/* Correct Answer (only show if user was wrong) */}
      {!isCorrect && (
        <div className="p-4 rounded-lg border-2 bg-success/10 border-success">
          <div className="text-sm font-medium mb-1">Correct Answer:</div>
          <div className="flex items-center gap-2">
            <span className="text-success">✓</span>
            <span>{correctAnswer.option_text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Verification**: Answer comparison displays correctly with proper color coding

### Step 8: Implement QuestionReviewItem Component

**Tasks**:
1. Create `src/components/QuizResults/QuestionReviewItem.tsx`
2. Display question number and text
3. Add correct/incorrect badge
4. Use Card component from Shadcn/ui
5. Integrate AnswerComparison component
6. Add color-coded border

**Code**:
```typescript
// src/components/QuizResults/QuestionReviewItem.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AnswerComparison } from './AnswerComparison';
import type { QuestionReviewData } from '@/types/quiz-results.types';

interface QuestionReviewItemProps {
  reviewData: QuestionReviewData;
}

export function QuestionReviewItem({ reviewData }: QuestionReviewItemProps) {
  const { question, questionNumber, userAnswer, correctAnswer, isCorrect } = reviewData;

  return (
    <Card className={cn(
      "border-l-4",
      isCorrect ? "border-l-success" : "border-l-destructive"
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Question {questionNumber}
              </span>
              {isCorrect ? (
                <Badge variant="default" className="bg-success">
                  ✓ Correct
                </Badge>
              ) : (
                <Badge variant="destructive">
                  ✗ Incorrect
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg">{question.question_text}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AnswerComparison
          userAnswer={userAnswer || undefined}
          correctAnswer={correctAnswer}
          isCorrect={isCorrect}
        />
      </CardContent>
    </Card>
  );
}
```

**Verification**: Question review item displays correctly with all elements

### Step 9: Implement QuestionReviewList Component

**Tasks**:
1. Create `src/components/QuizResults/QuestionReviewList.tsx`
2. Render section header
3. Map over question reviews and render QuestionReviewItem components
4. Add spacing and layout

**Code**:
```typescript
// src/components/QuizResults/QuestionReviewList.tsx
import { QuestionReviewItem } from './QuestionReviewItem';
import type { QuestionReviewData } from '@/types/quiz-results.types';

interface QuestionReviewListProps {
  questionReviews: QuestionReviewData[];
}

export function QuestionReviewList({ questionReviews }: QuestionReviewListProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Question Review</h2>
      <div className="space-y-4">
        {questionReviews.map((reviewData) => (
          <QuestionReviewItem
            key={reviewData.question.id}
            reviewData={reviewData}
          />
        ))}
      </div>
    </div>
  );
}
```

**Verification**: List renders all question reviews correctly

### Step 10: Implement ResultsActions Component

**Tasks**:
1. Create `src/components/QuizResults/ResultsActions.tsx`
2. Add retry quiz button
3. Add view quiz details button
4. Add back to quizzes button
5. Implement responsive layout (column on mobile, row on desktop)
6. Use navigation with Astro's `navigate()` for retry

**Code**:
```typescript
// src/components/QuizResults/ResultsActions.tsx
import { navigate } from 'astro:transitions/client';
import { Button } from '@/components/ui/button';
import { RotateCcw, FileText, ArrowLeft } from 'lucide-react';

interface ResultsActionsProps {
  quizId: string;
  onRetry?: () => void;
}

export function ResultsActions({ quizId, onRetry }: ResultsActionsProps) {
  const handleRetry = () => {
    onRetry?.();
    navigate(`/quizzes/${quizId}/take`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t">
      <Button size="lg" onClick={handleRetry}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Retry Quiz
      </Button>

      <Button variant="outline" size="lg" asChild>
        <a href={`/quizzes/${quizId}`}>
          <FileText className="mr-2 h-4 w-4" />
          View Quiz Details
        </a>
      </Button>

      <Button variant="outline" size="lg" asChild>
        <a href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quizzes
        </a>
      </Button>
    </div>
  );
}
```

**Verification**: Action buttons work correctly and navigate to appropriate pages

### Step 11: Implement QuizResultsContainer Component

**Tasks**:
1. Create `src/components/QuizResults/QuizResultsContainer.tsx`
2. Use `useQuizResults` hook to get data and state
3. Implement conditional rendering:
   - Show LoadingSpinner when loading
   - Show ErrorAlert when error exists
   - Show results when data loaded
4. Connect all child components
5. Handle retry and navigation actions

**Code**:
```typescript
// src/components/QuizResults/QuizResultsContainer.tsx
import { useQuizResults } from '@/hooks/useQuizResults';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ResultsHeader } from './ResultsHeader';
import { ScoreCard } from './ScoreCard';
import { QuestionReviewList } from './QuestionReviewList';
import { ResultsActions } from './ResultsActions';

interface QuizResultsContainerProps {
  quizId: string;
  attemptId?: string;
}

export function QuizResultsContainer({ quizId, attemptId }: QuizResultsContainerProps) {
  const {
    quiz,
    attempt,
    scoreData,
    questionReviews,
    isLoading,
    error,
    refetch,
  } = useQuizResults(quizId, attemptId);

  if (isLoading) {
    return <LoadingSpinner message="Loading your results..." size="lg" />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-16 text-center">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTitle>Failed to Load Results</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex gap-4 justify-center mt-6">
          <Button onClick={refetch}>Retry</Button>
          <Button variant="outline" asChild>
            <a href="/">Return to Quizzes</a>
          </Button>
        </div>
      </div>
    );
  }

  if (!quiz || !attempt || !scoreData) {
    return (
      <div className="container mx-auto py-16 text-center">
        <Alert className="max-w-2xl mx-auto">
          <AlertTitle>Results Not Found</AlertTitle>
          <AlertDescription>
            The quiz results you're looking for could not be found.
          </AlertDescription>
        </Alert>
        <Button className="mt-6" asChild>
          <a href="/">Return to Quizzes</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-4xl">
      <ResultsHeader
        quiz={quiz}
        completedAt={attempt.completed_at || undefined}
      />

      <ScoreCard scoreData={scoreData} />

      <QuestionReviewList questionReviews={questionReviews} />

      <ResultsActions quizId={quizId} />
    </div>
  );
}
```

**Verification**: All components work together, state management correct, interactions work

### Step 12: Create Astro Page

**Tasks**:
1. Create `src/pages/quizzes/[id]/results.astro`
2. Import Layout (uses existing Layout.astro)
3. Import QuizResultsContainer
4. Add `client:load` directive to hydrate React component
5. Set page metadata (title, description)
6. Extract quizId and attemptId from URL

**Code**:
```astro
---
// src/pages/quizzes/[id]/results.astro
import Layout from '@/layouts/Layout.astro';
import QuizResultsContainer from '@/components/QuizResults/QuizResultsContainer';

const { id: quizId } = Astro.params;
const attemptId = Astro.url.searchParams.get('attemptId') || undefined;

// Public route - accessible to all users
// Authenticated users can view historical attempts via attemptId
// Anonymous users see immediate post-submission results
---

<Layout
  title="Quiz Results | QuizStack"
  description="View your quiz results and review answers"
>
  <QuizResultsContainer
    client:load
    quizId={quizId}
    attemptId={attemptId}
  />
</Layout>
```

**Verification**: Page accessible at `/quizzes/:id/results`, React components hydrate correctly

### Step 13: Update Quiz Submission Flow

**Tasks**:
1. Update quiz taking component to navigate to results after submission
2. For authenticated users: pass attemptId in URL
3. For anonymous users: store results in session storage
4. Ensure smooth transition using Astro's `navigate()`

**Code Outline** (in quiz taking component):
```typescript
import { navigate } from 'astro:transitions/client';

const handleQuizSubmit = async (answers: AnswerSubmission[]) => {
  // Submit quiz
  const result = await submitQuiz(quizId, answers);

  if (isAuthenticated) {
    // Navigate with attemptId for authenticated users
    navigate(`/quizzes/${quizId}/results?attemptId=${result.attemptId}`);
  } else {
    // Store in session storage for anonymous users
    const resultsData = {
      quiz: quizData,
      attempt: result.attempt,
      questions: quizQuestions,
      responses: result.responses,
    };

    sessionStorage.setItem(
      `quiz-results-${quizId}`,
      JSON.stringify(resultsData)
    );

    // Navigate without attemptId
    navigate(`/quizzes/${quizId}/results`);
  }
};
```

**Verification**: Quiz submission navigates to results page correctly for both user types

### Step 14: Testing

**Tasks**:

1. **Unit Tests**:
   - Test `useQuizResults` hook with API and session storage paths
   - Test score calculation logic
   - Test question review data building
   - Test component rendering with different props
   - Test error handling scenarios

2. **Integration Tests**:
   - Test complete user flow: take quiz → submit → view results
   - Test retry quiz flow
   - Test historical results viewing (authenticated users)
   - Test anonymous user results display
   - Test session storage fallback

3. **Manual Testing**:
   - Test on different browsers (Chrome, Firefox, Safari)
   - Test on different screen sizes (mobile, tablet, desktop)
   - Test with different quiz lengths (short and long quizzes)
   - Test with different score ranges (0%, 50%, 100%)
   - Test with unanswered questions
   - Test error scenarios (network errors, invalid attemptId)
   - Test navigation flows (back button, retry, etc.)

4. **Edge Cases**:
   - Quiz with 1 question
   - Quiz with 100 questions
   - Perfect score (100%)
   - Zero score (0%)
   - All questions unanswered
   - Session storage quota exceeded
   - Multiple tabs open with same results
   - Browser back/forward navigation

**Verification**: All tests pass, no console errors, UI works as expected

### Step 15: Performance Optimization

**Tasks**:
1. Implement React.memo for components that don't need frequent re-renders
2. Optimize re-renders with useMemo and useCallback
3. Lazy load question review items for long quizzes (optional)
4. Optimize session storage data size (store only necessary fields)
5. Add caching for API responses (future enhancement)

**Code Example**:
```typescript
import { memo } from 'react';

export const QuestionReviewItem = memo(({ reviewData }: QuestionReviewItemProps) => {
  // Component implementation
});

// In useQuizResults
const questionReviews = useMemo(() => {
  // Expensive computation
  return buildQuestionReviews(questions, responses);
}, [questions, responses]);
```

**Verification**: Page loads fast, smooth interactions, no unnecessary re-renders

### Step 16: Accessibility Audit

**Tasks**:
1. Run Lighthouse accessibility audit
2. Ensure all interactive elements are keyboard accessible
3. Verify screen reader announces content correctly
4. Check color contrast ratios for success/error states
5. Add proper ARIA labels where needed
6. Ensure focus indicators are visible
7. Test with keyboard only (no mouse)
8. Test with screen reader (NVDA, JAWS, VoiceOver)

**Verification**: Lighthouse score >90, keyboard navigation works, screen reader friendly

### Step 17: Documentation

**Tasks**:
1. Add JSDoc comments to all components and hooks
2. Document props interfaces with descriptions
3. Add README in QuizResults component directory
4. Document API integration patterns
5. Add inline comments for complex logic
6. Document session storage format

**Verification**: Code is well-documented, new developers can understand it

### Step 18: Final Review and Deployment

**Tasks**:
1. Code review with team
2. Address any feedback
3. Merge feature branch to main
4. Deploy to staging environment
5. Run smoke tests on staging
6. Deploy to production
7. Monitor for errors
8. Gather user feedback

**Verification**: Results page live in production, no errors, metrics looking good

---

## Additional Considerations

### Future Enhancements

1. **Detailed Explanations**: Add explanation text for each question (stored in database)
2. **Question Categories**: Show performance by category/topic
3. **Time Tracking**: Display time taken per question and total time
4. **Comparison Stats**: Show how user's score compares to average
5. **Certificate Generation**: Generate certificate for high scores
6. **Social Sharing**: Share results on social media with custom images
7. **Print Results**: Print-friendly version of results
8. **Export Results**: Download as PDF or CSV
9. **Leaderboard**: Show top scores for public quizzes
10. **Progress Tracking**: Show improvement over multiple attempts
11. **Recommendations**: Suggest related quizzes based on performance
12. **Bookmarking**: Allow users to bookmark specific questions for review

### Performance Metrics

Monitor the following metrics post-deployment:
- Page load time (target: <2s)
- Time to interactive (target: <3s)
- API response time for results endpoint (target: <300ms)
- Error rate (target: <1%)
- User engagement (retry rate, view details rate)
- Session storage usage
- Results page views (immediate vs historical)

### Accessibility Compliance

Ensure compliance with:
- WCAG 2.1 Level AA standards
- Keyboard navigation support
- Screen reader compatibility
- Color contrast requirements (especially for success/error states)
- Focus management
- Alternative text for visual indicators

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
- Shadcn/ui components (Card, Badge, Alert, Button, Progress)
- date-fns (for date formatting)
- lucide-react (for icons)
- TypeScript 5

Ensure all dependencies are up to date and security patches applied.

### Security Considerations

1. **Attempt Ownership Validation**: Always validate attempt ownership on backend
2. **Anonymous User Privacy**: Don't expose anonymous user data
3. **Rate Limiting**: Prevent abuse of results endpoint
4. **Data Sanitization**: Sanitize quiz content and answers before display
5. **Session Storage Security**: Don't store sensitive data in session storage
6. **CORS Configuration**: Ensure proper CORS headers for API endpoints

### SEO Considerations

While results pages are typically not SEO targets, consider:
- Adding noindex meta tag for individual results pages
- Adding canonical URL for quiz detail page
- Including structured data for quiz metadata
- Ensuring fast page load times for better rankings

### Analytics and Tracking

Track the following events for insights:
- Results page views
- Retry button clicks
- Share button clicks (future)
- Average time on results page
- Back to quizzes button clicks
- Score distribution across all quizzes
- Completion rate by quiz
- Anonymous vs authenticated user results viewing

### Error Monitoring

Set up error monitoring to track:
- API endpoint failures
- Session storage quota exceeded errors
- Navigation errors
- Component rendering errors
- Data parsing errors
- Network errors

Use tools like Sentry, LogRocket, or similar for production error tracking.
