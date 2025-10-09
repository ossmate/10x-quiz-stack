/**
 * AI Configuration
 * Central configuration for AI-related features in the application
 */

export interface AIConfig {
  /**
   * Default AI model to use for quiz generation
   * Examples: "gpt-4", "gpt-3.5-turbo", "claude-3-opus"
   */
  defaultModel: string;

  /**
   * Temperature parameter for AI generation (0.0 - 2.0)
   * Lower values (0.0-0.5): More focused and deterministic
   * Medium values (0.5-1.0): Balanced creativity and consistency
   * Higher values (1.0-2.0): More creative and varied
   */
  temperature: number;

  /**
   * Maximum number of tokens to generate
   */
  maxTokens: number;

  /**
   * Whether to log AI usage to the database
   */
  enableUsageLogging: boolean;
}

/**
 * Default AI configuration for the application
 * These values can be overridden by environment variables
 */
export const aiConfig: AIConfig = {
  defaultModel: import.meta.env.AI_MODEL || "gpt-4",
  temperature: Number(import.meta.env.AI_TEMPERATURE) || 0.7,
  maxTokens: Number(import.meta.env.AI_MAX_TOKENS) || 2000,
  enableUsageLogging: import.meta.env.AI_ENABLE_USAGE_LOGGING !== "false",
};
