# Quiz Management API Endpoints - Testing Guide

This guide provides instructions for testing the newly implemented Quiz Management API endpoints.

## Implemented Endpoints

1. **GET /api/quizzes** - List quizzes with pagination
2. **GET /api/quizzes/[id]** - Get single quiz with details
3. **PUT /api/quizzes/[id]** - Update existing quiz
4. **DELETE /api/quizzes/[id]** - Soft delete quiz

## Prerequisites

- Development server running: `npm run dev`
- Supabase credentials configured in `.env`
- At least one quiz created in the database (use POST /api/quizzes)
- Valid UUID for testing (can be obtained from creating a quiz)

## Testing Instructions

### 1. GET /api/quizzes - List Quizzes

**Request:**
```bash
# Default (page 1, limit 10)
curl http://localhost:4321/api/quizzes

# With query parameters
curl "http://localhost:4321/api/quizzes?page=1&limit=5&sort=title&order=asc&visibility=public"
```

**Expected Response (200 OK):**
```json
{
  "quizzes": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Quiz Title",
      "description": "Quiz description",
      "visibility": "public",
      "status": "draft",
      "source": "manual",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalItems": 5
  }
}
```

**Test Cases:**
- [ ] Default pagination works (no query params)
- [ ] Custom page and limit work
- [ ] Sorting by title, created_at, updated_at
- [ ] Filtering by visibility (public/private)
- [ ] Invalid query parameters return 400
- [ ] Empty list returns correctly with zero items

---

### 2. GET /api/quizzes/[id] - Get Single Quiz

**Request:**
```bash
# Replace {quiz-id} with actual UUID
curl http://localhost:4321/api/quizzes/{quiz-id}
```

**Expected Response (200 OK):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Quiz Title",
  "description": "Quiz description",
  "visibility": "public",
  "status": "draft",
  "source": "manual",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "questions": [
    {
      "id": "uuid",
      "quiz_id": "uuid",
      "content": "Question text?",
      "explanation": "Optional explanation",
      "position": 1,
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "options": [
        {
          "id": "uuid",
          "question_id": "uuid",
          "content": "Option text",
          "is_correct": true,
          "position": 1,
          "created_at": "2024-01-01T00:00:00Z"
        }
      ]
    }
  ]
}
```

**Test Cases:**
- [ ] Valid quiz ID returns full quiz with questions and options
- [ ] Owner can access private quiz
- [ ] Non-owner can access public quiz
- [ ] Non-owner cannot access private quiz (returns 404)
- [ ] Invalid UUID format returns 400
- [ ] Non-existent quiz returns 404
- [ ] Deleted quiz returns 404
- [ ] Questions and options are sorted by position

---

### 3. PUT /api/quizzes/[id] - Update Quiz

**Request:**
```bash
# Replace {quiz-id} with actual UUID
curl -X PUT http://localhost:4321/api/quizzes/{quiz-id} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Quiz Title",
    "description": "Updated description",
    "visibility": "public",
    "source": "manual",
    "questions": [
      {
        "content": "Updated question?",
        "explanation": "Updated explanation",
        "position": 1,
        "options": [
          {
            "content": "Option A",
            "is_correct": true,
            "position": 1
          },
          {
            "content": "Option B",
            "is_correct": false,
            "position": 2
          }
        ]
      }
    ]
  }'
```

**Expected Response (200 OK):**
Returns updated quiz with full details (same structure as GET /api/quizzes/[id])

**Test Cases:**
- [ ] Owner can update quiz
- [ ] Non-owner cannot update quiz (returns 403)
- [ ] Invalid UUID returns 400
- [ ] Non-existent quiz returns 404
- [ ] Invalid request body returns 400 with validation errors
- [ ] Old questions/options are deleted
- [ ] New questions/options are created
- [ ] Updated quiz reflects changes immediately
- [ ] Minimum validation rules are enforced (min 1 question, min 2 options per question)

---

### 4. DELETE /api/quizzes/[id] - Delete Quiz

**Request:**
```bash
# Replace {quiz-id} with actual UUID
curl -X DELETE http://localhost:4321/api/quizzes/{quiz-id}
```

**Expected Response (204 No Content):**
No response body, just status code 204.

**Test Cases:**
- [ ] Owner can delete quiz (returns 204)
- [ ] Non-owner cannot delete quiz (returns 403)
- [ ] Invalid UUID returns 400
- [ ] Non-existent quiz returns 404
- [ ] Already deleted quiz returns 404
- [ ] Deleted quiz no longer appears in GET /api/quizzes
- [ ] Deleted quiz cannot be accessed via GET /api/quizzes/[id]
- [ ] Soft delete: quiz still exists in database with deleted_at timestamp

---

## Integration Testing Scenarios

### Scenario 1: Complete Quiz Lifecycle
1. **Create** a quiz using POST /api/quizzes
2. **List** quizzes to verify it appears
3. **Get** quiz by ID to verify details
4. **Update** quiz to change title and questions
5. **Verify** changes by getting quiz again
6. **Delete** quiz
7. **Verify** quiz no longer appears in list or by ID

### Scenario 2: Access Control Testing
1. Create a quiz with visibility "private"
2. Verify owner can access via GET
3. Verify non-owner gets 404 when accessing
4. Update visibility to "public"
5. Verify non-owner can now access via GET
6. Verify non-owner still cannot update or delete

### Scenario 3: Pagination Testing
1. Create multiple quizzes (at least 15)
2. Test pagination with different page sizes
3. Verify total counts are accurate
4. Verify sorting by different fields
5. Test edge cases (page beyond total pages)

### Scenario 4: Validation Testing
1. Test with missing required fields
2. Test with invalid data types
3. Test with values exceeding max limits
4. Test with empty arrays
5. Verify all error messages are clear and helpful

---

## Error Response Format

All endpoints return consistent error responses:

```json
{
  "error": "Error Type",
  "message": "User-friendly error message",
  "details": "Additional details (optional)"
}
```

**Common Status Codes:**
- **200 OK** - Successful GET/PUT
- **204 No Content** - Successful DELETE
- **400 Bad Request** - Invalid input or validation failure
- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - User lacks permission
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server or database error

---

## Notes

1. **Authentication**: Currently disabled for testing. In production, uncomment the authentication checks in each endpoint.

2. **Default User ID**: Endpoints use `DEFAULT_USER_ID` from environment variables for testing. Set this in `.env`:
   ```
   DEFAULT_USER_ID=your-test-user-uuid
   ```

3. **Soft Delete**: DELETE operation sets `deleted_at` timestamp but preserves data. Implement hard delete or cleanup job separately if needed.

4. **Atomic Functions**: The service layer attempts to use database functions (`create_quiz_atomic`, `update_quiz_atomic`) for true transactional safety. If these functions are not available, it falls back to manual cleanup approaches.

5. **Database Indexes**: Ensure indexes exist on:
   - `quizzes.user_id`
   - `quizzes.created_at`
   - `quizzes.status`
   - `questions.quiz_id`
   - `answers.question_id`

---

## Troubleshooting

### Issue: 500 Database Error
- Check Supabase credentials in `.env`
- Verify database tables exist
- Check Supabase service role key has proper permissions

### Issue: 404 on all requests
- Verify development server is running
- Check the URL path matches the endpoint structure
- Ensure quiz ID is a valid UUID

### Issue: Validation errors on valid data
- Check request body format (must be valid JSON)
- Verify all required fields are included
- Check data types match schema requirements

### Issue: Authentication errors
- If using authentication, ensure session/token is valid
- For testing, ensure DEFAULT_USER_ID is set correctly

---

## Next Steps

1. Enable authentication in production
2. Add rate limiting at infrastructure level
3. Implement caching for public quizzes
4. Add database migrations for atomic functions
5. Set up monitoring and alerting
6. Document API in OpenAPI/Swagger format
7. Add automated integration tests
