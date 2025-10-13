# View Implementation Plan: AI Quiz Generation

## 1. Overview

The AI Quiz Generation View enables users to create quizzes automatically using AI by providing a descriptive prompt. The view handles the complete workflow from prompt input through AI generation to quiz preview and optional editing before final publication. It provides real-time feedback, comprehensive error handling, and a seamless user experience for AI-powered quiz creation.

## 2. View Routing

**Path:** `/quizzes/ai/generate`
**Access:** Requires authenticated user
**Navigation:** Accessible from dashboard "Generate Quiz" button or main navigation

## 3. Component Structure

### Page-Specific Components

```
AIQuizGeneratorPage (Astro component)
├── GenerationForm (React component)
│   ├── PromptInput (Shadcn Input)
│   ├── GenerationInstructions (Static content)
│   └── SubmitButton (Shadcn Button)
└── LoadingIndicator (React component)
```

### Reusable Quiz Components (Used by multiple features)

```
QuizPreview (React component)
├── QuizMetadata (Display component)
└── QuestionsList (React component)
    └── QuestionItem[] (Display components)
        └── OptionsList (Display component)
            └── OptionItem[] (Display components)

EditableQuizContent (React component)
├── QuizMetadataEditor (Form component)
└── QuestionsEditor (Dynamic form)
    └── QuestionEditor[] (Form components)
        └── OptionsEditor (Dynamic form)
            └── OptionEditor[] (Form components)
```

**Note:** `QuizPreview` and `EditableQuizContent` are designed as reusable components that can be used across multiple features including AI quiz generation, manual quiz creation, and quiz editing workflows.

## 4. Component Details

### AIQuizGeneratorPage

- **Component description:** Main Astro page component that orchestrates the AI quiz generation workflow, managing the overall state and rendering the appropriate UI based on generation status.
- **Main elements:** Page header, breadcrumb navigation, main content area with conditional rendering based on generation state, error boundaries for robust error handling.
- **Handled interactions:** Page initialization, authentication verification, navigation events, global error handling.
- **Handled validation:** User authentication status, initial route permissions.
- **Types:** `GenerationState`, `QuizDetailDTO`, `AIQuizGenerationDTO`
- **Props:** None (page-level component)

### GenerationForm

- **Component description:** Interactive form component for capturing user input prompt and initiating AI quiz generation with clear instructions and validation feedback.
- **Main elements:** Form container, prompt textarea with character counter, helper text with generation tips, submit button with loading state, validation error displays.
- **Handled interactions:** Form submission, input changes, character counting, form reset.
- **Handled validation:** Prompt length validation (1-1000 characters), empty prompt prevention, trimmed input validation.
- **Types:** `AIQuizGenerationDTO`, `GenerationState`
- **Props:** `{ onSubmit: (data: AIQuizGenerationDTO) => void, isLoading: boolean, error?: string }`

### LoadingIndicator

- **Component description:** Visual feedback component displaying AI generation progress with animated indicators and descriptive text to keep users informed during processing.
- **Main elements:** Loading spinner or progress animation, status text describing current generation phase, estimated time remaining display.
- **Handled interactions:** None (display only).
- **Handled validation:** None.
- **Types:** `{ isVisible: boolean, status?: string }`
- **Props:** `{ isLoading: boolean, statusMessage?: string }`

### QuizPreview (Reusable Component)

- **Component description:** Read-only preview component displaying quiz content with customizable action buttons, providing clear overview of quiz questions and answers. Designed for reuse across AI generation, manual creation, and quiz browsing features.
- **Main elements:** Quiz title and description display, questions list with numbered items, answer options with correct answer indicators, customizable action buttons area.
- **Handled interactions:** Action button clicks (edit/publish/take/etc.), preview navigation, content expansion/collapse.
- **Handled validation:** Quiz content completeness check, minimum questions validation.
- **Types:** `QuizDetailDTO`, `QuestionWithOptionsDTO`
- **Props:** `{ quiz: QuizDetailDTO, actions?: ReactNode, showCorrectAnswers?: boolean, className?: string }`

### EditableQuizContent (Reusable Component)

- **Component description:** Comprehensive editing interface allowing users to modify all aspects of a quiz including title, description, questions, and answer options with real-time validation. Designed for reuse across AI generation, manual creation, and quiz editing features.
- **Main elements:** Editable quiz metadata form, dynamic questions editor with add/remove functionality, inline answer options editor, customizable save/cancel action buttons.
- **Handled interactions:** Content editing, question/option addition/removal, form submission, cancellation with unsaved changes warning, drag-and-drop reordering.
- **Handled validation:** Title length (1-200 characters), description length (1-1000 characters), minimum 1 question, minimum 2 options per question, exactly 1 correct answer per question.
- **Types:** `EditableQuizData`, `QuizUpdateDTO`, `QuestionWithOptionsDTO`
- **Props:** `{ quiz: QuizDetailDTO, onSave: (data: QuizUpdateDTO) => void, onCancel: () => void, saveButtonText?: string, cancelButtonText?: string, className?: string }`

## 5. Types

### GenerationState (ViewModel)

```typescript
interface GenerationState {
  status: "idle" | "generating" | "completed" | "error";
  prompt: string;
  generatedQuiz: QuizDetailDTO | null;
  error: string | null;
  isEditing: boolean;
}
```

- `status`: Current generation workflow state
- `prompt`: User input for AI generation
- `generatedQuiz`: AI-generated quiz data or null
- `error`: Error message for display or null
- `isEditing`: Boolean indicating if user is editing generated content

### EditableQuizData (ViewModel)

```typescript
interface EditableQuizData extends QuizDetailDTO {
  isDirty: boolean;
  validationErrors: {
    title?: string;
    description?: string;
    questions?: {
      [questionId: string]: {
        content?: string;
        options?: {
          [optionId: string]: string;
        };
      };
    };
  };
}
```

- `isDirty`: Indicates if quiz has unsaved changes
- `validationErrors`: Nested object containing field-specific validation errors

### QuizGenerationRequest (Component Type)

```typescript
interface QuizGenerationRequest {
  prompt: string;
  onSuccess: (quiz: QuizDetailDTO) => void;
  onError: (error: string) => void;
}
```

## 6. State Management

The view uses custom React hooks for state management:

### useAIQuizGeneration Hook

```typescript
const useAIQuizGeneration = () => {
  const [state, setState] = useState<GenerationState>({
    status: "idle",
    prompt: "",
    generatedQuiz: null,
    error: null,
    isEditing: false,
  });

  const generateQuiz = async (prompt: string) => {
    /* API call logic to POST /api/quizzes/ai/generate */
  };
  const resetGeneration = () => {
    /* Reset state */
  };
  const toggleEdit = () => {
    /* Toggle editing mode */
  };
  const updateGeneratedQuiz = (updatedQuiz: QuizDetailDTO) => {
    /* Update quiz after editing */
  };
  const publishQuiz = async (quiz: QuizDetailDTO) => {
    /* Save quiz to database via POST /api/quizzes */
  };

  return { state, generateQuiz, resetGeneration, toggleEdit, updateGeneratedQuiz, publishQuiz };
};
```

**Implementation Details:**

The `publishQuiz` function handles saving the generated quiz to the database:
- Validates quiz data (title required, minimum 1 question)
- Calls `POST /api/quizzes` endpoint with complete quiz structure
- Maps `QuizDetailDTO` to the API's expected format
- Returns success status and saved quiz ID
- Throws error with descriptive message on failure

### useEditableQuiz Hook

```typescript
const useEditableQuiz = (initialQuiz: QuizDetailDTO) => {
  const [editableQuiz, setEditableQuiz] = useState<EditableQuizData>(/* transform initial quiz */);

  const updateQuizField = (field: string, value: any) => {
    /* Update logic */
  };
  const validateQuiz = () => {
    /* Validation logic */
  };
  const saveQuiz = async () => {
    /* Save logic */
  };
  const cancelEdit = () => {
    /* Cancel logic */
  };

  return { editableQuiz, updateQuizField, validateQuiz, saveQuiz, cancelEdit };
};
```

## 7. API Integration

### Quiz Generation API

- **Endpoint:** `POST /api/quizzes/ai/generate`
- **Purpose:** Generate quiz preview using AI without saving to database
- **Request Type:** `AIQuizGenerationDTO`
- **Request Structure:**

```typescript
{
  prompt: string; // 1-1000 characters
}
```

- **Response Type:** `AIGeneratedQuizPreview`
- **Response Structure:**

```typescript
{
  title: string;
  description: string;
  visibility: "public" | "private";
  source: "ai_generated";
  ai_model: string;
  ai_prompt: string;
  ai_temperature: number;
  questions: AIGeneratedQuestionPreview[];
}
```

- **Error Codes:**
  - 400 Bad Request: Invalid prompt format
  - 401 Unauthorized: Authentication required
  - 422 Unprocessable Entity: AI generated invalid content
  - 503 Service Unavailable: AI service error
  - 500 Internal Server Error: Unexpected failure

### Quiz Publishing API

- **Endpoint:** `POST /api/quizzes`
- **Purpose:** Save complete quiz with questions and options to database
- **Request Type:** `QuizCreateInput`
- **Request Structure:**

```typescript
{
  title: string;
  description?: string;
  visibility: "public" | "private";
  source: "manual" | "ai_generated";
  ai_model?: string;
  ai_prompt?: string;
  ai_temperature?: number;
  questions: [
    {
      content: string;
      explanation?: string;
      position: number;
      options: [
        {
          content: string;
          is_correct: boolean;
          position: number;
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
  id: string;
  user_id: string;
  title: string;
  description: string;
  questions: QuestionWithOptionsDTO[];
  // ... other quiz metadata
}
```

- **Error Codes:**
  - 400 Bad Request: Validation errors
  - 401 Unauthorized: Authentication required
  - 500 Internal Server Error: Database error

## 8. User Interactions

### Primary Workflow

1. **Initial Load:** User navigates to `/quizzes/ai/generate`, sees generation form
2. **Prompt Input:** User types descriptive prompt (1-1000 chars) with real-time character counting
3. **Generation Trigger:** User clicks "Generate Quiz" button, form validates and submits
4. **Loading State:** Loading indicator shows with progress messaging
5. **Preview Display:** Generated quiz appears in preview mode with title, description, and questions
6. **Edit Option:** User can click "Edit Quiz" to modify content inline
7. **Final Save:** User confirms and saves quiz, redirected to quiz detail view

### Secondary Interactions

- **Error Recovery:** If generation fails, user sees error message with retry option
- **Prompt Refinement:** User can modify prompt and regenerate
- **Cancel Operation:** User can cancel during generation or editing with confirmation
- **Validation Feedback:** Real-time validation messages for all form inputs

## 9. Conditions and Validation

### Authentication Conditions

- **Component:** AIQuizGeneratorPage
- **Validation:** User must be authenticated via Supabase auth
- **Effect:** Redirect to login if not authenticated

### Prompt Validation

- **Component:** GenerationForm
- **Conditions:**
  - Prompt length: 1-1000 characters
  - Non-empty after trimming
  - No special characters that could break AI processing
- **Effect:** Submit button disabled, error messages displayed

### Quiz Content Validation

- **Component:** EditableQuizContent
- **Conditions:**
  - Title: 1-200 characters, required
  - Description: 1-1000 characters, required
  - Questions: Minimum 1, maximum 50
  - Options per question: Minimum 2, maximum 6
  - Correct answers: Exactly 1 per question
- **Effect:** Save button disabled, field-level error highlighting

### Network Conditions

- **Components:** All API-dependent components
- **Validation:** Network connectivity, API availability
- **Effect:** Error states with retry mechanisms

## 10. Error Handling

### Generation Errors

- **Scenario:** AI service failures, network issues, malformed responses
- **Handling:** Display user-friendly error message, provide retry button, log technical details
- **Recovery:** Allow prompt modification and regeneration

### Validation Errors

- **Scenario:** Invalid form inputs, incomplete data
- **Handling:** Inline error messages, field highlighting, submit prevention
- **Recovery:** Clear guidance on required fixes

### Authentication Errors

- **Scenario:** Session expiry, unauthorized access
- **Handling:** Redirect to login with return URL, clear session state
- **Recovery:** Re-authentication flow

### Network Errors

- **Scenario:** Connection loss, timeout, server errors
- **Handling:** Retry mechanism, offline detection, graceful degradation
- **Recovery:** Automatic retry with exponential backoff

## 11. Implementation Steps

1. **Create Astro Page Structure**
   - Set up `/src/pages/quizzes/ai/generate.astro`
   - Add authentication middleware integration
   - Implement basic page layout with breadcrumbs

2. **Implement Generation Form Component**
   - Create React component with Shadcn form elements
   - Add prompt input with character counting
   - Implement client-side validation with Zod schema
   - Add submit handler with loading state management

3. **Create API Integration Hook**
   - Implement `useAIQuizGeneration` custom hook
   - Add error handling and retry logic
   - Integrate with existing API endpoint
   - Add proper TypeScript types

4. **Build Loading Indicator Component**
   - Create animated loading component
   - Add status message support
   - Implement proper accessibility attributes
   - Style with Tailwind animations

5. **Develop Reusable Quiz Preview Component**
   - Create read-only quiz display in `/src/components/quiz/`
   - Format questions and options clearly
   - Add flexible action buttons prop
   - Implement responsive design
   - Design for reusability across features

6. **Implement Reusable Editable Quiz Component**
   - Create dynamic form for quiz editing in `/src/components/quiz/`
   - Add question/option management with drag-and-drop
   - Implement real-time validation
   - Add customizable save/cancel functionality
   - Design for reusability across features

7. **Add Error Boundaries and States**
   - Implement comprehensive error handling
   - Add error recovery mechanisms
   - Create user-friendly error messages
   - Add logging for debugging

8. **Style and Polish UI**
   - Apply Tailwind styles consistently
   - Ensure responsive design
   - Add proper spacing and typography
   - Implement dark mode support

9. **Add Accessibility Features**
   - Implement ARIA labels and roles
   - Add keyboard navigation support
   - Ensure proper focus management
   - Test with screen readers

10. **Testing and Optimization**
    - Add unit tests for components
    - Test API integration scenarios
    - Optimize loading performance
    - Validate error handling flows
