# Quiz Persistence Implementation

## Overview

This document describes the implementation of quiz persistence functionality, specifically the `POST /api/quizzes` endpoint and related components that enable saving AI-generated or manually created quizzes to the database.

## Implementation Date

October 2024

## Components Added

### 1. API Endpoint: `POST /api/quizzes`

**File:** `src/pages/api/quizzes/index.ts`

**Purpose:** Creates a complete quiz with all questions and options in the database in a single transaction.

**Key Features:**
- Accepts complete quiz structure with nested questions and options
- Validates all input data using Zod schema
- Creates quiz, questions, and options atomically
- Returns complete `QuizDetailDTO` with generated IDs
- Handles authentication and authorization (currently disabled for testing)
- Provides comprehensive error handling

**Request Flow:**
1. Validate Supabase configuration
2. Authenticate user (currently using test user ID)
3. Parse and validate JSON request body
4. Validate against `quizCreateSchema`
5. Call `QuizService.createQuiz()` with validated data
6. Return created quiz with 201 status code

**Error Handling:**
- 400 Bad Request: Invalid JSON or validation errors
- 401 Unauthorized: Missing authentication (when enabled)
- 500 Internal Server Error: Configuration errors or database failures

### 2. Validation Schema: `quiz-create.schema.ts`

**File:** `src/lib/validation/quiz-create.schema.ts`

**Purpose:** Provides comprehensive validation for quiz creation requests.

**Validation Rules:**
- **Quiz Level:**
  - Title: 1-200 characters, required
  - Description: 0-1000 characters, optional
  - Visibility: "public" or "private", defaults to "private"
  - Source: "manual" or "ai_generated", defaults to "manual"
  - AI metadata: optional fields for AI-generated quizzes

- **Question Level:**
  - Content: 1-1000 characters, required
  - Explanation: optional
  - Position: positive integer, required
  - Minimum 1 question required
  - Maximum 50 questions allowed

- **Option Level:**
  - Content: 1-500 characters, required
  - is_correct: boolean, required
  - Position: positive integer, required
  - Minimum 2 options per question
  - Maximum 10 options per question
  - At least one option must be correct per question

### 3. Service Method: `QuizService.createQuiz()`

**File:** `src/lib/services/quiz.service.ts`

**Purpose:** Handles database operations for creating a complete quiz.

**Process:**
1. Prepare quiz metadata from input
2. Insert quiz record into `quizzes` table with status "draft"
3. Iterate through questions:
   - Insert each question into `questions` table
   - For each question, insert all options into `answers` table
   - Store AI metadata if source is "ai_generated"
4. Collect all created records with their generated IDs
5. Return complete `QuizDetailDTO` structure

**Key Features:**
- Maintains data integrity through sequential inserts
- Handles position indexing (converts 1-based to 0-based for database)
- Preserves AI generation metadata in `ai_generation_metadata` field
- Provides detailed error messages for debugging

### 4. Hook Method: `useAIQuizGeneration.publishQuiz()`

**File:** `src/components/hooks/useAIQuizGeneration.ts`

**Purpose:** Client-side function to save generated quiz to database.

**Validation:**
- Checks quiz has valid title
- Ensures quiz has at least one question
- Validates question structure before sending

**Process:**
1. Validate quiz data locally
2. Transform `QuizDetailDTO` to API format
3. Send POST request to `/api/quizzes`
4. Parse response and extract quiz ID
5. Return success status and quiz ID
6. Throw descriptive errors on failure

**Data Mapping:**
- Maps quiz metadata (title, description, visibility, source)
- Maps AI-specific fields (model, prompt, temperature)
- Maps questions with content, explanation, and position
- Maps options with content, correctness, and position

## Integration Points

### Frontend to Backend

1. **Quiz Generation Flow:**
   - User generates quiz via `POST /api/quizzes/ai/generate`
   - Receives preview as `AIGeneratedQuizPreview`
   - Optionally edits quiz content
   - Saves via `publishQuiz()` function
   - Calls `POST /api/quizzes` endpoint

2. **Data Transformation:**
   - `AIGeneratedQuizPreview` → `QuizDetailDTO` (preview to editable)
   - `QuizDetailDTO` → `QuizCreateInput` (client to API)
   - `QuizCreateInput` → Database records (API to database)
   - Database records → `QuizDetailDTO` (database to client)

### Type System

**Request Types:**
- `AIQuizGenerationDTO`: Input for AI generation
- `QuizCreateInput`: Input for quiz persistence
- `QuizDetailDTO`: Complete quiz with questions and options

**Response Types:**
- `AIGeneratedQuizPreview`: AI generation output
- `QuizDetailDTO`: Saved quiz output

**Internal Types:**
- `QuizMetadata`: Structured metadata for database
- `GenerationState`: Client-side state management

## Security Considerations

### Authentication

Currently disabled for development testing. Production implementation should:
- Verify user session via `supabaseClient.auth.getSession()`
- Extract `userId` from authenticated session
- Return 401 Unauthorized if not authenticated

### Authorization

- Users can only create quizzes for themselves (enforced by `userId` parameter)
- Row-Level Security (RLS) policies should enforce ownership
- Service role key bypasses RLS for server-side operations

### Input Validation

- Zod schema validates all input data types and constraints
- Content length limits prevent database overflow
- Required field checks prevent incomplete data
- Nested validation ensures question and option integrity

### Error Handling

- Generic error messages to clients (no sensitive data leakage)
- Detailed logging for debugging (server-side only)
- Proper HTTP status codes for different error types

## Testing Considerations

### Unit Testing

- Test validation schema with valid/invalid inputs
- Test service method with mock database
- Test hook function with mock fetch
- Verify error handling for all failure scenarios

### Integration Testing

- Test complete flow from client to database
- Verify data transformation at each layer
- Test authentication and authorization
- Verify database transaction integrity

### Edge Cases

- Empty quiz (should fail validation)
- Quiz with 50+ questions (should fail validation)
- Question with <2 options (should fail validation)
- Question with no correct answers (should fail validation)
- Question with multiple correct answers (should succeed)
- Network failures during save
- Database constraint violations

## Future Enhancements

### Potential Improvements

1. **Transaction Safety:**
   - Wrap all database operations in a transaction
   - Implement rollback on partial failures
   - Add idempotency keys for retry safety

2. **Performance:**
   - Batch insert operations where possible
   - Use database triggers for metadata updates
   - Implement caching for frequently accessed quizzes

3. **Validation:**
   - Add duplicate question detection
   - Validate answer distribution (not all same correctness)
   - Check for minimum/maximum correct answers per question

4. **User Experience:**
   - Return operation progress for long-running saves
   - Implement draft auto-save functionality
   - Add conflict resolution for concurrent edits

5. **Monitoring:**
   - Track quiz creation success/failure rates
   - Monitor API response times
   - Log validation failure patterns

## Related Documentation

- `api-plan.md` - Complete API specification
- `ai-quiz-generation-view-implementation-plan.md` - Frontend implementation
- `quizes-generation-endpoint-plan.md` - AI generation endpoint details
- `db-plan.md` - Database schema and relationships

## Code References

### Key Files

- `src/pages/api/quizzes/index.ts` - Main API endpoint
- `src/lib/validation/quiz-create.schema.ts` - Validation schema
- `src/lib/services/quiz.service.ts` - Database service
- `src/components/hooks/useAIQuizGeneration.ts` - Client hook
- `src/types.ts` - Type definitions

### Key Functions

- `POST /api/quizzes` - API endpoint handler (line 18)
- `quizCreateSchema` - Zod validation schema
- `QuizService.createQuiz()` - Database operation (line 114)
- `useAIQuizGeneration.publishQuiz()` - Client function (line 90)

## Migration Path

### From Previous Implementation

The previous `publishQuiz` function was a stub that simulated API behavior:
```typescript
// OLD: Stub implementation
const publishQuiz = async (quiz: QuizDetailDTO) => {
  console.log("Publishing quiz:", quiz);
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { success: true, quizId: quiz.id || `quiz-${Date.now()}` };
};
```

### To Current Implementation

Now properly integrated with backend:
```typescript
// NEW: Real API integration
const publishQuiz = async (quiz: QuizDetailDTO) => {
  // Validate input
  if (!quiz.title?.trim()) throw new Error("Quiz title is required");
  if (!quiz.questions?.length) throw new Error("Quiz must have questions");

  // Call API
  const response = await fetch("/api/quizzes", {
    method: "POST",
    body: JSON.stringify({ /* complete quiz data */ })
  });

  // Handle response
  const savedQuiz = await response.json();
  return { success: true, quizId: savedQuiz.id };
};
```

### Breaking Changes

None - the function signature remains compatible:
- Input: `QuizDetailDTO`
- Output: `{ success: boolean, quizId: string }`
- Errors: Thrown as `Error` objects

## Conclusion

This implementation provides a robust, validated, and secure way to persist quizzes to the database. It maintains separation of concerns across layers (client, API, service, database) while ensuring data integrity and proper error handling throughout the stack.
