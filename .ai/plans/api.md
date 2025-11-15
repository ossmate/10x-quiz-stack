# REST API Plan

## 1. Resources

- **Profiles**: Corresponds to the `profiles` table. Represents user accounts with extended information beyond authentication.
- **Quizzes**: Corresponds to the `quizzes` table. Represents quiz entities created by users, including metadata like title, description, visibility, and source (manual or AI-generated).
- **Questions**: Corresponds to the `questions` table. Contains individual questions belonging to quizzes, along with explanations and positions.
- **Options**: Corresponds to the `options` table. Represents answer options for each question with correctness flags.
- **Quiz Attempts**: Corresponds to the `quiz_attempts` table. Records instances of users taking quizzes, including status, score, and timestamps.
- **Quiz Responses**: Corresponds to the `quiz_responses` table. Stores individual responses in a quiz attempt, linking questions and selected options.

## 2. Endpoints

### 2.1. Profiles

- **GET /api/profiles/{id}**
  - _Description_: Retrieve a user profile.
  - _Response_:
    ```json
    {
      "id": "uuid",
      "username": "string",
      "display_name": "string",
      "avatar_url": "string",
      "created_at": "ISO8601 timestamp",
      "updated_at": "ISO8601 timestamp"
    }
    ```
  - _Success Codes_: 200 OK
  - _Error Codes_: 404 Not Found, 401 Unauthorized

- **POST /api/profiles**
  - _Description_: Create a new profile (usually during registration). Note: The authenticated user's ID must match the profile.
  - _Request Payload_:
    ```json
    {
      "username": "string (3-50 characters)",
      "display_name": "string (max 100 characters)",
      "avatar_url": "string (url)"
    }
    ```
  - _Success Codes_: 201 Created
  - _Error Codes_: 400 Bad Request, 401 Unauthorized

- **PUT /api/profiles/{id}**
  - _Description_: Update an existing profile. Only the owner can update.
  - _Request Payload_: Same as POST payload
  - _Success Codes_: 200 OK
  - _Error Codes_: 400 Bad Request, 401 Unauthorized, 403 Forbidden

### 2.2. Quizzes

- **GET /api/quizzes**
  - _Description_: Retrieve a list of quizzes accessible to the user. Includes both personal and public quizzes.
  - _Query Parameters_:
    - `page`: number (for pagination)
    - `limit`: number (items per page)
    - `sort`: string (e.g., 'created_at')
    - `order`: 'asc' | 'desc'
    - `visibility`: filter by 'public' or 'private'
  - _Response_:
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
      "pagination": { "page": 1, "limit": 10, "totalPages": 5, "totalItems": 50 }
    }
    ```
  - _Success Codes_: 200 OK
  - _Error Codes_: 400 Bad Request, 401 Unauthorized

- **GET /api/quizzes/{id}**
  - _Description_: Retrieve details of a single quiz along with related questions and options (if needed).
  - _Response_:
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
      "ai_temperature": "number",
      "created_at": "ISO8601 timestamp",
      "updated_at": "ISO8601 timestamp",
      "questions": [
        /* array of questions with options */
      ]
    }
    ```
  - _Success Codes_: 200 OK
  - _Error Codes_: 404 Not Found, 401 Unauthorized

- **POST /api/quizzes**
  - _Description_: Create a new quiz with complete question and option data.
  - _Request Payload_:
    ```json
    {
      "title": "string (1-200 characters)",
      "description": "string (max 1000 characters)",
      "visibility": "public|private",
      "source": "manual|ai_generated",
      "ai_model": "string (if generated)",
      "ai_prompt": "string (if generated)",
      "ai_temperature": "number (0.0 to 2.0, if generated)",
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
  - _Response_: Returns complete `QuizDetailDTO` with all questions and options
  - _Success Codes_: 201 Created
  - _Error Codes_: 400 Bad Request, 401 Unauthorized, 500 Internal Server Error
  - _Validation Rules_:
    - Minimum 1 question required
    - Maximum 50 questions allowed
    - Minimum 2 options per question
    - Maximum 10 options per question
    - At least one option must be marked as correct per question

- **PUT /api/quizzes/{id}**
  - _Description_: Update an existing quiz. The owner can modify quiz content including title and description.
  - _Request Payload_: Same as POST payload
  - _Success Codes_: 200 OK
  - _Error Codes_: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

- **DELETE /api/quizzes/{id}**
  - _Description_: Delete a quiz (soft delete by changing status or actual deletion based on business rules).
  - _Success Codes_: 200 OK or 204 No Content
  - _Error Codes_: 401 Unauthorized, 403 Forbidden, 404 Not Found

### 2.3. Questions

- **GET /api/quizzes/{quizId}/questions**
  - _Description_: Retrieve questions for a specific quiz, with ordering by position.
  - _Response_:
    ```json
    [
      {
        "id": "uuid",
        "quiz_id": "uuid",
        "content": "string (1-1000 characters)",
        "explanation": "string (max 2000 characters)",
        "position": "number",
        "status": "active|deleted",
        "created_at": "ISO8601 timestamp",
        "updated_at": "ISO8601 timestamp"
      }
    ]
    ```
  - _Success Codes_: 200 OK
  - _Error Codes_: 400 Bad Request, 401 Unauthorized, 404 Not Found

- **POST /api/quizzes/{quizId}/questions**
  - _Description_: Add a new question to a quiz.
  - _Request Payload_:
    ```json
    {
      "content": "string (1-1000 characters)",
      "explanation": "string (max 2000 characters)",
      "position": "number (must be positive)"
    }
    ```
  - _Success Codes_: 201 Created
  - _Error Codes_: 400 Bad Request, 401 Unauthorized, 403 Forbidden

- **PUT /api/quizzes/{quizId}/questions/{questionId}**
  - _Description_: Update a specific question.
  - _Request Payload_: Same as POST payload
  - _Success Codes_: 200 OK
  - _Error Codes_: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

- **DELETE /api/quizzes/{quizId}/questions/{questionId}**
  - _Description_: Delete a question (soft delete by updating status).
  - _Success Codes_: 200 OK or 204 No Content
  - _Error Codes_: 401 Unauthorized, 403 Forbidden, 404 Not Found

### 2.4. Options

- **GET /api/questions/{questionId}/options**
  - _Description_: Retrieve options for a specific question.
  - _Response_:
    ```json
    [
      {
        "id": "uuid",
        "question_id": "uuid",
        "content": "string (1-500 characters)",
        "is_correct": "boolean",
        "position": "number",
        "created_at": "ISO8601 timestamp"
      }
    ]
    ```
  - _Success Codes_: 200 OK
  - _Error Codes_: 400 Bad Request, 401 Unauthorized, 404 Not Found

- **POST /api/questions/{questionId}/options**
  - _Description_: Add a new option to a question.
  - _Request Payload_:
    ```json
    {
      "content": "string (1-500 characters)",
      "is_correct": "boolean",
      "position": "number (must be positive)"
    }
    ```
  - _Success Codes_: 201 Created
  - _Error Codes_: 400 Bad Request, 401 Unauthorized, 403 Forbidden

- **PUT /api/questions/{questionId}/options/{optionId}**
  - _Description_: Update an option.
  - _Request Payload_: Same as POST payload
  - _Success Codes_: 200 OK
  - _Error Codes_: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

- **DELETE /api/questions/{questionId}/options/{optionId}**
  - _Description_: Delete an option.
  - _Success Codes_: 200 OK or 204 No Content
  - _Error Codes_: 401 Unauthorized, 403 Forbidden, 404 Not Found

### 2.5. Quiz Attempts

- **GET /api/quizzes/{quizId}/attempts**
  - _Description_: Retrieve all quiz attempts for a quiz for the authenticated user.
  - _Response_:
    ```json
    [
      {
        "id": "uuid",
        "user_id": "uuid",
        "quiz_id": "uuid",
        "status": "in_progress|completed|abandoned",
        "score": "number",
        "total_questions": "number",
        "started_at": "ISO8601 timestamp",
        "completed_at": "ISO8601 timestamp or null"
      }
    ]
    ```
  - _Success Codes_: 200 OK
  - _Error Codes_: 400 Bad Request, 401 Unauthorized

- **POST /api/quizzes/{quizId}/attempts**
  - _Description_: Start a new quiz attempt.
  - _Request Payload_: (Usually minimal, may include initial metadata if needed.)
  - _Success Codes_: 201 Created
  - _Error Codes_: 400 Bad Request, 401 Unauthorized

- **PUT /api/quizzes/{quizId}/attempts/{attemptId}**
  - _Description_: Update a quiz attempt with final score and completion status. This could involve submitting responses.
  - _Request Payload_:
    ```json
    {
      "status": "completed|abandoned",
      "score": "number",
      "completed_at": "ISO8601 timestamp"
    }
    ```
  - _Success Codes_: 200 OK
  - _Error Codes_: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

### 2.6. Quiz Responses

- **POST /api/attempts/{attemptId}/responses**
  - _Description_: Submit responses for a quiz attempt. Each response links a question and selected options.
  - _Request Payload_:
    ```json
    {
      "responses": [
        {
          "question_id": "uuid",
          "selected_options": ["uuid", "uuid"]
        }
      ]
    }
    ```
  - _Success Codes_: 201 Created
  - _Error Codes_: 400 Bad Request, 401 Unauthorized, 403 Forbidden

### 2.7. AI Quiz Generation

- **POST /api/quizzes/ai/generate**
  - _Description_: Generate a new quiz using AI based on provided context or topic.
  - _Request Payload_:
    ```json
    {
      "prompt": "string",
      "ai_model": "string (optional, default model if not provided)",
      "ai_temperature": "number (0.0 to 2.0, optional)"
    }
    ```
  - _Response_: JSON object representing the newly generated quiz (with questions and options may be empty initially until edited).
  - _Success Codes_: 201 Created
  - _Error Codes_: 400 Bad Request, 401 Unauthorized

## 3. Authentication and Authorization

- **Mechanism**: Token-based authentication (e.g., JWT) integrated with Supabase authentication. The API will verify that the token corresponds to an authenticated user.
- **Authorization**: Endpoints will enforce that users can only access or modify data they own. This is supported by the Row-Level Security policies in the database (e.g., a user can only update their own profile and quizzes).
- **Additional Measures**: Incorporate rate limiting to mitigate abuse and ensure that endpoints dealing with AI quiz generation are protected against excessive use.

## 4. Validation and Business Logic

### 4.1. Validation Conditions (as per database schema)

- **Profiles**:
  - `username`: Must be unique and between 3 and 50 characters.
  - `display_name`: Maximum length of 100 characters.

- **Quizzes**:
  - `title`: Minimum of 1 character and maximum of 200 characters.
  - `description`: Maximum of 1000 characters.
  - `ai_temperature`: Must be between 0.0 and 2.0 if provided.

- **Questions**:
  - `content`: Must be between 1 and 1000 characters.
  - `explanation`: Maximum of 2000 characters.
  - `position`: Must be a positive integer and unique within a quiz.

- **Options**:
  - `content`: Must be between 1 and 500 characters.
  - `position`: Must be a positive integer and unique within a question.

### 4.2. Business Logic

- **Quiz Management**: CRUD endpoints for quizzes allow users to create, read, update, and delete quiz sets.
  - Business logic includes verifying ownership before updating or deleting.

- **Quiz Taking**: When a user starts a quiz, a quiz attempt is created. Responses are tied to the attempt and scored upon completion. The update endpoint for attempts finalizes the score and marks completion.

- **AI Quiz Generation**: The API receives a prompt and optionally AI parameters. It forwards the information to an AI service (e.g., via Openrouter.ai) to generate quiz questions. The generated quiz is returned and can be edited by the user before publication.
  - Choices for endpoint design include having AI generation under `/api/quizzes/ai/generate` rather than overloading the quiz creation endpoint. This clear separation supports different processing and error handling paths.

- **Listing and Filtering**: List endpoints for quizzes support pagination, sorting (by creation date or title), and filtering by visibility. This enables efficient retrieval even when large datasets exist.

- **Error Handling**: Endpoints return clear error codes:
  - 400 for invalid data or failing validation conditions,
  - 401 for unauthorized access,
  - 403 for forbidden operations (e.g., trying to modify another user's data),
  - 404 for resources not found.

- **Security**: In addition to token verification, endpoints will enforce rate limiting and consider input sanitization to prevent SQL injection or similar attacks.

---

_Assumptions_:

- The API integrates with Supabase for authentication and uses its Row-Level Security to further secure database operations.
- AI quiz generation expects integration with an external AI service.
- Endpoints assume a JSON-based communication protocol.

This plan is designed to be compatible with the tech stack (Astro, TypeScript, React, and Supabase) and ensures robust validation, security, and performance measures.
