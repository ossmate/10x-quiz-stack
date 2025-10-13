/**
 * OpenRouter Module
 * Barrel export for easy imports
 */

// Main service
export { OpenRouterService, openRouterService } from "../openrouter.service.ts";

// Types
export type {
  OpenRouterServiceConfig,
  Message,
  ResponseFormat,
  CompletionRequest,
  CompletionResult,
  OpenRouterRequestBody,
  OpenRouterResponse,
} from "../types/openrouter.types.ts";

// Errors
export { OpenRouterError } from "../errors/openrouter.error.ts";
export type { OpenRouterErrorCode } from "../errors/openrouter.error.ts";
