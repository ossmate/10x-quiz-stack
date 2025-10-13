/**
 * OpenRouter Service
 * A comprehensive service for interacting with the OpenRouter API
 * Supports chat completions with structured outputs and proper error handling
 */

import { OpenRouterError } from "./errors/openrouter.error.ts";
import type {
  OpenRouterServiceConfig,
  CompletionRequest,
  CompletionResult,
  OpenRouterRequestBody,
  OpenRouterResponse,
  Message,
} from "./types/openrouter.types.ts";

/**
 * Service for communicating with OpenRouter API
 * Provides methods for chat completions with full error handling and type safety
 */
export class OpenRouterService {
  private readonly config: OpenRouterServiceConfig;

  /**
   * Creates a new OpenRouterService instance
   * @param config - Service configuration (optional, uses defaults with env vars)
   */
  constructor(config?: Partial<OpenRouterServiceConfig>) {
    // Retrieve API key from environment if not provided
    const apiKey = config?.apiKey || import.meta.env.OPENROUTER_API_KEY;

    // Validate API key is present
    if (!apiKey) {
      throw new OpenRouterError(
        "OpenRouter API key is required. Please set OPENROUTER_API_KEY environment variable.",
        "CONFIG_ERROR"
      );
    }

    // Build complete configuration with defaults
    this.config = {
      apiKey,
      apiUrl: config?.apiUrl || "https://openrouter.ai/api/v1/chat/completions",
      defaultModel: config?.defaultModel || import.meta.env.AI_MODEL || "openai/gpt-4",
      defaultTemperature:
        config?.defaultTemperature !== undefined
          ? config.defaultTemperature
          : Number(import.meta.env.AI_TEMPERATURE) || 0.7,
      defaultMaxTokens:
        config?.defaultMaxTokens !== undefined
          ? config.defaultMaxTokens
          : Number(import.meta.env.AI_MAX_TOKENS) || 2000,
      timeout: config?.timeout ?? 60000, // 60 seconds default
      enableUsageLogging: config?.enableUsageLogging ?? import.meta.env.AI_ENABLE_USAGE_LOGGING !== "false",
      httpReferer: config?.httpReferer || import.meta.env.SITE || "https://10x-quiz-stack.app",
      appTitle: config?.appTitle || "10x Quiz Stack",
    };

    // Log successful initialization (first 10 chars of API key only)
    if (this.config.enableUsageLogging) {
      // eslint-disable-next-line no-console
      console.log("✅ OpenRouterService initialized with model:", this.config.defaultModel);
    }
  }

  /**
   * Gets the current service configuration (read-only)
   */
  get currentConfig(): Readonly<OpenRouterServiceConfig> {
    return { ...this.config };
  }

  /**
   * Main method for chat completions
   * Sends a request to OpenRouter API and returns the response
   *
   * @param request - Completion request with messages and parameters
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
    return this._parseResponse<TResponse>(apiResponse, request.responseFormat !== undefined);
  }

  /**
   * Creates a chat completion request with messages
   * Helper method for creating properly formatted requests
   *
   * @param messages - Array of conversation messages
   * @param options - Optional request parameters
   * @returns CompletionRequest object ready to be sent
   */
  createChatRequest(messages: Message[], options?: Partial<Omit<CompletionRequest, "messages">>): CompletionRequest {
    return {
      messages,
      model: options?.model,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      topP: options?.topP,
      frequencyPenalty: options?.frequencyPenalty,
      presencePenalty: options?.presencePenalty,
      responseFormat: options?.responseFormat,
      stream: false,
    };
  }

  /**
   * Validates if the provided API key is valid by making a test request
   * Useful for checking configuration before actual usage
   *
   * @returns Promise<boolean> - true if API key is valid
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const testRequest: CompletionRequest = {
        messages: [{ role: "user", content: "test" }],
        maxTokens: 5,
      };

      await this.complete(testRequest);
      return true;
    } catch (error) {
      if (OpenRouterError.isOpenRouterError(error)) {
        if (error.isErrorCode("API_ERROR")) {
          return false;
        }
      }
      throw error;
    }
  }

  /**
   * Validates the completion request
   * @private
   */
  private _validateRequest(request: CompletionRequest): void {
    // Validate messages array
    if (!request.messages || request.messages.length === 0) {
      throw new OpenRouterError("Messages array cannot be empty", "VALIDATION_ERROR");
    }

    // Validate each message
    for (const message of request.messages) {
      if (!message.role || !message.content) {
        throw new OpenRouterError("Each message must have role and content", "VALIDATION_ERROR");
      }

      if (!["system", "user", "assistant"].includes(message.role)) {
        throw new OpenRouterError(
          `Invalid message role: ${message.role}. Must be system, user, or assistant`,
          "VALIDATION_ERROR"
        );
      }
    }

    // Validate temperature range
    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 2)) {
      throw new OpenRouterError("Temperature must be between 0 and 2", "VALIDATION_ERROR");
    }

    // Validate maxTokens
    if (request.maxTokens !== undefined && request.maxTokens < 1) {
      throw new OpenRouterError("maxTokens must be greater than 0", "VALIDATION_ERROR");
    }

    // Validate topP
    if (request.topP !== undefined && (request.topP < 0 || request.topP > 1)) {
      throw new OpenRouterError("topP must be between 0 and 1", "VALIDATION_ERROR");
    }

    // Validate penalties
    if (request.frequencyPenalty !== undefined && (request.frequencyPenalty < -2 || request.frequencyPenalty > 2)) {
      throw new OpenRouterError("frequencyPenalty must be between -2 and 2", "VALIDATION_ERROR");
    }

    if (request.presencePenalty !== undefined && (request.presencePenalty < -2 || request.presencePenalty > 2)) {
      throw new OpenRouterError("presencePenalty must be between -2 and 2", "VALIDATION_ERROR");
    }
  }

  /**
   * Builds the request body for OpenRouter API
   * @private
   */
  private _buildRequestBody(request: CompletionRequest): OpenRouterRequestBody {
    const body: OpenRouterRequestBody = {
      model: request.model || this.config.defaultModel,
      messages: request.messages,
      temperature: request.temperature ?? this.config.defaultTemperature,
      max_tokens: request.maxTokens ?? this.config.defaultMaxTokens,
      stream: false,
    };

    // Add optional parameters only if provided
    if (request.topP !== undefined) {
      body.top_p = request.topP;
    }

    if (request.frequencyPenalty !== undefined) {
      body.frequency_penalty = request.frequencyPenalty;
    }

    if (request.presencePenalty !== undefined) {
      body.presence_penalty = request.presencePenalty;
    }

    if (request.responseFormat) {
      body.response_format = request.responseFormat;
    }

    return body;
  }

  /**
   * Executes the HTTP request to OpenRouter API
   * Handles network errors, timeouts, and HTTP errors
   * @private
   */
  private async _executeRequest(requestBody: OpenRouterRequestBody): Promise<OpenRouterResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    let response: Response;
    try {
      response = await fetch(this.config.apiUrl, {
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
    } catch (error) {
      clearTimeout(timeoutId);

      // Check if error is due to abort (timeout)
      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterError(`Request timed out after ${this.config.timeout}ms`, "TIMEOUT_ERROR", {
          timeout: this.config.timeout,
        });
      }

      // Network error
      throw new OpenRouterError(
        `Failed to connect to OpenRouter API: ${error instanceof Error ? error.message : "Unknown error"}`,
        "NETWORK_ERROR",
        { originalError: error }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // Handle HTTP errors
    if (!response.ok) {
      await this._handleHttpError(response);
    }

    // Parse JSON response
    try {
      const data = await response.json();
      return data as OpenRouterResponse;
    } catch (error) {
      throw new OpenRouterError(
        `Failed to parse OpenRouter response: ${error instanceof Error ? error.message : "Unknown error"}`,
        "PARSE_ERROR",
        { originalError: error }
      );
    }
  }

  /**
   * Handles HTTP errors from the API
   * @private
   */
  private async _handleHttpError(response: Response): Promise<never> {
    let errorMessage: string;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.message || response.statusText;
    } catch {
      errorMessage = response.statusText;
    }

    // Handle specific HTTP status codes
    if (response.status === 429) {
      throw new OpenRouterError(`Rate limit exceeded: ${errorMessage}`, "RATE_LIMIT_ERROR", {
        status: response.status,
        message: errorMessage,
      });
    }

    if (response.status === 401 || response.status === 403) {
      throw new OpenRouterError(`Authentication failed: ${errorMessage}. Please check your API key.`, "API_ERROR", {
        status: response.status,
        message: errorMessage,
      });
    }

    if (response.status >= 500) {
      throw new OpenRouterError(`OpenRouter server error (${response.status}): ${errorMessage}`, "API_ERROR", {
        status: response.status,
        message: errorMessage,
      });
    }

    // Generic API error
    throw new OpenRouterError(`OpenRouter API error (${response.status}): ${errorMessage}`, "API_ERROR", {
      status: response.status,
      message: errorMessage,
    });
  }

  /**
   * Parses the API response and extracts completion result
   * @private
   */
  private _parseResponse<TResponse>(
    apiResponse: OpenRouterResponse,
    isStructuredOutput: boolean
  ): CompletionResult<TResponse> {
    // Validate response structure
    if (!apiResponse.choices || apiResponse.choices.length === 0) {
      throw new OpenRouterError("OpenRouter response missing choices array", "INVALID_RESPONSE", {
        response: apiResponse,
      });
    }

    const choice = apiResponse.choices[0];
    if (!choice.message || typeof choice.message.content !== "string") {
      throw new OpenRouterError("OpenRouter response missing message content", "INVALID_RESPONSE", {
        choice,
      });
    }

    const content = choice.message.content;

    // Parse content if structured output is expected
    let parsedContent: TResponse;
    if (isStructuredOutput) {
      try {
        parsedContent = JSON.parse(content) as TResponse;
      } catch (error) {
        throw new OpenRouterError(
          `Failed to parse JSON response: ${error instanceof Error ? error.message : "Unknown error"}`,
          "PARSE_ERROR",
          { content, originalError: error }
        );
      }
    } else {
      parsedContent = content as TResponse;
    }

    // Build result object
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

/**
 * Default singleton instance of OpenRouterService
 * Uses environment variables for configuration
 */
export const openRouterService = new OpenRouterService();
