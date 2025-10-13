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
  | "CONFIG_ERROR" // Configuration error (missing API key, invalid config)
  | "NETWORK_ERROR" // Network error (connection failed)
  | "TIMEOUT_ERROR" // Request timeout
  | "API_ERROR" // API error (4xx, 5xx)
  | "RATE_LIMIT_ERROR" // Rate limit exceeded (429)
  | "INVALID_RESPONSE" // Invalid response structure
  | "PARSE_ERROR" // JSON parsing error
  | "VALIDATION_ERROR"; // Request validation error
