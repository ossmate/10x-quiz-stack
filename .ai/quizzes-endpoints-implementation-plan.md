# API Endpoints Implementation Plan: Quiz Management

## Overview

This document provides comprehensive implementation plans for the Quiz Management REST API endpoints. The implementation follows the existing codebase patterns established in the POST /api/quizzes endpoint and adheres to the project's technical stack (Astro, TypeScript, Supabase).

---

# 1. GET /api/quizzes - List Quizzes

## 1. Endpoint Overview

Retrieve a paginated list of quizzes accessible to the authenticated user. This includes both the user's own quizzes (regardless of visibility) and public quizzes from other users. The endpoint supports filtering by visibility, sorting by creation date, and pagination.

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/quizzes`
- **Parameters**:
  - **Optional Query Parameters**:
    - `page`: number (default: 1) - Page number for pagination
    - `limit`: number (default: 10, max: 100) - Number of items per page
    - `sort`: string (default: 'created_at') - Field to sort by
    - `order`: 'asc' | 'desc' (default: 'desc') - Sort order
    - `visibility`: 'public' | 'private' | undefined - Filter by visibility
- **Request Body**: None
- **Authentication**: Required (JWT token in Authorization header or session cookie)

## 3. Used Types

### Request Types
```typescript
// New Zod schema needed: src/lib/validation/quiz-list-query.schema.ts
import { z } from "zod";

export const quizListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(['created_at', 'title', 'updated_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  visibility: z.enum(['public', 'private']).optional(),
});

export type QuizListQuery = z.infer<typeof quizListQuerySchema>;
```

### Response Types (already exist in src/types.ts)
- `QuizListResponse`: Contains array of QuizDTO and pagination metadata
- `QuizDTO`: Individual quiz data without nested questions

## 4. Response Details

### Success Response (200 OK)
```json
{
  "quizzes": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "string",
      "description": "string",
      "visibility": "public|private",
      "status": "active|archived|deleted",
      "source": "manual|ai_generated",
      "ai_model": "string",
      "created_at": "ISO8601 timestamp",
      "updated_at": "ISO8601 timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalItems": 50
  }
}
```

### Error Responses
- **400 Bad Request**: Invalid query parameters
  ```json
  {
    "error": "Validation Failed",
    "message": "Invalid query parameters",
    "details": [
      { "field": "page", "message": "Must be a positive integer" }
    ]
  }
  ```
- **401 Unauthorized**: Missing or invalid authentication
  ```json
  {
    "error": "Unauthorized",
    "message": "Authentication is required to access quizzes"
  }
  ```
- **500 Internal Server Error**: Database or unexpected errors

## 5. Data Flow

1. **Request Parsing**: Extract and validate query parameters from URL
2. **Authentication**: Verify user session/token
3. **Database Query**:
   - Build Supabase query with filters:
     - Include user's own quizzes (all visibilities)
     - Include public quizzes from other users
     - Apply visibility filter if provided
     - Apply sorting and ordering
   - Execute count query for total items
   - Execute paginated data query
4. **Data Transformation**:
   - Transform database records to QuizDTO format
   - Extract metadata from JSON field
   - Map database status to DTO status
5. **Response Building**: Construct QuizListResponse with data and pagination
6. **Response**: Return 200 OK with JSON payload

### Supabase Query Pattern
```typescript
// Count query
const countQuery = supabase
  .from('quizzes')
  .select('*', { count: 'exact', head: true })
  .is('deleted_at', null)
  .or(`user_id.eq.${userId},status.eq.public`);

// Data query
const dataQuery = supabase
  .from('quizzes')
  .select('*')
  .is('deleted_at', null)
  .or(`user_id.eq.${userId},status.eq.public`)
  .order(sort, { ascending: order === 'asc' })
  .range((page - 1) * limit, page * limit - 1);
```

## 6. Security Considerations

### Authentication
- Verify user session using `supabaseClient.auth.getSession()`
- Return 401 if no valid session exists

### Authorization
- Users can see:
  - All their own quizzes (draft, private, public, archived)
  - Public quizzes from other users
- Implemented via Supabase query filters (`or` condition)

### Input Validation
- Validate all query parameters using Zod schema
- Enforce max limit to prevent excessive data retrieval
- Sanitize sort field to prevent SQL injection (use enum)

### Data Exposure
- Do not expose deleted quizzes (`deleted_at IS NULL`)
- Only return fields defined in QuizDTO (no sensitive internal data)

## 7. Error Handling

| Error Scenario | Status Code | Response Message |
|----------------|-------------|------------------|
| Invalid query parameters | 400 | "Invalid query parameters" with validation details |
| Missing authentication | 401 | "Authentication is required to access quizzes" |
| Database connection error | 500 | "Failed to retrieve quizzes from database" |
| Unexpected error | 500 | "An unexpected error occurred" |

### Error Handling Pattern
```typescript
try {
  // Query execution
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  console.error("Failed to fetch quizzes:", errorMessage);

  return new Response(
    JSON.stringify({
      error: "Database Error",
      message: "Failed to retrieve quizzes from database",
      details: errorMessage,
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

## 8. Performance Considerations

### Optimization Strategies
1. **Pagination**: Mandatory to avoid loading all quizzes
2. **Indexes**: Ensure database indexes on:
   - `user_id` for filtering
   - `created_at` for sorting
   - `status` for visibility filtering
3. **Efficient Queries**: Use Supabase's built-in count and range features
4. **Metadata Parsing**: Minimize JSON parsing overhead by selecting only needed fields

### Expected Query Performance
- Single count query: ~10-50ms
- Single data query with pagination: ~20-100ms
- Total endpoint response time: <200ms for typical loads

## 9. Implementation Steps

### Step 1: Create Validation Schema
Create `src/lib/validation/quiz-list-query.schema.ts`:
- Define Zod schema for query parameters
- Use `z.coerce` for number parsing from URL strings
- Set sensible defaults and limits

### Step 2: Add Service Methods
Add to `src/lib/services/quiz.service.ts`:

```typescript
/**
 * Retrieve paginated list of quizzes accessible to user
 */
async getQuizzes(
  supabase: SupabaseClientType,
  userId: string,
  query: QuizListQuery
): Promise<QuizListResponse> {
  // Implementation
}

/**
 * Transform database quiz record to QuizDTO
 */
private transformQuizToDTO(
  dbQuiz: Database['public']['Tables']['quizzes']['Row']
): QuizDTO {
  // Implementation
}
```

### Step 3: Create API Route
Create `src/pages/api/quizzes/index.ts` or update existing POST handler to include GET:

```typescript
export const GET: APIRoute = async ({ request, locals }) => {
  // 1. Parse query parameters from URL
  // 2. Validate using quizListQuerySchema
  // 3. Check authentication
  // 4. Call quizService.getQuizzes()
  // 5. Return 200 with QuizListResponse
}
```

### Step 4: Error Handling
- Wrap all operations in try-catch blocks
- Log errors for debugging
- Return appropriate status codes and error messages

### Step 5: Testing
- Test pagination (different pages, limits)
- Test filtering by visibility
- Test sorting and ordering
- Test authentication failures
- Test with edge cases (no quizzes, single quiz, max limit)
- Test performance with large datasets

---

# 2. GET /api/quizzes/[id] - Get Single Quiz

## 1. Endpoint Overview

Retrieve detailed information about a single quiz, including all its questions and answer options. Access is granted if the user is the quiz owner or if the quiz is publicly accessible.

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/quizzes/{id}`
- **Parameters**:
  - **Required Path Parameters**:
    - `id`: UUID - Quiz identifier
- **Request Body**: None
- **Authentication**: Required

## 3. Used Types

### Path Parameter Validation
```typescript
// New utility needed: src/lib/validation/uuid.schema.ts
import { z } from "zod";

export const uuidSchema = z.string().uuid("Invalid UUID format");
```

### Response Types (already exist in src/types.ts)
- `QuizDetailDTO`: Quiz with nested questions and options
- `QuestionWithOptionsDTO`: Question with options array
- `OptionDTO`: Individual answer option

## 4. Response Details

### Success Response (200 OK)
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "description": "string",
  "visibility": "public|private",
  "status": "active|archived|deleted",
  "source": "manual|ai_generated",
  "ai_model": "string",
  "ai_prompt": "string",
  "ai_temperature": 1.0,
  "created_at": "ISO8601 timestamp",
  "updated_at": "ISO8601 timestamp",
  "questions": [
    {
      "id": "uuid",
      "quiz_id": "uuid",
      "content": "What is TypeScript?",
      "explanation": "Explanation text",
      "position": 1,
      "status": "active",
      "created_at": "ISO8601 timestamp",
      "updated_at": "ISO8601 timestamp",
      "options": [
        {
          "id": "uuid",
          "question_id": "uuid",
          "content": "A programming language",
          "is_correct": true,
          "position": 1,
          "created_at": "ISO8601 timestamp"
        }
      ]
    }
  ]
}
```

### Error Responses
- **400 Bad Request**: Invalid quiz ID format
- **401 Unauthorized**: Missing authentication
- **404 Not Found**: Quiz doesn't exist or user lacks access
- **500 Internal Server Error**: Database errors

## 5. Data Flow

1. **Path Parameter Extraction**: Extract quiz ID from URL
2. **Parameter Validation**: Validate UUID format
3. **Authentication**: Verify user session
4. **Database Query**:
   - Query quiz record by ID
   - Check if deleted (`deleted_at IS NULL`)
   - Verify access permission (owner OR public status)
   - Query related questions (ordered by order_index)
   - Query related options for each question
5. **Data Transformation**:
   - Build QuizDetailDTO from quiz record
   - Extract metadata from JSON field
   - Build QuestionWithOptionsDTO array
   - Build OptionDTO array for each question
   - Map order_index (0-based) to position (1-based)
6. **Response**: Return 200 OK with QuizDetailDTO

### Supabase Query Pattern
```typescript
// Main quiz query with nested data
const { data, error } = await supabase
  .from('quizzes')
  .select(`
    *,
    questions:questions(
      *,
      answers:answers(*)
    )
  `)
  .eq('id', quizId)
  .is('deleted_at', null)
  .single();

// Check access permission
const hasAccess = data.user_id === userId || data.status === 'public';
```

## 6. Security Considerations

### Authentication
- Require valid user session
- Return 401 if not authenticated

### Authorization
- User can access quiz if:
  - They are the owner (`user_id` matches)
  - OR quiz status is `public`
- Return 404 (not 403) to avoid information disclosure about quiz existence

### Input Validation
- Validate UUID format to prevent invalid queries
- Handle malformed IDs gracefully

### Data Exposure
- Do not expose deleted quizzes
- Return 404 if quiz exists but user lacks access (no information leakage)

## 7. Error Handling

| Error Scenario | Status Code | Response Message |
|----------------|-------------|------------------|
| Invalid UUID format | 400 | "Invalid quiz ID format" |
| Missing authentication | 401 | "Authentication is required" |
| Quiz not found | 404 | "Quiz not found" |
| No access permission | 404 | "Quiz not found" (same as not found) |
| Database error | 500 | "Failed to retrieve quiz" |

## 8. Performance Considerations

### Optimization Strategies
1. **Single Query**: Use Supabase's nested select to fetch all data in one query
2. **Indexes**: Ensure indexes on:
   - `quizzes.id` (primary key)
   - `questions.quiz_id` (foreign key)
   - `answers.question_id` (foreign key)
3. **Caching**: Consider implementing caching for public quizzes
4. **Data Size**: Monitor response size for quizzes with many questions

### Expected Performance
- Single nested query: ~50-150ms
- Total response time: <300ms

## 9. Implementation Steps

### Step 1: Create UUID Validation Schema
Create `src/lib/validation/uuid.schema.ts` with UUID validation

### Step 2: Add Service Method
Add to `src/lib/services/quiz.service.ts`:

```typescript
/**
 * Get quiz by ID with permission check
 */
async getQuizById(
  supabase: SupabaseClientType,
  quizId: string,
  userId: string
): Promise<QuizDetailDTO | null> {
  // 1. Query quiz with nested questions and answers
  // 2. Check if exists and not deleted
  // 3. Verify access permission
  // 4. Transform to QuizDetailDTO
  // 5. Return null if not found or no access
}
```

### Step 3: Create API Route
Create `src/pages/api/quizzes/[id].ts`:

```typescript
export const GET: APIRoute = async ({ params, locals }) => {
  // 1. Extract quiz ID from params
  // 2. Validate UUID format
  // 3. Check authentication
  // 4. Call quizService.getQuizById()
  // 5. Return 404 if null
  // 6. Return 200 with QuizDetailDTO
}
```

### Step 4: Data Transformation
Implement helper methods for:
- Extracting metadata from JSON field
- Mapping database status to DTO status
- Converting order_index to position
- Filtering deleted questions/answers

### Step 5: Testing
- Test with owner access
- Test with public quiz access
- Test with private quiz (should deny non-owner)
- Test with invalid UUID
- Test with non-existent quiz
- Test with deleted quiz
- Test performance with large quizzes

---

# 3. PUT /api/quizzes/[id] - Update Quiz

## 1. Endpoint Overview

Update an existing quiz with complete replacement of all data including questions and options. Only the quiz owner can perform this operation. This is a full replacement operation, not a partial update.

## 2. Request Details

- **HTTP Method**: PUT
- **URL Structure**: `/api/quizzes/{id}`
- **Parameters**:
  - **Required Path Parameters**:
    - `id`: UUID - Quiz identifier
- **Request Body**: Same as POST /api/quizzes (QuizCreateInput)
  ```json
  {
    "title": "string (1-200 characters)",
    "description": "string (max 1000 characters)",
    "visibility": "public|private",
    "source": "manual|ai_generated",
    "ai_model": "string (optional)",
    "ai_prompt": "string (optional)",
    "ai_temperature": "number (0.0-2.0, optional)",
    "questions": [
      {
        "content": "string (1-1000 characters)",
        "explanation": "string (max 2000 characters, optional)",
        "position": "number (positive integer)",
        "options": [
          {
            "content": "string (1-500 characters)",
            "is_correct": "boolean",
            "position": "number (positive integer)"
          }
        ]
      }
    ]
  }
  ```
- **Authentication**: Required

## 3. Used Types

### Request Types (already exist)
- `QuizCreateInput`: From quiz-create.schema.ts (reused for updates)
- UUID validation: From uuid.schema.ts

### Response Types (already exist)
- `QuizDetailDTO`: Updated quiz with nested questions and options

## 4. Response Details

### Success Response (200 OK)
Returns the updated quiz with all questions and options in QuizDetailDTO format.

### Error Responses
- **400 Bad Request**: Invalid quiz ID or request payload
- **401 Unauthorized**: Missing authentication
- **403 Forbidden**: User is not the quiz owner
- **404 Not Found**: Quiz doesn't exist
- **500 Internal Server Error**: Database errors

## 5. Data Flow

1. **Request Parsing**: Extract quiz ID and request body
2. **Input Validation**:
   - Validate UUID format
   - Validate request body using quizCreateSchema
3. **Authentication**: Verify user session
4. **Authorization**: Check if user owns the quiz
5. **Database Transaction**:
   - Verify quiz exists and get current owner
   - Check ownership (return 403 if not owner)
   - Delete existing questions and answers (cascade)
   - Update quiz record
   - Insert new questions and answers
6. **Data Transformation**: Build QuizDetailDTO from updated data
7. **Response**: Return 200 OK with updated quiz

### Transaction Approach
Two strategies (similar to POST implementation):

#### Strategy A: Atomic Update (Preferred)
Use database function for transactional safety:
```typescript
await supabase.rpc('update_quiz_atomic', {
  p_quiz_id: quizId,
  p_user_id: userId,
  p_quiz_input: quizData
});
```

#### Strategy B: Cleanup on Failure (Fallback)
Manual transaction with rollback attempt on failure.

## 6. Security Considerations

### Authentication
- Require valid user session
- Return 401 if not authenticated

### Authorization
- Verify quiz ownership before allowing update
- Return 403 Forbidden (not 404) if user is not the owner
  - This is acceptable because the user explicitly requested to update a specific quiz ID
  - Different from GET where we use 404 to avoid information disclosure

### Input Validation
- Validate UUID format for quiz ID
- Reuse quizCreateSchema for full validation
- Ensure all business rules are enforced (min/max questions, options, etc.)

### Data Integrity
- Use transaction to ensure atomic updates
- Prevent orphaned questions/answers
- Maintain referential integrity

### Audit Trail
- Database should track updated_at timestamp automatically
- Consider logging update operations for security audit

## 7. Error Handling

| Error Scenario | Status Code | Response Message |
|----------------|-------------|------------------|
| Invalid UUID format | 400 | "Invalid quiz ID format" |
| Invalid request payload | 400 | "Validation Failed" with details |
| Missing authentication | 401 | "Authentication is required" |
| Not quiz owner | 403 | "You do not have permission to update this quiz" |
| Quiz not found | 404 | "Quiz not found" |
| Database error during update | 500 | "Failed to update quiz" |

## 8. Performance Considerations

### Optimization Strategies
1. **Atomic Operations**: Use database function for true transactional updates
2. **Batch Operations**: Delete and insert in batches where possible
3. **Cascade Deletes**: Leverage foreign key CASCADE for automatic cleanup
4. **Indexes**: Ensure proper indexes on foreign keys

### Expected Performance
- Ownership check query: ~20ms
- Delete old data: ~50-100ms (depends on question count)
- Insert new data: ~100-200ms (depends on question count)
- Total operation: <500ms for typical quiz sizes

### Considerations
- Large quizzes (many questions) will take longer
- Consider implementing request timeout (e.g., 30 seconds)
- Monitor database connection pool usage

## 9. Implementation Steps

### Step 1: Add Service Method
Add to `src/lib/services/quiz.service.ts`:

```typescript
/**
 * Update quiz with complete replacement (atomic)
 */
async updateQuiz(
  supabase: SupabaseClientType,
  quizId: string,
  userId: string,
  quizData: QuizCreateInput
): Promise<QuizDetailDTO> {
  // Try atomic approach first
  try {
    return await this.updateQuizAtomic(supabase, quizId, userId, quizData);
  } catch (error) {
    // Fallback to manual approach if function not available
    return await this.updateQuizWithCleanup(supabase, quizId, userId, quizData);
  }
}

/**
 * Update quiz atomically using database function
 */
private async updateQuizAtomic(...): Promise<QuizDetailDTO> {
  // Call database function
}

/**
 * Update quiz with manual cleanup (fallback)
 */
private async updateQuizWithCleanup(...): Promise<QuizDetailDTO> {
  // 1. Check ownership
  // 2. Begin manual "transaction"
  // 3. Delete old questions/answers
  // 4. Update quiz
  // 5. Insert new questions/answers
  // 6. On failure, attempt rollback
}

/**
 * Check if user owns quiz
 */
private async checkQuizOwnership(
  supabase: SupabaseClientType,
  quizId: string,
  userId: string
): Promise<boolean> {
  // Query quiz and check user_id
}
```

### Step 2: Create Database Function (Optional but Recommended)
Create migration for atomic update function:

```sql
CREATE OR REPLACE FUNCTION update_quiz_atomic(
  p_quiz_id UUID,
  p_user_id UUID,
  p_quiz_input JSONB
) RETURNS JSONB AS $$
BEGIN
  -- Check ownership
  -- Delete old questions/answers
  -- Update quiz
  -- Insert new questions/answers
  -- Return updated quiz with nested data
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 3: Update API Route
Update `src/pages/api/quizzes/[id].ts` to include PUT handler:

```typescript
export const PUT: APIRoute = async ({ params, request, locals }) => {
  // 1. Extract quiz ID from params
  // 2. Validate UUID format
  // 3. Parse and validate request body
  // 4. Check authentication
  // 5. Call quizService.updateQuiz()
  //    - Catch ownership errors (403)
  //    - Catch not found errors (404)
  // 6. Return 200 with updated QuizDetailDTO
}
```

### Step 4: Error Handling
- Distinguish between different error types
- Return appropriate status codes
- Provide clear error messages
- Log errors for debugging

### Step 5: Testing
- Test with quiz owner
- Test with non-owner (should return 403)
- Test with invalid UUID
- Test with non-existent quiz
- Test with invalid request payload
- Test with edge cases (min/max questions)
- Test transaction rollback on failures
- Test performance with large quizzes

---

# 4. DELETE /api/quizzes/[id] - Delete Quiz

## 1. Endpoint Overview

Soft delete a quiz by setting the `deleted_at` timestamp. Only the quiz owner can perform this operation. Soft deletion preserves data for potential recovery and maintains referential integrity.

## 2. Request Details

- **HTTP Method**: DELETE
- **URL Structure**: `/api/quizzes/{id}`
- **Parameters**:
  - **Required Path Parameters**:
    - `id`: UUID - Quiz identifier
- **Request Body**: None
- **Authentication**: Required

## 3. Used Types

### Path Parameter Validation
- UUID validation using existing uuid.schema.ts

### Response
- No response body for successful deletion (204 No Content)
- Error responses use standard error format

## 4. Response Details

### Success Response (204 No Content)
No response body. The quiz has been successfully soft deleted.

### Error Responses
- **400 Bad Request**: Invalid quiz ID format
- **401 Unauthorized**: Missing authentication
- **403 Forbidden**: User is not the quiz owner
- **404 Not Found**: Quiz doesn't exist or already deleted
- **500 Internal Server Error**: Database errors

## 5. Data Flow

1. **Path Parameter Extraction**: Extract quiz ID from URL
2. **Parameter Validation**: Validate UUID format
3. **Authentication**: Verify user session
4. **Database Operations**:
   - Query quiz to verify existence and ownership
   - Check if already deleted
   - Verify user is the owner
   - Update `deleted_at` timestamp to NOW()
5. **Response**: Return 204 No Content

### Supabase Query Pattern
```typescript
// Check ownership and soft delete
const { data: quiz, error: fetchError } = await supabase
  .from('quizzes')
  .select('id, user_id, deleted_at')
  .eq('id', quizId)
  .single();

// Verify ownership and not already deleted
if (!quiz || quiz.deleted_at !== null) {
  return 404;
}
if (quiz.user_id !== userId) {
  return 403;
}

// Soft delete
const { error: deleteError } = await supabase
  .from('quizzes')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', quizId);
```

## 6. Security Considerations

### Authentication
- Require valid user session
- Return 401 if not authenticated

### Authorization
- Verify quiz ownership before allowing deletion
- Return 403 Forbidden if user is not the owner
- Return 404 if quiz doesn't exist or already deleted

### Soft Deletion Benefits
- Data preservation for audit and recovery
- Referential integrity maintained
- Related attempts and responses preserved
- Can implement "restore" functionality later

### Cascade Considerations
- Soft deletion at quiz level
- Questions and answers remain in database
- Future queries must filter on `deleted_at IS NULL`
- Consider implementing cascade soft delete for consistency

## 7. Error Handling

| Error Scenario | Status Code | Response Message |
|----------------|-------------|------------------|
| Invalid UUID format | 400 | "Invalid quiz ID format" |
| Missing authentication | 401 | "Authentication is required" |
| Not quiz owner | 403 | "You do not have permission to delete this quiz" |
| Quiz not found | 404 | "Quiz not found" |
| Quiz already deleted | 404 | "Quiz not found" |
| Database error | 500 | "Failed to delete quiz" |

## 8. Performance Considerations

### Optimization Strategies
1. **Single Update**: Only update one field (deleted_at)
2. **Index**: Ensure index on quiz ID (primary key)
3. **Fast Operation**: Should complete in <50ms

### Expected Performance
- Ownership check: ~20ms
- Update operation: ~20ms
- Total response time: <100ms

### Soft Delete Implications
- Deleted quizzes still occupy storage
- Consider implementing periodic hard delete for old soft-deleted records
- Ensure all queries include `deleted_at IS NULL` filter

## 9. Implementation Steps

### Step 1: Add Service Method
Add to `src/lib/services/quiz.service.ts`:

```typescript
/**
 * Soft delete a quiz
 *
 * @param supabase - Supabase client
 * @param quizId - Quiz ID to delete
 * @param userId - User requesting deletion
 * @returns true if deleted, throws error otherwise
 */
async deleteQuiz(
  supabase: SupabaseClientType,
  quizId: string,
  userId: string
): Promise<void> {
  // 1. Fetch quiz to check existence and ownership
  const { data: quiz, error: fetchError } = await supabase
    .from('quizzes')
    .select('id, user_id, deleted_at')
    .eq('id', quizId)
    .single();

  // 2. Handle not found or already deleted
  if (fetchError || !quiz || quiz.deleted_at !== null) {
    throw new Error('Quiz not found');
  }

  // 3. Check ownership
  if (quiz.user_id !== userId) {
    throw new Error('Forbidden');
  }

  // 4. Soft delete
  const { error: deleteError } = await supabase
    .from('quizzes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', quizId);

  if (deleteError) {
    throw new Error(`Failed to delete quiz: ${deleteError.message}`);
  }
}
```

### Step 2: Update API Route
Update `src/pages/api/quizzes/[id].ts` to include DELETE handler:

```typescript
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Extract quiz ID from params
    const quizId = params.id;

    // 2. Validate UUID format
    const validationResult = uuidSchema.safeParse(quizId);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid quiz ID format"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Check authentication
    const { data: { session } } = await locals.supabase.auth.getSession();
    if (!session) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication is required"
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Call service to delete quiz
    await quizService.deleteQuiz(
      locals.supabase,
      validationResult.data,
      session.user.id
    );

    // 5. Return 204 No Content
    return new Response(null, { status: 204 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Handle specific errors
    if (errorMessage === 'Quiz not found') {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Quiz not found"
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (errorMessage === 'Forbidden') {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "You do not have permission to delete this quiz"
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Database or unexpected error
    console.error("Failed to delete quiz:", errorMessage);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to delete quiz"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

### Step 3: Update Database Queries
Ensure all existing queries filter out deleted quizzes:
- Update GET /api/quizzes to include `.is('deleted_at', null)`
- Update GET /api/quizzes/[id] to check deleted_at
- Verify existing queries in QuizService

### Step 4: Testing
- Test with quiz owner (should succeed)
- Test with non-owner (should return 403)
- Test with invalid UUID (should return 400)
- Test with non-existent quiz (should return 404)
- Test with already deleted quiz (should return 404)
- Test that deleted quiz no longer appears in list
- Test that deleted quiz cannot be accessed via GET
- Test performance

### Step 5: Documentation
- Document soft delete behavior
- Document data retention policy
- Document potential "restore" feature for future

---

## General Implementation Guidelines

### Code Organization
- Place validation schemas in `src/lib/validation/`
- Place service methods in `src/lib/services/quiz.service.ts`
- Place API routes in `src/pages/api/quizzes/`

### Error Handling Pattern
```typescript
try {
  // Operation
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  console.error("Operation failed:", errorMessage);

  return new Response(
    JSON.stringify({
      error: "Error Type",
      message: "User-friendly message",
      details: errorMessage
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

### Authentication Pattern
```typescript
const { data: { session } } = await supabaseClient.auth.getSession();
if (!session) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Authentication is required"
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
const userId = session.user.id;
```

### Testing Checklist
For each endpoint:
- [ ] Happy path with valid data
- [ ] Invalid input validation
- [ ] Authentication failures
- [ ] Authorization failures
- [ ] Not found scenarios
- [ ] Edge cases (empty data, max limits)
- [ ] Performance under load
- [ ] Error handling and logging
- [ ] Response format compliance

### Deployment Considerations
1. **Database Migrations**: Ensure atomic update functions are deployed before API
2. **Backward Compatibility**: Old clients should still work during rollout
3. **Monitoring**: Set up alerts for error rates and response times
4. **Rate Limiting**: Implement at infrastructure level
5. **Documentation**: Update API documentation with new endpoints
