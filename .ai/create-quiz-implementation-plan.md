# View Implementation Plan: Manual Quiz Creation

## 1. Overview

The Manual Quiz Creation View enables authenticated users to create quizzes from scratch through an intuitive form-based interface. Users can define quiz metadata (title, description, visibility), add multiple questions with answer options, and mark correct answers. The view leverages the existing `EditableQuizContent` component (originally created for AI quiz generation editing) to provide a consistent editing experience across the application.

## 2. View Routing

**Path:** `/quizzes/new`
**Access:** Requires authenticated user
**Navigation:** Accessible from dashboard "Create Quiz" button or main navigation
**Redirect on Unauthorized:** `/login?redirect=/quizzes/new`

## 3. Component Structure

### Page Component Architecture

```
CreateQuizPage (Astro component)
└── QuizCreator (React component - new)
    └── EditableQuizContent (Existing reusable component)
        ├── Quiz Metadata Editor (title, description)
        ├── Questions Editor
        │   └── Question Editor[]
        │       └── Options Editor
        │           └── Option Editor[]
        └── Sticky Footer (Add Question, Cancel, Save buttons)
```

### Component Reuse Strategy

- **EditableQuizContent**: Existing comprehensive editing component used for both AI quiz editing and manual quiz creation
- **useStickyFooter**: Existing hook for intelligent footer positioning
- **QuizCreator**: New lightweight wrapper component that initializes empty quiz state and handles creation API calls

## 4. Component Details

### CreateQuizPage (Astro)

- **Component description:** Main Astro page component that handles authentication, provides page layout, and wraps the React QuizCreator component.
- **Main elements:** Page header with breadcrumb navigation (Home > Quizzes > New Quiz), authentication guard, QuizCreator component wrapper, toast notifications container.
- **Handled interactions:** Page initialization, authentication verification, post-creation navigation.
- **Handled validation:** User authentication status via Astro middleware.
- **Types:** None (page-level Astro component)
- **Props:** None
- **File location:** `/src/pages/quizzes/new.astro`

### QuizCreator (React - New Component)

- **Component description:** Lightweight React wrapper that initializes an empty quiz structure and manages the quiz creation lifecycle using the existing EditableQuizContent component.
- **Main elements:** Loading state, EditableQuizContent component, toast notifications for success/error feedback.
- **Handled interactions:**
  - Initialize empty quiz with default structure
  - Handle save action (API call to create quiz)
  - Handle cancel action (navigate back to dashboard)
  - Success/error toast notifications
  - Redirect to created quiz after successful save
- **Handled validation:** None (delegated to EditableQuizContent)
- **Types:** `QuizDetailDTO`, `QuizUpdateDTO`, `QuizCreateInput`
- **Props:** None (uses router for navigation)
- **File location:** `/src/components/quizzes/QuizCreator.tsx`
- **Implementation Notes:**
  - Creates initial empty quiz object with temporary ID
  - Maps EditableQuizContent's save callback to creation API endpoint
  - Transforms ViewModel to API request format (strips temp IDs, adds metadata)

### EditableQuizContent (Existing Reusable Component)

- **Component description:** Comprehensive editing interface allowing users to modify all aspects of a quiz including title, description, questions, and answer options with real-time validation. Already implemented and used in AI quiz generation feature.
- **Main elements:**
  - Editable quiz metadata form (title, description)
  - Dynamic questions editor with add/remove functionality
  - Inline answer options editor with radio button for correct answer
  - Sticky footer with customizable action buttons (Add Question, Cancel, Save)
  - Real-time validation with inline error messages
  - Character counters for text fields
  - Highlighted animation for newly added questions
- **Handled interactions:**
  - Content editing with real-time validation
  - Question/option addition and removal
  - Correct answer selection (radio button behavior)
  - Form submission with validation checks
  - Cancellation
  - Smooth scrolling to newly added questions
- **Handled validation:**
  - Title: Required, 1-200 characters
  - Description: Optional, max 1000 characters
  - Minimum 1 question required
  - Minimum 2 options per question
  - Exactly 1 correct answer per question
  - All option content required, 1-500 characters
- **Types:** `EditableQuizData`, `QuizUpdateDTO`, `QuestionWithOptionsDTO`, `OptionDTO`
- **Props:** `{ quiz: QuizDetailDTO, onSave: (data: QuizUpdateDTO) => void, onCancel: () => void, saveButtonText?: string, cancelButtonText?: string, className?: string, isPublishing?: boolean }`
- **File location:** `/src/components/quizzes/EditableQuizContent.tsx` (already exists)
- **Reuse Benefits:**
  - Consistent UX across AI generation and manual creation
  - All validation logic already implemented
  - Sticky footer behavior already working
  - Question/option management fully functional
  - Accessibility features already in place

## 5. Types

### Initial Empty Quiz Structure (ViewModel)

```typescript
interface EmptyQuizStructure {
  id: string; // Temporary client-side ID: "new-quiz-{uuid}"
  user_id: string; // Current authenticated user ID
  title: string; // Empty string initially
  description: string; // Empty string initially
  visibility: "private"; // Default to private
  status: "active";
  source: "manual";
  created_at: string; // Current timestamp
  updated_at: string; // Current timestamp
  questions: []; // Empty array - user will add questions
}
```

**Note:** This structure is compatible with `QuizDetailDTO` and will be passed to `EditableQuizContent` component.

### QuizCreateInput (API Request Type)

```typescript
interface QuizCreateInput {
  title: string;
  description?: string;
  visibility: 'public' | 'private';
  source: 'manual';
  questions: {
    content: string;
    explanation?: string;
    position: number;
    options: {
      content: string;
      is_correct: boolean;
      position: number;
    }[];
  }[];
}
```

**Transformation Logic:**
- Strip temporary client-side IDs (id fields starting with "new-")
- Remove user_id, created_at, updated_at, status fields
- Keep only API-required fields
- Map questions array to remove question IDs
- Map options arrays to remove option IDs

### Existing Types (Reused)

- **QuizDetailDTO**: Complete quiz structure with all metadata (defined in `/src/types.ts`)
- **QuizUpdateDTO**: Quiz update payload structure (defined in `/src/types.ts`)
- **QuestionWithOptionsDTO**: Question with nested options array (defined in `/src/types.ts`)
- **OptionDTO**: Individual option structure (defined in `/src/types.ts`)
- **EditableQuizData**: Extended quiz with validation errors (defined in `EditableQuizContent.tsx`)

## 6. State Management

### QuizCreator Component State

The QuizCreator component manages minimal state:

```typescript
const useQuizCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize empty quiz structure
  const initialQuiz = useMemo<QuizDetailDTO>(() => ({
    id: `new-quiz-${crypto.randomUUID()}`,
    user_id: currentUser.id, // From auth context
    title: "",
    description: "",
    visibility: "private",
    status: "active",
    source: "manual",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    questions: [],
  }), [currentUser.id]);

  const createQuiz = async (quizData: QuizUpdateDTO) => {
    setIsCreating(true);
    setError(null);

    try {
      // Transform to API format
      const createInput = transformToCreateInput(quizData);

      // Call API
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createInput),
      });

      if (!response.ok) {
        throw new Error('Failed to create quiz');
      }

      const createdQuiz = await response.json();

      // Show success toast
      toast.success('Quiz created successfully!');

      // Redirect to quiz detail page
      window.location.href = `/quizzes/${createdQuiz.id}`;
    } catch (err) {
      setError(err.message);
      toast.error('Failed to create quiz. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      window.location.href = '/dashboard';
    }
  };

  return {
    initialQuiz,
    isCreating,
    error,
    createQuiz,
    handleCancel,
  };
};
```

### EditableQuizContent State (Existing)

The EditableQuizContent component already manages all editing state internally:
- Quiz data with real-time updates
- Validation errors by field
- isDirty flag for unsaved changes tracking
- Question and option management
- Form submission handling

**No changes needed to existing component state management.**

## 7. API Integration

### Quiz Creation API

- **Endpoint:** `POST /api/quizzes`
- **Purpose:** Save complete quiz with questions and options to database
- **Authentication:** Required (Supabase auth token)
- **Request Type:** `QuizCreateInput`
- **Request Structure:**

```typescript
{
  title: string; // 1-200 characters, required
  description?: string; // 0-1000 characters, optional
  visibility: "public" | "private"; // required
  source: "manual"; // always 'manual' for this view
  questions: [
    {
      content: string; // 1-1000 characters, required
      explanation?: string; // 0-2000 characters, optional
      position: number; // 1-indexed, required
      options: [
        {
          content: string; // 1-500 characters, required
          is_correct: boolean; // required
          position: number; // 1-indexed, required
        }
      ];
    }
  ];
}
```

- **Response Type:** `QuizDetailDTO`
- **Response Structure:**

```typescript
{
  id: string; // UUID
  user_id: string; // UUID
  title: string;
  description: string;
  visibility: "public" | "private";
  status: "active";
  source: "manual";
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  questions: QuestionWithOptionsDTO[];
}
```

- **Error Codes:**
  - `400 Bad Request`: Validation errors (missing required fields, invalid formats)
  - `401 Unauthorized`: User not authenticated or session expired
  - `422 Unprocessable Entity`: Business logic validation failed (e.g., no correct answer marked)
  - `500 Internal Server Error`: Database error or unexpected server failure

- **Validation Rules Enforced by API:**
  - Title required and within length limits
  - At least 1 question required
  - Each question has at least 2 options
  - Each question has exactly 1 correct answer
  - All position values are sequential starting from 1
  - User is authenticated and user_id matches auth token

## 8. User Interactions

### Primary Workflow

1. **Initial Load:** User navigates to `/quizzes/new`, authentication is verified, empty quiz form is displayed
2. **Metadata Input:** User enters quiz title (required) and description (optional) in the Quiz Details section
3. **First Question:** User clicks "Add Question" button to create first question with default 2 options
4. **Question Editing:** User edits question content, modifies option text, selects correct answer via radio button
5. **Add More Options:** User optionally adds more answer options (up to 6 per question) using "Add Option" button
6. **Add More Questions:** User repeats process, adding multiple questions using "Add Question" button
7. **Real-time Validation:** As user types, validation errors appear/disappear inline near fields
8. **Review Content:** User scrolls through form reviewing all questions and answers
9. **Save Quiz:** User clicks "Save Changes" button (enabled when form valid and has changes)
10. **Success & Redirect:** Success toast appears, user is redirected to quiz detail page

### Secondary Interactions

- **Cancel Creation:** User clicks "Cancel" button, sees confirmation dialog if changes exist, returns to dashboard
- **Add/Remove Questions:** User adds questions via buttons in header or sticky footer, removes via delete icon with immediate effect (no confirmation needed for empty questions)
- **Add/Remove Options:** User adds options up to maximum 6, removes options down to minimum 2, system prevents invalid states by disabling buttons
- **Change Correct Answer:** User clicks different radio button to mark different option as correct (only one can be selected)
- **Scroll to New Question:** When user adds question, page smoothly scrolls to new question with highlight animation
- **Sticky Footer:** As user scrolls, footer becomes fixed at bottom with action buttons always accessible
- **Form Validation:** Save button disabled when form invalid or no changes made, with inline error messages guiding corrections
- **Character Counters:** Real-time character counts shown for title (0/200) and description (0/1000)
- **Session Recovery:** If user navigates away and comes back, form state is not preserved (fresh start)

### UX Flow Differences from AI Generation

- **No Preview Step:** User directly edits and saves (no separate preview/edit modes)
- **Empty Start:** Begins with completely empty form vs. AI generation which starts with generated content
- **Incremental Building:** User builds quiz question-by-question vs. editing pre-generated full quiz
- **Single Save Action:** One "Save Changes" button vs. "Edit" → "Publish" flow in AI generation

## 9. Conditions and Validation

### Authentication Conditions

- **Component:** CreateQuizPage (Astro middleware)
- **Validation:** User must be authenticated via Supabase auth
- **Effect:** Redirect to `/login?redirect=/quizzes/new` if not authenticated
- **Implementation:** Astro middleware checks for valid session before rendering page

### Form Validation (Delegated to EditableQuizContent)

All validation is handled by the existing EditableQuizContent component:

- **Title Validation:**
  - Required field
  - 1-200 characters
  - Cannot be only whitespace
  - Error message: "Quiz title is required" or "Quiz title must be 200 characters or less"

- **Description Validation:**
  - Optional field
  - Max 1000 characters when provided
  - Error message: "Quiz description must be 1000 characters or less"

- **Questions Validation:**
  - Minimum 1 question required
  - Error message: "Quiz must have at least one question"

- **Question Content Validation:**
  - Required, cannot be empty
  - Error message: "Question content is required"

- **Options Validation:**
  - Minimum 2 options per question
  - Error message: "Question must have at least 2 options"

- **Correct Answer Validation:**
  - Exactly 1 option must be marked as correct per question
  - Error message: "Question must have exactly one correct answer"

- **Option Content Validation:**
  - Each option content required
  - Error message: "Option content is required"

### Save Button State

- **Enabled When:**
  - Form is valid (no validation errors)
  - Form has changes (isDirty = true)
  - Not currently submitting (isCreating = false)

- **Disabled When:**
  - Form has validation errors
  - No changes made (pristine state)
  - Currently submitting to API

- **Visual State:**
  - Enabled: Primary button styling with hover effects
  - Disabled: Muted colors (bg-primary/40), reduced opacity, cursor-not-allowed

## 10. Error Handling

### Validation Errors

- **Scenario:** User input fails validation rules
- **Handling:**
  - Inline error messages appear below affected fields in red (text-destructive)
  - Fields with errors have red border styling
  - General errors shown in alert box at top of questions section
  - Save button disabled until errors resolved
- **Recovery:**
  - User corrects invalid fields based on error messages
  - Errors clear automatically as user fixes issues
- **User Experience:** Non-blocking, allows editing other fields
- **Component:** EditableQuizContent (already implemented)

### Authentication Errors

- **Scenario:** Session expires during quiz creation, token becomes invalid
- **Handling:**
  - API returns 401 Unauthorized
  - Show error toast: "Your session has expired. Please log in again."
  - Redirect to login page with return URL
- **Recovery:**
  - User logs in again
  - Returns to quiz creation page (starts fresh - no state preservation in MVP)
- **User Experience:** Clear feedback about session issue
- **Component:** QuizCreator

### Network Errors

- **Scenario:** Connection loss during save, API timeout, server unavailable
- **Handling:**
  - Detect network error or fetch failure
  - Keep form data intact (do not clear)
  - Show error toast: "Failed to save quiz. Please check your connection and try again."
  - Log error to console
- **Recovery:**
  - User clicks "Save Changes" button again to retry
  - Form state preserved for retry
- **User Experience:** Clear error message, easy retry, no data loss
- **Component:** QuizCreator

### API Validation Errors

- **Scenario:** Backend validation fails (400/422 status codes)
- **Handling:**
  - Parse error response from API
  - Show error toast with server message
  - Keep form data intact
  - Log error details to console
- **Recovery:**
  - User corrects issues based on error message
  - Retry submission
- **User Experience:** Server errors clearly communicated
- **Component:** QuizCreator

### Database Errors

- **Scenario:** Database constraint violation, transaction failure (500 status)
- **Handling:**
  - Show error toast: "Something went wrong while saving your quiz. Please try again."
  - Keep form data intact
  - Log error details
- **Recovery:**
  - User can retry submission
  - If persistent, user contacts support
- **User Experience:** Friendly error message, data preserved
- **Component:** QuizCreator

### Component Errors

- **Scenario:** React component error, JavaScript exception
- **Handling:**
  - Error boundary catches error
  - Display error UI with refresh option
  - Log error with stack trace
- **Recovery:**
  - User refreshes page (starts fresh)
- **User Experience:** Prevents white screen, provides recovery path
- **Component:** Error boundary wrapper in CreateQuizPage

## 11. Implementation Steps

### Phase 1: Page Setup (Steps 1-2)

**1. Create Astro Page Structure**
   - Create `/src/pages/quizzes/new.astro`
   - Add authentication middleware check (redirect unauthenticated users to login)
   - Implement page layout with header and breadcrumbs (Home > Quizzes > New Quiz)
   - Add meta tags for SEO (title: "Create New Quiz")
   - Import and embed QuizCreator React component
   - Add Toaster component for toast notifications
   - Style page container using Tailwind semantic color tokens
   - **Files:** `/src/pages/quizzes/new.astro`
   - **Acceptance Criteria:**
     - Page loads correctly at `/quizzes/new`
     - Unauthenticated users redirected to login
     - Breadcrumb navigation displays correctly
     - Page uses semantic color tokens

**2. Verify EditableQuizContent Component**
   - Review existing `/src/components/quizzes/EditableQuizContent.tsx`
   - Confirm all required features are present:
     - Quiz metadata editing (title, description)
     - Question management (add, remove, edit)
     - Option management (add, remove, edit, mark correct)
     - Real-time validation
     - Sticky footer with action buttons
     - Customizable button text via props
   - Test component in isolation with empty quiz structure
   - Document any missing features or bugs
   - **Files:** `/src/components/quizzes/EditableQuizContent.tsx` (existing)
   - **Acceptance Criteria:**
     - Component works with empty initial quiz
     - All validation rules function correctly
     - Sticky footer behavior works
     - No critical bugs identified

### Phase 2: Quiz Creator Component (Steps 3-5)

**3. Create QuizCreator Component**
   - Create `/src/components/quizzes/QuizCreator.tsx`
   - Implement component structure with state management
   - Add authentication context integration to get current user ID
   - Create initial empty quiz structure generator
   - Add props interface (if needed for future extensibility)
   - Set up loading and error state management
   - Add JSDoc comments for documentation
   - **Files:** `/src/components/quizzes/QuizCreator.tsx`
   - **Acceptance Criteria:**
     - Component renders without errors
     - Empty quiz structure created correctly
     - State management functional
     - TypeScript types correct

**4. Implement Quiz Initialization Logic**
   - Add `useInitialQuiz` hook or memo to create empty quiz structure
   - Generate temporary client-side UUID for quiz ID
   - Set user_id from authenticated user context
   - Initialize empty questions array
   - Set default values (visibility: private, source: manual, status: active)
   - Add timestamp generation for created_at/updated_at
   - Ensure structure matches QuizDetailDTO interface
   - **Files:** `/src/components/quizzes/QuizCreator.tsx`
   - **Acceptance Criteria:**
     - Empty quiz has all required fields
     - Temporary ID is unique and properly formatted
     - Structure compatible with EditableQuizContent
     - No TypeScript errors

**5. Integrate EditableQuizContent Component**
   - Import EditableQuizContent into QuizCreator
   - Pass initial empty quiz as `quiz` prop
   - Configure button text: saveButtonText="Create Quiz", cancelButtonText="Cancel"
   - Pass isPublishing state from QuizCreator
   - Add onSave handler (to be implemented in next phase)
   - Add onCancel handler (to be implemented in next phase)
   - Test rendering with empty quiz
   - **Files:** `/src/components/quizzes/QuizCreator.tsx`
   - **Acceptance Criteria:**
     - EditableQuizContent renders with empty quiz
     - Buttons display correct text
     - Component integration smooth
     - No console errors

### Phase 3: API Integration (Steps 6-8)

**6. Implement Data Transformation Function**
   - Create `transformToCreateInput` utility function
   - Strip all temporary client-side IDs (fields starting with "new-")
   - Remove database-only fields (user_id, created_at, updated_at, status, id)
   - Map questions array to API format (remove IDs, keep content/position/options)
   - Map options arrays to API format (remove IDs, keep content/is_correct/position)
   - Ensure all position values are sequential from 1
   - Add TypeScript types for input/output
   - Write unit tests for transformation logic
   - **Files:** `/src/components/quizzes/QuizCreator.tsx` or `/src/lib/quiz-utils.ts`
   - **Acceptance Criteria:**
     - Transformation correctly removes temp IDs
     - Output matches API expected format
     - Position values correct
     - Unit tests pass

**7. Implement Create Quiz API Call**
   - Add `createQuiz` async function in QuizCreator
   - Call transformToCreateInput before API request
   - Make POST request to `/api/quizzes` endpoint
   - Include proper headers (Content-Type: application/json)
   - Handle response parsing
   - Extract created quiz ID from response
   - Add comprehensive error handling
   - Set isCreating state during request
   - **Files:** `/src/components/quizzes/QuizCreator.tsx`
   - **Acceptance Criteria:**
     - API call works with valid data
     - Request includes auth token
     - Response parsed correctly
     - Error handling robust

**8. Implement Success and Error Handling**
   - Add success toast notification using Sonner: "Quiz created successfully!"
   - Add error toast notification: "Failed to create quiz. Please try again."
   - Implement redirect to quiz detail page after success: `/quizzes/{id}`
   - Add error logging for debugging
   - Display user-friendly error messages
   - Handle specific error codes (400, 401, 422, 500)
   - Keep form data on error for retry
   - **Files:** `/src/components/quizzes/QuizCreator.tsx`
   - **Acceptance Criteria:**
     - Success toast shows and redirect works
     - Error toast shows on failure
     - Form data preserved on error
     - Different error types handled appropriately

### Phase 4: Navigation and Polish (Steps 9-11)

**9. Implement Cancel Functionality**
   - Add `handleCancel` function
   - Check if form has unsaved changes (isDirty flag)
   - Show browser confirm dialog if changes exist: "Are you sure you want to cancel? Any unsaved changes will be lost."
   - Navigate to dashboard on confirmation: `/dashboard`
   - No confirmation needed if no changes made
   - Connect to onCancel prop of EditableQuizContent
   - **Files:** `/src/components/quizzes/QuizCreator.tsx`
   - **Acceptance Criteria:**
     - Cancel button works
     - Confirmation shown when dirty
     - No confirmation when pristine
     - Navigation to dashboard works

**10. Add Loading States and Disabled Controls**
   - Pass isPublishing prop to EditableQuizContent during API call
   - Ensure all inputs disabled during submission (handled by EditableQuizContent)
   - Show loading spinner on "Create Quiz" button during submission
   - Change button text to "Creating..." during submission
   - Disable cancel button during submission
   - Prevent double submissions
   - **Files:** `/src/components/quizzes/QuizCreator.tsx`
   - **Acceptance Criteria:**
     - Loading state visible during submission
     - Form disabled during submission
     - Button shows spinner and "Creating..." text
     - No double submission possible

**11. Add Navigation Guards**
   - Implement beforeunload event listener for browser navigation
   - Show warning when user tries to close tab/window with unsaved changes
   - Browser dialog: "You have unsaved changes. Are you sure you want to leave?"
   - Only show warning if form isDirty
   - Clean up event listener on component unmount
   - **Files:** `/src/components/quizzes/QuizCreator.tsx`
   - **Acceptance Criteria:**
     - Warning shows on tab close with changes
     - No warning when pristine or after save
     - Works across different browsers
     - Event listener cleaned up properly

### Phase 5: Testing (Steps 12-14)

**12. Add Unit Tests**
   - Create test file `/src/components/quizzes/__tests__/QuizCreator.test.tsx`
   - Test initial quiz structure generation
   - Test transformToCreateInput function with various inputs
   - Test error handling scenarios
   - Test state management (isCreating, error)
   - Mock API calls using Vitest
   - Mock authentication context
   - Aim for >80% code coverage
   - **Files:** `/src/components/quizzes/__tests__/QuizCreator.test.tsx`
   - **Acceptance Criteria:**
     - All tests pass
     - Good code coverage
     - Edge cases tested
     - Mocks working correctly

**13. Add Integration Tests**
   - Create test file `/src/pages/quizzes/__tests__/new.integration.test.ts`
   - Test complete quiz creation workflow
   - Test authentication redirect flow
   - Test API integration with mocked responses
   - Test error scenarios (network, validation, auth)
   - Test success flow with redirect
   - Use Vitest with React Testing Library
   - **Files:** `/src/pages/quizzes/__tests__/new.integration.test.ts`
   - **Acceptance Criteria:**
     - Full workflow tested
     - Authentication checks work
     - API mocking realistic
     - Tests reliable and fast

**14. Add E2E Tests**
   - Create test file `/tests/e2e/quiz-creation.spec.ts`
   - Test complete quiz creation from login to created quiz page
   - Test validation error scenarios (empty title, no questions, no correct answer)
   - Test cancel functionality with confirmation
   - Test unsaved changes warning
   - Test responsive behavior on mobile viewport
   - Test accessibility with axe
   - Use Playwright for browser automation
   - **Files:** `/tests/e2e/quiz-creation.spec.ts`
   - **Acceptance Criteria:**
     - E2E tests pass consistently
     - Cover critical user paths
     - Accessibility checks pass
     - Tests run in CI/CD pipeline

### Phase 6: Documentation and Accessibility (Steps 15-16)

**15. Add Accessibility Enhancements**
   - Verify ARIA labels on all form controls (handled by EditableQuizContent)
   - Test keyboard navigation (Tab, Enter, Escape)
   - Verify focus management (focus on first error on submit)
   - Test with screen readers (NVDA, VoiceOver)
   - Ensure proper heading hierarchy
   - Verify color contrast ratios meet WCAG AA
   - Add skip links if needed
   - Test focus visible styles
   - **Files:** Multiple components
   - **Acceptance Criteria:**
     - WCAG 2.1 AA compliance
     - Keyboard fully navigable
     - Screen reader friendly
     - Focus indicators visible

**16. Write Documentation**
   - Add JSDoc comments to QuizCreator component
   - Document transformToCreateInput function
   - Add inline code comments for complex logic
   - Update user-facing documentation (if exists)
   - Document known limitations
   - Add troubleshooting guide for common issues
   - Update README if needed
   - **Files:** Multiple files
   - **Acceptance Criteria:**
     - Code well-commented
     - Documentation complete
     - Helpful for future developers
     - User guide updated

### Phase 7: Performance and Polish (Steps 17-18)

**17. Performance Optimization**
   - Review EditableQuizContent for unnecessary re-renders
   - Add React.memo where beneficial
   - Verify useMemo and useCallback usage
   - Test performance with many questions (20+)
   - Optimize bundle size (check for unnecessary imports)
   - Add code splitting if needed
   - Test initial load time
   - Run Lighthouse audit
   - **Files:** Multiple components
   - **Acceptance Criteria:**
     - Lighthouse score >90
     - Smooth interactions
     - Fast initial load
     - No performance regressions

**18. Final UI Polish**
   - Verify all semantic color tokens used (no hardcoded colors)
   - Test responsive design on mobile, tablet, desktop
   - Verify dark mode appearance (automatic via semantic tokens)
   - Check spacing consistency
   - Verify typography hierarchy
   - Test all interactive states (hover, focus, active, disabled)
   - Verify animations smooth (question highlight, sticky footer)
   - Cross-browser testing (Chrome, Firefox, Safari, Edge)
   - **Files:** Multiple components
   - **Acceptance Criteria:**
     - Visually polished
     - Works on all screen sizes
     - Dark mode looks good
     - Cross-browser compatible

## 12. User Stories Coverage

This implementation plan addresses the following user stories from the PRD:

### US-002: Creating a Quiz (Primary)

- **Requirement:** A logged-in user can create a new quiz by defining the title, description, and set of questions.
- **Coverage:** Complete implementation of manual quiz creation with all required fields
- **Acceptance Criteria Met:**
  - ✅ Quiz creation form available only to logged-in users
  - ✅ Unauthenticated users redirected to login
  - ✅ All required fields must be completed (enforced by validation)
  - ✅ After creating quiz, user redirected to quiz summary view

### US-005: Browsing Personal Quizzes (Related)

- **Requirement:** Post-creation, user can view their newly created quiz in their personal list
- **Coverage:** After successful creation, quiz associated with user and appears in dashboard
- **Acceptance Criteria Met:**
  - ✅ Only logged-in users can create quizzes
  - ✅ Quiz includes basic information: title, creation date, number of questions
  - ✅ Created quiz immediately available in user's personal list

## 13. Technical Considerations

### Component Reuse Benefits

- **Consistency:** Same editing UX for AI-generated and manually-created quizzes
- **Reduced Code:** No need to rebuild question/option management, validation, sticky footer
- **Battle-Tested:** EditableQuizContent already tested and working in AI generation feature
- **Maintainability:** Bug fixes and improvements benefit both features
- **Development Speed:** Significantly faster implementation (only need wrapper component)

### Architecture Decisions

- **Thin Wrapper Pattern:** QuizCreator is intentionally minimal, delegating all editing logic to EditableQuizContent
- **Empty Quiz Initialization:** Generate complete empty structure client-side rather than API call
- **No Draft Persistence:** MVP does not save drafts (user must complete in one session)
- **Single-Step Flow:** Unlike wizard pattern, uses single-page form (simpler for users)
- **Validation-First:** Rely entirely on EditableQuizContent's proven validation

### Database Interaction

- Uses existing `POST /api/quizzes` endpoint (same as AI generation publishing)
- Leverages PostgreSQL row-level security policies for access control
- Transaction ensures atomic quiz creation (quiz + questions + options)
- Foreign key relationships maintained automatically by database
- Position fields ensure proper ordering

### Security Considerations

- Authentication required at page level (Astro middleware) and API level
- CSRF protection via Supabase auth tokens (automatic)
- Input sanitization handled by API validation
- SQL injection prevention via parameterized queries (Supabase client)
- Rate limiting on API endpoint prevents abuse
- User can only create quizzes for themselves (enforced by RLS)

### Browser Compatibility

- Target: Modern browsers (Chrome, Firefox, Safari, Edge) - last 2 versions
- Progressive enhancement for basic functionality
- Graceful degradation for unsupported features
- No IE11 support required

### Performance Considerations

- EditableQuizContent already optimized with React.memo and hooks
- Sticky footer uses efficient IntersectionObserver API
- Minimal bundle size (reusing existing component)
- Lazy loading not needed (single component)
- Form state entirely client-side (no polling, no real-time sync)

## 14. Future Enhancements (Post-MVP)

### Draft Persistence

- Auto-save draft every 30 seconds to localStorage or database
- Restore draft on return to `/quizzes/new`
- Show notification: "You have an unsaved draft. Continue editing?"
- Draft expiration after 7 days

### Enhanced Question Types

- Multiple correct answers (checkbox mode)
- True/False questions (simplified 2-option format)
- Fill-in-the-blank questions
- Matching questions
- Ordering/sequencing questions

### Rich Content Support

- Markdown formatting in questions and explanations
- Image upload for questions and options
- Code syntax highlighting for programming quizzes
- LaTeX math equation support
- Embed videos or audio clips

### Templates and Import

- Quiz templates for common formats (e.g., "Multiple Choice Test", "True/False Quiz")
- Question templates/library for reuse across quizzes
- Import questions from CSV/JSON file
- Duplicate existing quiz as starting point
- Question bank with random selection

### Collaboration Features

- Share quiz for collaborative editing
- Real-time co-editing with conflict resolution
- Comments on questions
- Quiz co-authorship with multiple owners
- Version history and rollback

### Advanced Settings

- Quiz timer (time limit for completion)
- Question randomization
- Option randomization
- Passing score threshold
- Attempts limit per user
- Scheduled publication (publish at specific date/time)

### UX Improvements

- Drag-and-drop question reordering (EditableQuizContent already has structure for this)
- Keyboard shortcuts (Ctrl+S to save, Ctrl+Q to add question, etc.)
- Duplicate question button
- Bulk operations (select multiple questions to delete/move)
- Live preview panel showing quiz as users would see it
- Undo/redo functionality
- Inline spell check and grammar suggestions

### Analytics and Insights

- Track quiz creation funnel (completion rate, time spent)
- Identify common validation errors
- A/B test UI variations
- Heatmaps for user interactions

## 15. Key Differences from AI Quiz Generation

| Aspect | AI Generation | Manual Creation |
|--------|---------------|-----------------|
| **Starting Point** | Pre-generated quiz with content | Empty form |
| **Workflow** | Generate → Preview → Edit → Publish | Create → Add Questions → Save |
| **Component Flow** | Two modes (preview + edit) | Single edit mode only |
| **Button Text** | "Edit Quiz" → "Publish Quiz" | "Create Quiz" |
| **AI Metadata** | Includes ai_model, ai_prompt, ai_temperature | source = 'manual', no AI fields |
| **User Input** | Prompt text to generate | Direct content entry |
| **Complexity** | Higher (multiple states and modes) | Simpler (one-step process) |
| **Reused Component** | EditableQuizContent for editing | EditableQuizContent for creation |

## 16. Success Metrics

### Quantitative Metrics

- **Creation Completion Rate:** % of users who click "Create Quiz" and successfully save
  - Target: >75%
- **Time to First Quiz:** Average time from registration to first quiz created
  - Target: <10 minutes
- **Questions per Quiz:** Average number of questions added
  - Target: 5-10 questions
- **Error Rate:** % of save attempts that fail
  - Target: <5%
- **Mobile Usage:** % of quiz creations from mobile devices
  - Track and ensure mobile UX quality

### Qualitative Metrics

- **User Satisfaction:** Survey score for quiz creation experience
  - Target: >4/5 stars
- **Ease of Use:** % of users who rate creation as "Easy" or "Very Easy"
  - Target: >80%
- **Feature Requests:** Common requests for improvements
  - Use to prioritize future enhancements
- **Support Tickets:** Number of help requests related to quiz creation
  - Target: <2% of users need help

### Technical Metrics

- **Page Load Time:** Time to interactive on `/quizzes/new`
  - Target: <2 seconds
- **Lighthouse Score:** Overall performance score
  - Target: >90
- **Accessibility Score:** WCAG compliance level
  - Target: 100% AA compliance
- **Error Rate:** Client and server errors
  - Target: <0.1% error rate

## 17. Testing Strategy Summary

### Unit Tests
- QuizCreator component logic
- Data transformation functions
- State management
- Mock API interactions

### Integration Tests
- Full quiz creation workflow
- Authentication flow
- API integration
- Error handling scenarios

### E2E Tests
- User journey from login to created quiz
- Validation scenarios
- Cancel and unsaved changes flows
- Responsive behavior
- Accessibility

### Manual Testing
- Cross-browser compatibility
- Responsive design on real devices
- Screen reader testing
- Edge case scenarios
- Performance under load

## 18. Rollout Plan

### Phase 1: Internal Testing (Week 1)
- Deploy to staging environment
- Internal team testing
- Bug fixes and refinements
- Performance optimization

### Phase 2: Beta Testing (Week 2)
- Invite select users to beta
- Gather feedback
- Monitor usage analytics
- Address critical issues

### Phase 3: General Release (Week 3)
- Deploy to production
- Announce feature to all users
- Monitor error rates
- Collect user feedback
- Plan improvements based on data

### Phase 4: Iteration (Week 4+)
- Analyze success metrics
- Prioritize enhancements
- Plan next features
- Continuous improvement
