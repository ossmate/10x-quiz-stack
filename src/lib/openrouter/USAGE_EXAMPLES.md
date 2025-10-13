# OpenRouter Service - Usage Examples

The OpenRouter service provides a clean, type-safe interface for interacting with the OpenRouter API.

## Basic Usage

### Simple Text Completion

```typescript
import { openRouterService } from "@/lib/openrouter";

// Simple completion with default settings
const result = await openRouterService.complete({
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "What is the capital of France?" }
  ]
});

console.log(result.content); // "Paris is the capital of France..."
console.log(result.tokensUsed); // 45
console.log(result.model); // "openai/gpt-4"
```

### Custom Parameters

```typescript
import { openRouterService } from "@/lib/openrouter";

const result = await openRouterService.complete({
  messages: [
    { role: "user", content: "Write a creative story about a robot." }
  ],
  model: "anthropic/claude-3-opus",
  temperature: 1.2, // Higher = more creative
  maxTokens: 500,
  topP: 0.9,
  frequencyPenalty: 0.5,
  presencePenalty: 0.5
});
```

## Structured Outputs (JSON Mode)

### Quiz Generation Example

```typescript
import { openRouterService } from "@/lib/openrouter";
import type { AIGeneratedQuizContent } from "@/lib/services/ai-quiz-generator.service";

// Define JSON schema for structured output
const quizSchema = {
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
              required: ["content", "is_correct"]
            }
          }
        },
        required: ["content", "options"]
      }
    }
  },
  required: ["title", "description", "questions"]
};

// Request with structured output
const result = await openRouterService.complete<AIGeneratedQuizContent>({
  messages: [
    {
      role: "system",
      content: "You are a quiz generation assistant. Generate quizzes in JSON format."
    },
    {
      role: "user",
      content: "Create a quiz about JavaScript basics with 5 questions."
    }
  ],
  responseFormat: {
    type: "json_schema",
    json_schema: {
      name: "quiz_response",
      strict: true,
      schema: quizSchema
    }
  }
});

// result.content is now typed as AIGeneratedQuizContent
console.log(result.content.title); // "JavaScript Basics Quiz"
console.log(result.content.questions.length); // 5
```

## Helper Methods

### Using createChatRequest()

```typescript
import { openRouterService } from "@/lib/openrouter";

// Create a properly formatted request
const request = openRouterService.createChatRequest(
  [
    { role: "system", content: "You are a helpful coding assistant." },
    { role: "user", content: "How do I use async/await in TypeScript?" }
  ],
  {
    model: "openai/gpt-4",
    temperature: 0.7,
    maxTokens: 1000
  }
);

// Send the request
const result = await openRouterService.complete(request);
```

### Validating API Key

```typescript
import { openRouterService } from "@/lib/openrouter";

try {
  const isValid = await openRouterService.validateApiKey();
  if (isValid) {
    console.log("API key is valid!");
  }
} catch (error) {
  console.error("API key validation failed:", error);
}
```

## Error Handling

### Handling OpenRouter Errors

```typescript
import { openRouterService, OpenRouterError } from "@/lib/openrouter";

try {
  const result = await openRouterService.complete({
    messages: [{ role: "user", content: "Hello!" }]
  });
} catch (error) {
  if (OpenRouterError.isOpenRouterError(error)) {
    // Handle specific error types
    if (error.isErrorCode("RATE_LIMIT_ERROR")) {
      console.error("Rate limit exceeded. Please wait before retrying.");
    } else if (error.isErrorCode("API_ERROR")) {
      console.error("API error:", error.message);
    } else if (error.isErrorCode("TIMEOUT_ERROR")) {
      console.error("Request timed out. Please try again.");
    }

    // Get user-friendly message
    const userMessage = error.toUserMessage();
    console.log("User message:", userMessage);

    // Access error details
    console.log("Error code:", error.code);
    console.log("Error details:", error.details);
  } else {
    // Handle other errors
    console.error("Unexpected error:", error);
  }
}
```

### Error Types Reference

- `CONFIG_ERROR` - Missing or invalid configuration (e.g., API key)
- `NETWORK_ERROR` - Network connection failed
- `TIMEOUT_ERROR` - Request took too long (default: 60s)
- `RATE_LIMIT_ERROR` - API rate limit exceeded (HTTP 429)
- `API_ERROR` - API returned an error (4xx, 5xx)
- `INVALID_RESPONSE` - Response structure is invalid
- `PARSE_ERROR` - Failed to parse JSON response
- `VALIDATION_ERROR` - Request parameters are invalid

## Custom Configuration

### Creating a Custom Service Instance

```typescript
import { OpenRouterService } from "@/lib/openrouter";

const customService = new OpenRouterService({
  apiKey: "custom-api-key",
  defaultModel: "anthropic/claude-3-sonnet",
  defaultTemperature: 0.5,
  defaultMaxTokens: 1500,
  timeout: 120000, // 2 minutes
  enableUsageLogging: true,
  httpReferer: "https://myapp.com",
  appTitle: "My Custom App"
});

// Use the custom instance
const result = await customService.complete({
  messages: [{ role: "user", content: "Hello!" }]
});
```

### Accessing Current Configuration

```typescript
import { openRouterService } from "@/lib/openrouter";

const config = openRouterService.currentConfig;
console.log("Default model:", config.defaultModel);
console.log("Timeout:", config.timeout);
```

## Integration with Existing Code

### Migrating from AIQuizGeneratorService

```typescript
// OLD: Direct API calls in AIQuizGeneratorService
const response = await fetch(this.apiUrl, {
  method: "POST",
  headers: { /* ... */ },
  body: JSON.stringify(requestBody)
});
const apiResponse = await response.json();

// NEW: Using OpenRouterService
import { openRouterService } from "@/lib/openrouter";

const result = await openRouterService.complete<AIGeneratedQuizContent>({
  messages: [
    { role: "system", content: QUIZ_GENERATION_SYSTEM_MESSAGE },
    { role: "user", content: userPrompt }
  ],
  model: command.ai_model,
  temperature: command.ai_temperature,
  maxTokens: aiConfig.maxTokens,
  responseFormat: {
    type: "json_schema",
    json_schema: {
      name: "quiz_response",
      strict: true,
      schema: quizSchema
    }
  }
});

// result.content is already parsed and typed
const quizContent = result.content;
const tokensUsed = result.tokensUsed;
```

## Best Practices

### 1. Use the Singleton for Most Cases

```typescript
// GOOD: Use the default singleton
import { openRouterService } from "@/lib/openrouter";
const result = await openRouterService.complete({ /* ... */ });
```

### 2. Use Typed Completions for Structured Outputs

```typescript
// GOOD: Type the response for better type safety
interface MyResponse {
  summary: string;
  items: string[];
}

const result = await openRouterService.complete<MyResponse>({
  messages: [/* ... */],
  responseFormat: { /* JSON schema */ }
});

// result.content is typed as MyResponse
console.log(result.content.summary);
```

### 3. Always Handle Errors

```typescript
// GOOD: Comprehensive error handling
try {
  const result = await openRouterService.complete({ /* ... */ });
  return result.content;
} catch (error) {
  if (OpenRouterError.isOpenRouterError(error)) {
    // Handle OpenRouter-specific errors
    return { error: error.toUserMessage() };
  }
  throw error; // Re-throw unexpected errors
}
```

### 4. Use Early Validation

```typescript
// GOOD: Validate before making the request
if (!userInput || userInput.length < 10) {
  throw new Error("Input must be at least 10 characters");
}

const result = await openRouterService.complete({
  messages: [{ role: "user", content: userInput }]
});
```

## Environment Variables

Required:
- `OPENROUTER_API_KEY` - Your OpenRouter API key

Optional (with defaults):
- `AI_MODEL` - Default model (default: "openai/gpt-4")
- `AI_TEMPERATURE` - Default temperature (default: 0.7)
- `AI_MAX_TOKENS` - Default max tokens (default: 2000)
- `AI_ENABLE_USAGE_LOGGING` - Enable logging (default: true)
- `SITE` - HTTP Referer header (default: "https://10x-quiz-stack.app")

Example `.env`:
```bash
OPENROUTER_API_KEY=sk-or-v1-abc123...
AI_MODEL=anthropic/claude-3-opus
AI_TEMPERATURE=0.8
AI_MAX_TOKENS=1500
AI_ENABLE_USAGE_LOGGING=true
```
