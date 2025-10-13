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
    schema: Record<string, unknown>;
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
