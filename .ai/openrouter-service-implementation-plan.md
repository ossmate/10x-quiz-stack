# OpenRouter Service - Implementation Plan

## 1. Service Description

`OpenRouterService` is a universal TypeScript service for communicating with the OpenRouter.ai API to execute queries to LLM (Large Language Models). The service provides:

- **Flexibility**: Supports any models available in OpenRouter (OpenAI, Anthropic, Google, etc.)
- **Security**: API key validation, error handling, and timeouts
- **Structured responses**: Support for JSON Schema via `response_format`
- **Configurability**: Full control over model parameters (temperature, max_tokens, etc.)
- **Monitoring**: Optional token usage logging for billing purposes
- **Type-safety**: Full TypeScript typing for all operations

### Main Use Cases

1. Quiz content generation (existing)
2. Other educational content generation
3. Content analysis and validation
4. User conversations (chatbots)
5. Data transformation using AI

---

## 2. Constructor Description

### Signature

```typescript
constructor(config?: Partial<OpenRouterServiceConfig>)
```

### Parameters

- `config` (optional): Configuration object allowing override of default values

### Configuration Structure

```typescript
interface OpenRouterServiceConfig {
  apiKey: string;                    // OpenRouter API key
  apiUrl: string;                    // API endpoint URL (default: https://openrouter.ai/api/v1/chat/completions)
  defaultModel: string;              // Default model (e.g., "gpt-4", "claude-3-opus")
  defaultTemperature: number;        // Default temperature (0.0-2.0)
  defaultMaxTokens: number;          // Default maximum number of tokens
  timeout: number;                   // Request timeout in ms (default: 60000)
  enableUsageLogging: boolean;       // Whether to log token usage
  httpReferer: string;               // HTTP Referer for API (required by OpenRouter)
  appTitle: string;                  // Application name (required by OpenRouter)
}
```

### Initialization

The constructor:
1. Loads configuration from parameters or uses default values
2. Retrieves API key from `import.meta.env.OPENROUTER_API_KEY` if not provided in config
3. Validates API key presence (throws error if missing)
4. Logs initialization information (only in development mode)
5. Sets default values for all parameters

### Initialization Example

```typescript
// Basic initialization (uses environment variables)
const service = new OpenRouterService();

// Initialization with custom configuration
const service = new OpenRouterService({
  apiKey: process.env.CUSTOM_API_KEY,
  defaultModel: "anthropic/claude-3-opus",
  defaultTemperature: 0.5,
  timeout: 120000,
});
```

---

## 3. Public Methods and Fields

### 3.1 `complete()` - Main Query Execution Method

Executes a query to an LLM model with full parameter control.

#### Signature

```typescript
async complete<TResponse = string>(
  request: CompletionRequest
): Promise<CompletionResult<TResponse>>
```

#### Parameters

```typescript
interface CompletionRequest {
  // Messages (required)
  messages: Message[];

  // Model configuration (optional - uses default values from constructor)
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;

  // Response format - for structured JSON responses
  responseFormat?: ResponseFormat;

  // Streaming (not supported in first version)
  stream?: false;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;           // Schema name (e.g., "quiz_response")
    strict: boolean;        // Enforce schema compliance
    schema: object;         // JSON Schema object
  };
}
```

#### Return Value

```typescript
interface CompletionResult<TResponse = string> {
  content: TResponse;              // Response content (string or parsed JSON)
  tokensUsed: number;              // Number of tokens used
  model: string;                   // Model used for generation
  finishReason: string;            // Completion finish reason ("stop", "length", etc.)
  metadata: {
    id: string;                    // Request ID from OpenRouter
    created: number;               // Creation timestamp
    promptTokens?: number;         // Tokens in prompt
    completionTokens?: number;     // Tokens in completion
  };
}
```

#### Usage Example

```typescript
// Simple text query
const result = await service.complete({
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "What is TypeScript?" }
  ],
  model: "gpt-4",
  temperature: 0.7
});

console.log(result.content); // Model response as string
console.log(result.tokensUsed); // Number of tokens used

// Query with structured JSON response
const quizResult = await service.complete<QuizContent>({
  messages: [
    { role: "system", content: QUIZ_GENERATION_SYSTEM_MESSAGE },
    { role: "user", content: constructQuizPrompt("JavaScript basics") }
  ],
  model: "gpt-4",
  temperature: 0.7,
  responseFormat: {
    type: "json_schema",
    json_schema: {
      name: "quiz_response",
      strict: true,
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                content: { type: "string" },
                explanation: { type: "string" },
                options: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      content: { type: "string" },
                      is_correct: { type: "boolean" }
                    },
                    required: ["content", "is_correct"],
                    additionalProperties: false
                  }
                }
              },
              required: ["content", "options"],
              additionalProperties: false
            }
          }
        },
        required: ["title", "description", "questions"],
        additionalProperties: false
      }
    }
  }
});

// TypeScript knows that quizResult.content is QuizContent
console.log(quizResult.content.title);
```

---

### 3.2 `createChatRequest()` - Helper Method for Chats

Simplifies request creation for simple conversations.

#### Signature

```typescript
createChatRequest(
  systemMessage: string,
  userMessage: string,
  options?: Partial<CompletionRequest>
): CompletionRequest
```

#### Parameters

- `systemMessage`: System message (context for AI)
- `userMessage`: User message
- `options`: Additional options (model, temperature, responseFormat, etc.)

#### Usage Example

```typescript
const request = service.createChatRequest(
  "You are an expert educator.",
  "Generate a quiz about TypeScript",
  {
    model: "gpt-4",
    temperature: 0.7,
    responseFormat: quizResponseFormat
  }
);

const result = await service.complete(request);
```

---

### 3.3 `validateApiKey()` - API Key Validation

Checks if the API key is valid by executing a test request.

#### Signature

```typescript
async validateApiKey(): Promise<boolean>
```

#### Return Value

- `true` - key is valid
- `false` - key is invalid

#### Usage Example

```typescript
const isValid = await service.validateApiKey();
if (!isValid) {
  throw new Error("Invalid OpenRouter API key");
}
```

---

### 3.4 `getAvailableModels()` - Available Models List

Retrieves the list of models available in OpenRouter (optional - for future implementation).

#### Signature

```typescript
async getAvailableModels(): Promise<ModelInfo[]>
```

---

### 3.5 Public Read-Only Fields

```typescript
readonly config: Readonly<OpenRouterServiceConfig>
```

Allows inspection of current service configuration.

---

## 4. Private Methods and Fields

### 4.1 `_executeRequest()` - HTTP Request Execution

Private method that executes the actual HTTP request to the OpenRouter API.

#### Responsibilities

1. Building request body according to OpenRouter API
2. Setting headers (Authorization, Content-Type, HTTP-Referer, X-Title)
3. Executing fetch with timeout
4. Handling HTTP errors
5. Parsing JSON response

#### Pseudo-code

```typescript
private async _executeRequest(
  requestBody: OpenRouterRequestBody
): Promise<OpenRouterResponse> {
  // 1. Validate API key
  if (!this.config.apiKey) {
    throw new OpenRouterError("API key not configured", "CONFIG_ERROR");
  }

  // 2. Setup fetch with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

  try {
    // 3. Execute request
    const response = await fetch(this.config.apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": this.config.httpReferer,
        "X-Title": this.config.appTitle,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    // 4. Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new OpenRouterError(
        `API request failed: ${response.status}`,
        "API_ERROR",
        { status: response.status, data: errorData }
      );
    }

    // 5. Parse response
    return await response.json() as OpenRouterResponse;

  } catch (error) {
    // Handle timeout
    if (error.name === "AbortError") {
      throw new OpenRouterError(
        `Request timeout after ${this.config.timeout}ms`,
        "TIMEOUT_ERROR"
      );
    }
    // Handle other errors
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

---

### 4.2 `_parseResponse()` - Response Parsing

Private method that parses the OpenRouter response to a normalized format.

#### Responsibilities

1. Extracting content from response
2. Parsing JSON when using response_format
3. Extracting metadata (tokens, model, finish_reason)
4. Validating response completeness

#### Pseudo-code

```typescript
private _parseResponse<TResponse>(
  apiResponse: OpenRouterResponse,
  hasJsonSchema: boolean
): CompletionResult<TResponse> {
  // 1. Validate response structure
  const content = apiResponse.choices?.[0]?.message?.content;
  if (!content) {
    throw new OpenRouterError(
      "Response missing content",
      "INVALID_RESPONSE"
    );
  }

  // 2. Parse JSON if response_format was used
  let parsedContent: TResponse;
  if (hasJsonSchema) {
    try {
      parsedContent = JSON.parse(content) as TResponse;
    } catch (error) {
      throw new OpenRouterError(
        "Failed to parse JSON response",
        "PARSE_ERROR",
        { content, error }
      );
    }
  } else {
    parsedContent = content as TResponse;
  }

  // 3. Return normalized result
  return {
    content: parsedContent,
    tokensUsed: apiResponse.usage?.total_tokens || 0,
    model: apiResponse.model,
    finishReason: apiResponse.choices[0].finish_reason,
    metadata: {
      id: apiResponse.id,
      created: apiResponse.created,
      promptTokens: apiResponse.usage?.prompt_tokens,
      completionTokens: apiResponse.usage?.completion_tokens,
    },
  };
}
```

---

### 4.3 `_buildRequestBody()` - Request Body Building

Private method that builds the request body object compatible with OpenRouter API.

#### Responsibilities

1. Mapping parameters from CompletionRequest to OpenRouter format
2. Applying default values
3. Formatting response_format according to OpenRouter requirements

#### Pseudo-code

```typescript
private _buildRequestBody(request: CompletionRequest): OpenRouterRequestBody {
  const body: OpenRouterRequestBody = {
    model: request.model || this.config.defaultModel,
    messages: request.messages,
    temperature: request.temperature ?? this.config.defaultTemperature,
    max_tokens: request.maxTokens ?? this.config.defaultMaxTokens,
  };

  // Add optional parameters
  if (request.topP !== undefined) {
    body.top_p = request.topP;
  }
  if (request.frequencyPenalty !== undefined) {
    body.frequency_penalty = request.frequencyPenalty;
  }
  if (request.presencePenalty !== undefined) {
    body.presence_penalty = request.presencePenalty;
  }

  // Add response_format
  if (request.responseFormat) {
    body.response_format = request.responseFormat;
  }

  return body;
}
```

---

### 4.4 Private Fields

```typescript
private readonly _apiKey: string;
private readonly _config: OpenRouterServiceConfig;
```

---

## 5. Error Handling

### 5.1 Custom Error Class

Create a dedicated error class for better handling and debugging.

```typescript
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code: OpenRouterErrorCode,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";

    // Preserve stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OpenRouterError);
    }
  }

  /**
   * Check if error is of type OpenRouterError
   */
  static isOpenRouterError(error: unknown): error is OpenRouterError {
    return error instanceof OpenRouterError;
  }

  /**
   * Check if error is of specific type
   */
  isErrorCode(code: OpenRouterErrorCode): boolean {
    return this.code === code;
  }
}

export type OpenRouterErrorCode =
  | "CONFIG_ERROR"          // Configuration error (missing API key, invalid configuration)
  | "NETWORK_ERROR"         // Network error (no connection)
  | "TIMEOUT_ERROR"         // Timeout exceeded
  | "API_ERROR"             // API error (4xx, 5xx)
  | "RATE_LIMIT_ERROR"      // Rate limit exceeded
  | "INVALID_RESPONSE"      // Invalid response structure
  | "PARSE_ERROR"           // JSON parsing error
  | "VALIDATION_ERROR";     // Data validation error
```

---

### 5.2 Error Scenarios and Handling

#### 1. Missing API Key

**Scenario**: API key is not configured in environment variables or constructor.

**Handling**:
```typescript
if (!this.config.apiKey) {
  throw new OpenRouterError(
    "OPENROUTER_API_KEY is not configured. Please set it in environment variables or pass it to the constructor.",
    "CONFIG_ERROR"
  );
}
```

**When**: During initialization or first query execution.

---

#### 2. Network Error (No Connection)

**Scenario**: No internet connection or OpenRouter API unavailability.

**Handling**:
```typescript
try {
  response = await fetch(this.apiUrl, { ... });
} catch (error) {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    throw new OpenRouterError(
      `Failed to connect to OpenRouter API: ${error.message}`,
      "NETWORK_ERROR",
      { originalError: error }
    );
  }
  throw error;
}
```

---

#### 3. Timeout

**Scenario**: Request takes longer than configured timeout.

**Handling**:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(
  () => controller.abort(),
  this.config.timeout
);

try {
  response = await fetch(this.apiUrl, {
    signal: controller.signal,
    ...
  });
} catch (error) {
  if (error.name === "AbortError") {
    throw new OpenRouterError(
      `Request timeout after ${this.config.timeout}ms`,
      "TIMEOUT_ERROR"
    );
  }
  throw error;
} finally {
  clearTimeout(timeoutId);
}
```

---

#### 4. Rate Limiting (429)

**Scenario**: API request limit exceeded.

**Handling**:
```typescript
if (response.status === 429) {
  const retryAfter = response.headers.get("Retry-After");
  throw new OpenRouterError(
    `Rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter} seconds.` : ""}`,
    "RATE_LIMIT_ERROR",
    { status: 429, retryAfter }
  );
}
```

---

#### 5. Invalid API Key (401)

**Scenario**: API key is invalid or expired.

**Handling**:
```typescript
if (response.status === 401) {
  throw new OpenRouterError(
    "Invalid API key. Please check your OPENROUTER_API_KEY.",
    "API_ERROR",
    { status: 401 }
  );
}
```

---

#### 6. API Error (4xx, 5xx)

**Scenario**: Other API errors (bad request, server error, etc.).

**Handling**:
```typescript
if (!response.ok) {
  let errorData: any;
  try {
    errorData = await response.json();
  } catch {
    errorData = await response.text();
  }

  throw new OpenRouterError(
    `OpenRouter API error (${response.status}): ${errorData?.error?.message || errorData || "Unknown error"}`,
    "API_ERROR",
    { status: response.status, data: errorData }
  );
}
```

---

#### 7. Invalid Response

**Scenario**: Response doesn't contain expected fields (choices, content, etc.).

**Handling**:
```typescript
const content = apiResponse.choices?.[0]?.message?.content;
if (!content) {
  throw new OpenRouterError(
    "OpenRouter response missing content. This may indicate an API change or unexpected response format.",
    "INVALID_RESPONSE",
    { response: apiResponse }
  );
}
```

---

#### 8. JSON Parsing Error

**Scenario**: Model returned invalid JSON despite using response_format.

**Handling**:
```typescript
if (request.responseFormat?.type === "json_schema") {
  try {
    parsedContent = JSON.parse(content);
  } catch (error) {
    throw new OpenRouterError(
      "Failed to parse JSON response from model. The model may have returned invalid JSON despite schema constraints.",
      "PARSE_ERROR",
      {
        content: content.substring(0, 500), // First 500 chars for debugging
        error: error instanceof Error ? error.message : String(error)
      }
    );
  }
}
```

---

#### 9. Schema Validation Error

**Scenario**: JSON is valid but doesn't meet schema requirements.

**Handling**:
```typescript
// This should be handled in higher layer (e.g., Zod validation)
// OpenRouterService returns raw response, business validation is consumer's responsibility

// Example in AIQuizGeneratorService:
try {
  const validatedQuiz = parseAndValidateAIResponse(result.content);
  return { content: validatedQuiz, tokensUsed: result.tokensUsed };
} catch (error) {
  throw new Error(
    `AI generated invalid quiz format: ${error instanceof Error ? error.message : "Unknown validation error"}`
  );
}
```

---

### 5.3 Error Handling Usage Example

```typescript
try {
  const result = await openRouterService.complete(request);
  // Success
} catch (error) {
  if (OpenRouterError.isOpenRouterError(error)) {
    // Handle OpenRouter errors
    switch (error.code) {
      case "CONFIG_ERROR":
        console.error("Configuration error:", error.message);
        // Inform user about configuration issue
        break;

      case "RATE_LIMIT_ERROR":
        console.error("Rate limit exceeded:", error.message);
        // Wait and retry or inform user
        break;

      case "TIMEOUT_ERROR":
        console.error("Request timeout:", error.message);
        // Retry or reduce maxTokens
        break;

      case "API_ERROR":
        console.error("API error:", error.message);
        // Check error details in error.details
        break;

      default:
        console.error("OpenRouter error:", error);
    }
  } else {
    // Other errors
    console.error("Unexpected error:", error);
  }
}
```

---

## 6. Security Considerations

### 6.1 API Key Protection

**Problem**: API key is sensitive information and should not be exposed.

**Solutions**:

1. **Storage in environment variables**
   ```typescript
   // In .env (DO NOT commit to repo!)
   OPENROUTER_API_KEY=sk-or-v1-xxx

   // In code
   apiKey: import.meta.env.OPENROUTER_API_KEY
   ```

2. **Key length validation**
   ```typescript
   if (this.apiKey && this.apiKey.length < 20) {
     console.warn("⚠️ API key seems too short. Please verify it's correct.");
   }
   ```

3. **Safe logging**
   ```typescript
   // GOOD: Show only prefix
   console.log("✅ OpenRouter API key loaded:", this.apiKey.substring(0, 10) + "...");

   // BAD: Never log full key
   console.log("API Key:", this.apiKey); // ❌ DANGEROUS!
   ```

4. **Server-side only**
   - OpenRouterService should be used ONLY on the server side (API endpoints, middleware)
   - NEVER send API key to client (frontend)
   - NEVER execute requests to OpenRouter directly from browser

---

### 6.2 Input Data Validation

**Problem**: User may provide invalid or malicious data.

**Solutions**:

1. **Message length validation**
   ```typescript
   private _validateMessages(messages: Message[]): void {
     if (!messages || messages.length === 0) {
       throw new OpenRouterError(
         "Messages array cannot be empty",
         "VALIDATION_ERROR"
       );
     }

     for (const message of messages) {
       if (message.content.length > 100000) {
         throw new OpenRouterError(
           `Message content too long: ${message.content.length} characters (max: 100000)`,
           "VALIDATION_ERROR"
         );
       }
     }
   }
   ```

2. **Model parameter validation**
   ```typescript
   private _validateModelParams(request: CompletionRequest): void {
     if (request.temperature !== undefined) {
       if (request.temperature < 0 || request.temperature > 2) {
         throw new OpenRouterError(
           `Invalid temperature: ${request.temperature}. Must be between 0 and 2.`,
           "VALIDATION_ERROR"
         );
       }
     }

     if (request.maxTokens !== undefined) {
       if (request.maxTokens < 1 || request.maxTokens > 100000) {
         throw new OpenRouterError(
           `Invalid maxTokens: ${request.maxTokens}. Must be between 1 and 100000.`,
           "VALIDATION_ERROR"
         );
       }
     }
   }
   ```

---

### 6.3 Application-Side Rate Limiting

**Problem**: Excessive API usage can lead to high costs or key blocking.

**Solutions**:

1. **Per-user limits** (in higher layer - API endpoint)
   ```typescript
   // In src/pages/api/quiz/generate.ts
   const userRequestCount = await getUserRequestCount(userId, "1h");
   if (userRequestCount > 10) {
     return new Response(
       JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
       { status: 429 }
     );
   }
   ```

2. **Timeout for long operations**
   ```typescript
   // Already implemented in OpenRouterService
   timeout: 60000 // 60 seconds
   ```

3. **Cost monitoring**
   ```typescript
   // Log token usage to database
   await this.logAIUsage(supabase, userId, model, tokensUsed);
   ```

---

### 6.4 Output Data Sanitization

**Problem**: Model may return unwanted content (spam, inappropriate content).

**Solutions**:

1. **Response structure validation** (Zod)
   ```typescript
   const validatedQuiz = parseAndValidateAIResponse(result.content);
   // parseAndValidateAIResponse uses Zod for validation
   ```

2. **Content moderation** (optional)
   ```typescript
   private async _checkContentSafety(content: string): Promise<boolean> {
     // Integration with OpenRouter moderation endpoint
     // or external content moderation API
   }
   ```

---

### 6.5 Protection Against Injection Attacks

**Problem**: User may attempt to manipulate prompts (prompt injection).

**Solutions**:

1. **Clear separation of system message and user message**
   ```typescript
   messages: [
     { role: "system", content: SYSTEM_MESSAGE }, // Controlled by us
     { role: "user", content: userInput }         // User data
   ]
   ```

2. **Don't interpolate user input into system message**
   ```typescript
   // BAD ❌
   const systemMessage = `You are an assistant. The user wants: ${userInput}`;

   // GOOD ✅
   const systemMessage = "You are an assistant.";
   const userMessage = userInput;
   ```

3. **Use response_format to enforce structure**
   ```typescript
   // Model MUST return JSON conforming to schema
   // Even if user tries "Ignore previous instructions"
   responseFormat: {
     type: "json_schema",
     json_schema: { name: "quiz", strict: true, schema: quizSchema }
   }
   ```

---

## 7. Step-by-Step Implementation Plan

### Step 1: Create File Structure

Create the following files in the project:

```
src/lib/
├── services/
│   ├── openrouter.service.ts          # Main service implementation
│   └── ai-quiz-generator.service.ts   # Existing file (to refactor)
├── types/
│   └── openrouter.types.ts            # Type definitions for OpenRouter
└── errors/
    └── openrouter.error.ts            # Custom error class
```

**Action**:
```bash
# Create new folders if they don't exist
mkdir -p src/lib/types
mkdir -p src/lib/errors

# Create new files
touch src/lib/types/openrouter.types.ts
touch src/lib/errors/openrouter.error.ts
touch src/lib/services/openrouter.service.ts
```

---

### Step 2: Implement Custom Error Class

**File**: `src/lib/errors/openrouter.error.ts`

```typescript
/**
 * Custom error class for OpenRouter service errors
 * Provides structured error handling with error codes and additional context
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code: OpenRouterErrorCode,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";

    // Preserve stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OpenRouterError);
    }
  }

  /**
   * Type guard to check if an error is an OpenRouterError
   */
  static isOpenRouterError(error: unknown): error is OpenRouterError {
    return error instanceof OpenRouterError;
  }

  /**
   * Check if error matches a specific error code
   */
  isErrorCode(code: OpenRouterErrorCode): boolean {
    return this.code === code;
  }

  /**
   * Convert error to a user-friendly message
   */
  toUserMessage(): string {
    switch (this.code) {
      case "CONFIG_ERROR":
        return "Service configuration error. Please contact support.";
      case "NETWORK_ERROR":
        return "Unable to connect to AI service. Please check your internet connection.";
      case "TIMEOUT_ERROR":
        return "Request took too long. Please try again.";
      case "RATE_LIMIT_ERROR":
        return "Too many requests. Please wait a moment and try again.";
      case "API_ERROR":
        return "AI service error. Please try again later.";
      case "INVALID_RESPONSE":
      case "PARSE_ERROR":
        return "Received invalid response from AI service. Please try again.";
      case "VALIDATION_ERROR":
        return "Invalid request parameters. Please check your input.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }
}

/**
 * Error codes for different types of OpenRouter errors
 */
export type OpenRouterErrorCode =
  | "CONFIG_ERROR"       // Configuration error (missing API key, invalid config)
  | "NETWORK_ERROR"      // Network error (connection failed)
  | "TIMEOUT_ERROR"      // Request timeout
  | "API_ERROR"          // API error (4xx, 5xx)
  | "RATE_LIMIT_ERROR"   // Rate limit exceeded (429)
  | "INVALID_RESPONSE"   // Invalid response structure
  | "PARSE_ERROR"        // JSON parsing error
  | "VALIDATION_ERROR";  // Request validation error
```

---

### Step 3: Define TypeScript Types

**File**: `src/lib/types/openrouter.types.ts`

```typescript
/**
 * OpenRouter Service Types
 * Type definitions for the OpenRouter API integration
 */

/**
 * Configuration for OpenRouterService
 */
export interface OpenRouterServiceConfig {
  /** OpenRouter API key */
  apiKey: string;

  /** API endpoint URL */
  apiUrl: string;

  /** Default model to use (e.g., "gpt-4", "claude-3-opus") */
  defaultModel: string;

  /** Default temperature (0.0 - 2.0) */
  defaultTemperature: number;

  /** Default max tokens to generate */
  defaultMaxTokens: number;

  /** Request timeout in milliseconds */
  timeout: number;

  /** Whether to enable usage logging */
  enableUsageLogging: boolean;

  /** HTTP Referer header (required by OpenRouter) */
  httpReferer: string;

  /** Application title (required by OpenRouter) */
  appTitle: string;
}

/**
 * Message in a chat conversation
 */
export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Response format configuration for structured outputs
 */
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    /** Schema name (e.g., "quiz_response") */
    name: string;
    /** Whether to strictly enforce the schema */
    strict: boolean;
    /** JSON Schema object */
    schema: Record<string, any>;
  };
}

/**
 * Request for chat completion
 */
export interface CompletionRequest {
  /** Array of messages in the conversation */
  messages: Message[];

  /** Model to use (optional, defaults to config.defaultModel) */
  model?: string;

  /** Temperature for randomness (0.0 - 2.0) */
  temperature?: number;

  /** Maximum tokens to generate */
  maxTokens?: number;

  /** Top-p sampling (0.0 - 1.0) */
  topP?: number;

  /** Frequency penalty (-2.0 - 2.0) */
  frequencyPenalty?: number;

  /** Presence penalty (-2.0 - 2.0) */
  presencePenalty?: number;

  /** Response format for structured outputs */
  responseFormat?: ResponseFormat;

  /** Streaming (not supported in first version) */
  stream?: false;
}

/**
 * Result from chat completion
 */
export interface CompletionResult<TResponse = string> {
  /** Content of the response (parsed if JSON) */
  content: TResponse;

  /** Total tokens used */
  tokensUsed: number;

  /** Model used for generation */
  model: string;

  /** Reason for completion finish */
  finishReason: string;

  /** Additional metadata */
  metadata: {
    /** Request ID from OpenRouter */
    id: string;
    /** Timestamp of creation */
    created: number;
    /** Tokens used in prompt */
    promptTokens?: number;
    /** Tokens used in completion */
    completionTokens?: number;
  };
}

/**
 * OpenRouter API request body
 * @internal
 */
export interface OpenRouterRequestBody {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: ResponseFormat;
  stream?: boolean;
}

/**
 * OpenRouter API response
 * @internal
 */
export interface OpenRouterResponse {
  id: string;
  model: string;
  created: number;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

---

### Step 4: Implement OpenRouterService

**File**: `src/lib/services/openrouter.service.ts`

```typescript
import { OpenRouterError } from "../errors/openrouter.error.ts";
import type {
  OpenRouterServiceConfig,
  CompletionRequest,
  CompletionResult,
  OpenRouterRequestBody,
  OpenRouterResponse,
  Message,
} from "../types/openrouter.types.ts";

/**
 * Default configuration for OpenRouter service
 */
const DEFAULT_CONFIG: OpenRouterServiceConfig = {
  apiKey: import.meta.env.OPENROUTER_API_KEY || "",
  apiUrl: "https://openrouter.ai/api/v1/chat/completions",
  defaultModel: import.meta.env.AI_MODEL || "openai/gpt-4",
  defaultTemperature: Number(import.meta.env.AI_TEMPERATURE) || 0.7,
  defaultMaxTokens: Number(import.meta.env.AI_MAX_TOKENS) || 2000,
  timeout: 60000, // 60 seconds
  enableUsageLogging: import.meta.env.AI_ENABLE_USAGE_LOGGING !== "false",
  httpReferer: import.meta.env.SITE || "https://10x-quiz-stack.app",
  appTitle: "10x Quiz Stack",
};

/**
 * Service for communicating with OpenRouter API
 * Provides a clean interface for chat completions with LLM models
 */
export class OpenRouterService {
  private readonly config: OpenRouterServiceConfig;

  constructor(config?: Partial<OpenRouterServiceConfig>) {
    // Merge provided config with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // Validate API key is present
    if (!this.config.apiKey) {
      throw new OpenRouterError(
        "OPENROUTER_API_KEY is not configured. Please set it in environment variables or pass it to the constructor.",
        "CONFIG_ERROR"
      );
    }

    // Log initialization (only first 10 chars of API key)
    if (import.meta.env.DEV) {
      console.log("✅ OpenRouterService initialized with key:", this.config.apiKey.substring(0, 10) + "...");
    }
  }

  /**
   * Execute a chat completion request
   *
   * @param request - Completion request parameters
   * @returns Promise with completion result
   * @throws OpenRouterError if request fails
   */
  async complete<TResponse = string>(request: CompletionRequest): Promise<CompletionResult<TResponse>> {
    // Validate request
    this._validateRequest(request);

    // Build request body
    const requestBody = this._buildRequestBody(request);

    // Execute API request
    const apiResponse = await this._executeRequest(requestBody);

    // Parse and return response
    const hasJsonSchema = request.responseFormat?.type === "json_schema";
    return this._parseResponse<TResponse>(apiResponse, hasJsonSchema);
  }

  /**
   * Helper method to create a simple chat request
   *
   * @param systemMessage - System message (context for AI)
   * @param userMessage - User message
   * @param options - Additional options
   * @returns Completion request object
   */
  createChatRequest(
    systemMessage: string,
    userMessage: string,
    options?: Partial<CompletionRequest>
  ): CompletionRequest {
    return {
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      ...options,
    };
  }

  /**
   * Validate API key by making a test request
   *
   * @returns Promise<boolean> - true if key is valid
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.complete({
        messages: [{ role: "user", content: "test" }],
        maxTokens: 1,
      });
      return true;
    } catch (error) {
      if (OpenRouterError.isOpenRouterError(error) && error.code === "API_ERROR") {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get current configuration (readonly)
   */
  get currentConfig(): Readonly<OpenRouterServiceConfig> {
    return Object.freeze({ ...this.config });
  }

  // ========== Private Methods ==========

  /**
   * Validate completion request
   * @private
   */
  private _validateRequest(request: CompletionRequest): void {
    // Validate messages
    if (!request.messages || request.messages.length === 0) {
      throw new OpenRouterError("Messages array cannot be empty", "VALIDATION_ERROR");
    }

    // Validate message content length
    for (const message of request.messages) {
      if (!message.content || typeof message.content !== "string") {
        throw new OpenRouterError("Message content must be a non-empty string", "VALIDATION_ERROR");
      }

      if (message.content.length > 100000) {
        throw new OpenRouterError(
          `Message content too long: ${message.content.length} characters (max: 100000)`,
          "VALIDATION_ERROR"
        );
      }
    }

    // Validate temperature
    if (request.temperature !== undefined) {
      if (request.temperature < 0 || request.temperature > 2) {
        throw new OpenRouterError(
          `Invalid temperature: ${request.temperature}. Must be between 0 and 2.`,
          "VALIDATION_ERROR"
        );
      }
    }

    // Validate maxTokens
    if (request.maxTokens !== undefined) {
      if (request.maxTokens < 1 || request.maxTokens > 100000) {
        throw new OpenRouterError(
          `Invalid maxTokens: ${request.maxTokens}. Must be between 1 and 100000.`,
          "VALIDATION_ERROR"
        );
      }
    }
  }

  /**
   * Build OpenRouter request body from CompletionRequest
   * @private
   */
  private _buildRequestBody(request: CompletionRequest): OpenRouterRequestBody {
    const body: OpenRouterRequestBody = {
      model: request.model || this.config.defaultModel,
      messages: request.messages,
      temperature: request.temperature ?? this.config.defaultTemperature,
      max_tokens: request.maxTokens ?? this.config.defaultMaxTokens,
    };

    // Add optional parameters
    if (request.topP !== undefined) {
      body.top_p = request.topP;
    }

    if (request.frequencyPenalty !== undefined) {
      body.frequency_penalty = request.frequencyPenalty;
    }

    if (request.presencePenalty !== undefined) {
      body.presence_penalty = request.presencePenalty;
    }

    // Add response format if specified
    if (request.responseFormat) {
      body.response_format = request.responseFormat;
    }

    return body;
  }

  /**
   * Execute HTTP request to OpenRouter API
   * @private
   */
  private async _executeRequest(requestBody: OpenRouterRequestBody): Promise<OpenRouterResponse> {
    // Setup timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      // Execute fetch
      const response = await fetch(this.config.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": this.config.httpReferer,
          "X-Title": this.config.appTitle,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      // Handle HTTP errors
      if (!response.ok) {
        await this._handleHttpError(response);
      }

      // Parse and return response
      return (await response.json()) as OpenRouterResponse;
    } catch (error) {
      // Handle timeout
      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterError(`Request timeout after ${this.config.timeout}ms`, "TIMEOUT_ERROR");
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new OpenRouterError(
          `Failed to connect to OpenRouter API: ${error.message}`,
          "NETWORK_ERROR",
          { originalError: error }
        );
      }

      // Re-throw OpenRouterErrors
      if (OpenRouterError.isOpenRouterError(error)) {
        throw error;
      }

      // Handle unexpected errors
      throw new OpenRouterError(
        `Unexpected error during API request: ${error instanceof Error ? error.message : String(error)}`,
        "NETWORK_ERROR",
        { originalError: error }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Handle HTTP error responses
   * @private
   */
  private async _handleHttpError(response: Response): Promise<never> {
    let errorData: any;
    const contentType = response.headers.get("content-type");

    try {
      if (contentType?.includes("application/json")) {
        errorData = await response.json();
      } else {
        errorData = await response.text();
      }
    } catch {
      errorData = "Failed to read error response";
    }

    // Handle specific status codes
    if (response.status === 401) {
      throw new OpenRouterError(
        "Invalid API key. Please check your OPENROUTER_API_KEY.",
        "API_ERROR",
        { status: 401, data: errorData }
      );
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      throw new OpenRouterError(
        `Rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter} seconds.` : "Please try again later."}`,
        "RATE_LIMIT_ERROR",
        { status: 429, retryAfter, data: errorData }
      );
    }

    // Generic API error
    const errorMessage = errorData?.error?.message || errorData?.message || errorData || "Unknown error";
    throw new OpenRouterError(
      `OpenRouter API error (${response.status}): ${errorMessage}`,
      "API_ERROR",
      { status: response.status, data: errorData }
    );
  }

  /**
   * Parse OpenRouter response into CompletionResult
   * @private
   */
  private _parseResponse<TResponse>(
    apiResponse: OpenRouterResponse,
    hasJsonSchema: boolean
  ): CompletionResult<TResponse> {
    // Validate response structure
    const choice = apiResponse.choices?.[0];
    const content = choice?.message?.content;

    if (!content) {
      throw new OpenRouterError(
        "OpenRouter response missing content. This may indicate an API change or unexpected response format.",
        "INVALID_RESPONSE",
        { response: apiResponse }
      );
    }

    // Parse JSON if using json_schema
    let parsedContent: TResponse;
    if (hasJsonSchema) {
      try {
        parsedContent = JSON.parse(content) as TResponse;
      } catch (error) {
        throw new OpenRouterError(
          "Failed to parse JSON response from model. The model may have returned invalid JSON despite schema constraints.",
          "PARSE_ERROR",
          {
            content: content.substring(0, 500), // First 500 chars for debugging
            error: error instanceof Error ? error.message : String(error),
          }
        );
      }
    } else {
      parsedContent = content as TResponse;
    }

    // Return normalized result
    return {
      content: parsedContent,
      tokensUsed: apiResponse.usage?.total_tokens || 0,
      model: apiResponse.model,
      finishReason: choice.finish_reason,
      metadata: {
        id: apiResponse.id,
        created: apiResponse.created,
        promptTokens: apiResponse.usage?.prompt_tokens,
        completionTokens: apiResponse.usage?.completion_tokens,
      },
    };
  }
}

// Export singleton instance
export const openRouterService = new OpenRouterService();
```

---

### Step 5: Refactor AIQuizGeneratorService

Update `src/lib/services/ai-quiz-generator.service.ts` to use `OpenRouterService`.

**Key changes**:
1. Import `OpenRouterService` instead of direct fetch calls
2. Use `openRouterService.complete()` instead of own implementation
3. Pass `responseFormat` for structured JSON response
4. Simplify error handling (OpenRouterService handles it)

**Example implementation**:

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";

import { openRouterService } from "./openrouter.service.ts";
import { OpenRouterError } from "../errors/openrouter.error.ts";
import { aiConfig } from "../config/ai.config.ts";
import {
  constructQuizGenerationPrompt,
  QUIZ_GENERATION_SYSTEM_MESSAGE,
} from "../prompts/quiz-generation.prompt.ts";
import { parseAndValidateAIResponse, quizResponseSchema } from "../validation/ai-response.schema.ts";

import type { Database } from "../../db/database.types.ts";
import type { GenerateAIQuizCommand } from "../../types.ts";

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Interface for AI-generated quiz content
 */
export interface AIGeneratedQuizContent {
  title: string;
  description: string;
  questions: {
    content: string;
    explanation?: string;
    options: {
      content: string;
      is_correct: boolean;
    }[];
  }[];
}

/**
 * Result from AI quiz generation including usage metadata
 */
export interface AIQuizGenerationResult {
  content: AIGeneratedQuizContent;
  tokensUsed: number;
}

/**
 * Service for generating quiz content using AI via OpenRouter
 */
export class AIQuizGeneratorService {
  /**
   * Creates a GenerateAIQuizCommand from a prompt using application configuration
   */
  createCommand(prompt: string): GenerateAIQuizCommand {
    return {
      prompt,
      ai_model: aiConfig.defaultModel,
      ai_temperature: aiConfig.temperature,
    };
  }

  /**
   * Generates quiz content based on the provided command
   * Uses OpenRouterService for API communication
   */
  async generateQuizContent(command: GenerateAIQuizCommand): Promise<AIQuizGenerationResult> {
    const { ai_model: model, ai_temperature: temperature, prompt } = command;

    try {
      // Step 1: Construct the prompt
      const userPrompt = constructQuizGenerationPrompt(prompt);

      // Step 2: Create request with response_format for structured JSON
      const request = openRouterService.createChatRequest(
        QUIZ_GENERATION_SYSTEM_MESSAGE,
        userPrompt,
        {
          model,
          temperature,
          maxTokens: aiConfig.maxTokens,
          responseFormat: {
            type: "json_schema",
            json_schema: {
              name: "quiz_response",
              strict: true,
              schema: quizResponseSchema, // JSON Schema from zod or manually defined
            },
          },
        }
      );

      // Step 3: Execute request via OpenRouterService
      const result = await openRouterService.complete<AIGeneratedQuizContent>(request);

      // Step 4: Validate response structure (additional Zod validation)
      const validatedQuiz = parseAndValidateAIResponse(result.content);

      // Step 5: Return result
      return {
        content: validatedQuiz,
        tokensUsed: result.tokensUsed,
      };
    } catch (error) {
      // Convert OpenRouterError to user-friendly error
      if (OpenRouterError.isOpenRouterError(error)) {
        throw new Error(`Failed to generate quiz: ${error.toUserMessage()}`);
      }

      // Handle other errors
      throw new Error(
        `Failed to generate quiz: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Logs AI usage for tracking and billing purposes
   */
  async logAIUsage(
    supabase: SupabaseClientType,
    userId: string,
    model: string,
    tokensUsed: number
  ): Promise<void> {
    if (!aiConfig.enableUsageLogging) {
      return;
    }

    try {
      const { error } = await supabase.from("ai_usage_logs").insert({
        user_id: userId,
        model_used: model,
        tokens_used: tokensUsed,
        requested_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Failed to log AI usage:", error);
      }
    } catch (error) {
      // Non-critical error - log but don't throw
      console.error("Exception while logging AI usage:", error);
    }
  }
}

// Export singleton instance
export const aiQuizGeneratorService = new AIQuizGeneratorService();
```

---

### Step 6: Define JSON Schema for response_format

Create or update file with JSON Schema definition.

**File**: `src/lib/validation/ai-response.schema.ts`

Add export of JSON Schema compatible with OpenRouter format:

```typescript
import { z } from "zod";

// Existing Zod schema
export const aiQuizResponseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  questions: z
    .array(
      z.object({
        content: z.string().min(1).max(1000),
        explanation: z.string().max(1000).optional(),
        options: z
          .array(
            z.object({
              content: z.string().min(1).max(500),
              is_correct: z.boolean(),
            })
          )
          .length(4)
          .refine((options) => options.filter((o) => o.is_correct).length === 1, {
            message: "Exactly one option must be marked as correct",
          }),
      })
    )
    .min(5)
    .max(10),
});

// JSON Schema for OpenRouter response_format
// This must be a plain JSON Schema object (not Zod)
export const quizResponseSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
      minLength: 1,
      maxLength: 200,
    },
    description: {
      type: "string",
      minLength: 1,
      maxLength: 500,
    },
    questions: {
      type: "array",
      minItems: 5,
      maxItems: 10,
      items: {
        type: "object",
        properties: {
          content: {
            type: "string",
            minLength: 1,
            maxLength: 1000,
          },
          explanation: {
            type: "string",
            maxLength: 1000,
          },
          options: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: {
              type: "object",
              properties: {
                content: {
                  type: "string",
                  minLength: 1,
                  maxLength: 500,
                },
                is_correct: {
                  type: "boolean",
                },
              },
              required: ["content", "is_correct"],
              additionalProperties: false,
            },
          },
        },
        required: ["content", "options"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "description", "questions"],
  additionalProperties: false,
};

export type AIQuizResponse = z.infer<typeof aiQuizResponseSchema>;

export function parseAndValidateAIResponse(data: unknown): AIQuizResponse {
  return aiQuizResponseSchema.parse(data);
}
```

---

### Step 7: Testing

#### Test 1: Basic Text Completion

```typescript
// test-openrouter.ts
import { openRouterService } from "./src/lib/services/openrouter.service.ts";

async function testBasicCompletion() {
  try {
    const result = await openRouterService.complete({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "What is TypeScript?" },
      ],
      model: "openai/gpt-3.5-turbo",
      maxTokens: 100,
    });

    console.log("✅ Test passed!");
    console.log("Response:", result.content);
    console.log("Tokens used:", result.tokensUsed);
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testBasicCompletion();
```

#### Test 2: Structured JSON Response

```typescript
import { aiQuizGeneratorService } from "./src/lib/services/ai-quiz-generator.service.ts";

async function testQuizGeneration() {
  try {
    const command = aiQuizGeneratorService.createCommand("Create a quiz about TypeScript basics");

    const result = await aiQuizGeneratorService.generateQuizContent(command);

    console.log("✅ Quiz generation test passed!");
    console.log("Title:", result.content.title);
    console.log("Questions:", result.content.questions.length);
    console.log("Tokens used:", result.tokensUsed);
  } catch (error) {
    console.error("❌ Quiz generation test failed:", error);
  }
}

testQuizGeneration();
```

#### Test 3: Error Handling

```typescript
import { openRouterService } from "./src/lib/services/openrouter.service.ts";
import { OpenRouterError } from "./src/lib/errors/openrouter.error.ts";

async function testErrorHandling() {
  try {
    // Test with invalid temperature
    await openRouterService.complete({
      messages: [{ role: "user", content: "test" }],
      temperature: 5.0, // Invalid!
    });

    console.error("❌ Test failed: Should have thrown error");
  } catch (error) {
    if (OpenRouterError.isOpenRouterError(error)) {
      console.log("✅ Error handling test passed!");
      console.log("Error code:", error.code);
      console.log("User message:", error.toUserMessage());
    } else {
      console.error("❌ Wrong error type:", error);
    }
  }
}

testErrorHandling();
```

---

### Step 8: Integration with Existing API Endpoint

Update quiz generation endpoint to use refactored service.

**File**: `src/pages/api/quiz/generate.ts`

```typescript
import type { APIRoute } from "astro";
import { aiQuizGeneratorService } from "../../../lib/services/ai-quiz-generator.service.ts";
import { createServiceRoleClient } from "../../../db/client.ts";
import { OpenRouterError } from "../../../lib/errors/openrouter.error.ts";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create command
    const command = aiQuizGeneratorService.createCommand(prompt);

    // Generate quiz
    const result = await aiQuizGeneratorService.generateQuizContent(command);

    // Log usage (optional - if user is authenticated)
    // const supabase = createServiceRoleClient();
    // await aiQuizGeneratorService.logAIUsage(supabase, userId, command.ai_model, result.tokensUsed);

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        quiz: result.content,
        tokensUsed: result.tokensUsed,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Quiz generation error:", error);

    // Handle OpenRouterError
    if (OpenRouterError.isOpenRouterError(error)) {
      return new Response(
        JSON.stringify({
          error: error.toUserMessage(),
          code: error.code,
        }),
        {
          status: error.code === "RATE_LIMIT_ERROR" ? 429 : 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle other errors
    return new Response(
      JSON.stringify({
        error: "Failed to generate quiz. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

---

### Step 9: Usage Documentation

Create documentation file for developers.

**File**: `.ai/openrouter-service-usage.md`

```markdown
# OpenRouter Service - Usage Guide

## Basic Usage

### 1. Simple Text Completion

typescript
import { openRouterService } from "@/lib/services/openrouter.service";

const result = await openRouterService.complete({
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Explain TypeScript in one sentence." }
  ],
  model: "openai/gpt-4",
  temperature: 0.7
});

console.log(result.content); // String response


### 2. Structured JSON Response

typescript
import { openRouterService } from "@/lib/services/openrouter.service";

interface QuizResponse {
  title: string;
  questions: Array<{ content: string; answer: string }>;
}

const result = await openRouterService.complete<QuizResponse>({
  messages: [
    { role: "system", content: "You are a quiz generator." },
    { role: "user", content: "Generate a quiz about JavaScript." }
  ],
  responseFormat: {
    type: "json_schema",
    json_schema: {
      name: "quiz_response",
      strict: true,
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                content: { type: "string" },
                answer: { type: "string" }
              },
              required: ["content", "answer"]
            }
          }
        },
        required: ["title", "questions"]
      }
    }
  }
});

// TypeScript knows result.content is QuizResponse
console.log(result.content.title);


### 3. Error Handling

typescript
import { openRouterService } from "@/lib/services/openrouter.service";
import { OpenRouterError } from "@/lib/errors/openrouter.error";

try {
  const result = await openRouterService.complete(request);
  // Handle success
} catch (error) {
  if (OpenRouterError.isOpenRouterError(error)) {
    // Handle OpenRouter-specific errors
    switch (error.code) {
      case "RATE_LIMIT_ERROR":
        // Show rate limit message to user
        break;
      case "TIMEOUT_ERROR":
        // Retry or show timeout message
        break;
      default:
        // Show generic error
        console.log(error.toUserMessage());
    }
  } else {
    // Handle unexpected errors
    console.error("Unexpected error:", error);
  }
}


## Configuration

### Environment Variables

env
# Required
OPENROUTER_API_KEY=sk-or-v1-xxx

# Optional (with defaults)
AI_MODEL=openai/gpt-4
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2000
AI_ENABLE_USAGE_LOGGING=true
SITE=https://your-app.com


### Custom Configuration

typescript
import { OpenRouterService } from "@/lib/services/openrouter.service";

const customService = new OpenRouterService({
  apiKey: process.env.CUSTOM_API_KEY,
  defaultModel: "anthropic/claude-3-opus",
  timeout: 120000, // 2 minutes
  defaultTemperature: 0.5
});


## Available Models

Common models you can use:

- openai/gpt-4
- openai/gpt-3.5-turbo
- anthropic/claude-3-opus
- anthropic/claude-3-sonnet
- google/gemini-pro

Full list: https://openrouter.ai/docs#models

## Best Practices

1. **Always handle errors** - Use try/catch and check for OpenRouterError
2. **Use response_format for structured data** - Ensures consistent JSON output
3. **Set appropriate timeouts** - Long generations may need higher timeout values
4. **Monitor token usage** - Track costs via result.tokensUsed
5. **Use system messages** - Set clear context for better results
6. **Validate responses** - Use Zod or similar for additional validation
```

---

### Step 10: Finalization Checklist

- [ ] All files created and implemented
- [ ] OpenRouterService tested with basic queries
- [ ] AIQuizGeneratorService refactored and uses OpenRouterService
- [ ] Error handling works correctly (tests with invalid parameters)
- [ ] response_format JSON Schema properly configured
- [ ] API endpoint updated and tested
- [ ] Environment variables configured (.env)
- [ ] Usage documentation created
- [ ] Code review (if working in a team)
- [ ] Commit and push changes to repository

---

## Summary

This implementation plan provides:

1. **Modularity** - OpenRouterService is independent of business logic
2. **Reusability** - You can use the service in different parts of the application
3. **Type-safety** - Full TypeScript typing for all operations
4. **Security** - Data validation, error handling, API key protection
5. **Structured responses** - Support for JSON Schema via response_format
6. **Easy testing** - Clear interfaces and separation of concerns
7. **Documentation** - Complete guide for developers

Implementation of this plan will provide a solid foundation for communication with OpenRouter API in your 10x Quiz Stack project.
