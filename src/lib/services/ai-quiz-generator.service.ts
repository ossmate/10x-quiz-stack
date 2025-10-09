import type { SupabaseClient } from "@supabase/supabase-js";

import { aiConfig } from "../config/ai.config.ts";
import { constructQuizGenerationPrompt, QUIZ_GENERATION_SYSTEM_MESSAGE } from "../prompts/quiz-generation.prompt.ts";
import { parseAndValidateAIResponse } from "../validation/ai-response.schema.ts";

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
 * OpenRouter API response structure
 */
interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      content: string;
    };
  }[];
  usage?: {
    total_tokens: number;
  };
}

/**
 * Service for generating quiz content using AI via OpenRouter
 */
export class AIQuizGeneratorService {
  private readonly apiUrl = "https://openrouter.ai/api/v1/chat/completions";
  private readonly apiKey = import.meta.env.OPENROUTER_API_KEY;

  constructor() {
    // Debug: Log if API key is loaded (first 10 chars only for security)
    if (this.apiKey) {
      console.log("✅ OpenRouter API key loaded:", this.apiKey.substring(0, 10) + "...");
    } else {
      console.error("❌ OpenRouter API key is NOT loaded!");
    }
  }
  /**
   * Creates a GenerateAIQuizCommand from a prompt using application configuration
   *
   * @param prompt - User's description of the quiz to generate
   * @returns Command object with prompt and AI configuration
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
   *
   * @param command - Command containing prompt and AI configuration
   * @returns Promise with generated quiz content and usage metadata
   * @throws Error if AI generation fails
   */
  async generateQuizContent(command: GenerateAIQuizCommand): Promise<AIQuizGenerationResult> {
    const { ai_model: model, ai_temperature: temperature, prompt } = command;

    // Validate API key is configured
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    // Step 1: Construct the prompt
    const userPrompt = constructQuizGenerationPrompt(prompt);

    // Step 2: Call OpenRouter API
    const requestBody = {
      model,
      temperature,
      max_tokens: aiConfig.maxTokens,
      messages: [
        {
          role: "system",
          content: QUIZ_GENERATION_SYSTEM_MESSAGE,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    };

    let response: Response;
    try {
      response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": import.meta.env.SITE || "https://10x-quiz-stack.app",
          "X-Title": "10x Quiz Stack",
        },
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      throw new Error(
        `Failed to connect to OpenRouter API: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Step 3: Handle API errors
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    // Step 4: Parse API response
    let apiResponse: OpenRouterResponse;
    try {
      apiResponse = (await response.json()) as OpenRouterResponse;
    } catch (error) {
      throw new Error(
        `Failed to parse OpenRouter response: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Step 5: Extract content from response
    const content = apiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenRouter response missing content");
    }

    // Debug: Log response length and first/last 200 chars
    console.log("AI Response length:", content.length);
    console.log("AI Response (first 200 chars):", content.substring(0, 200));
    console.log("AI Response (last 200 chars):", content.substring(Math.max(0, content.length - 200)));

    // Step 6: Parse and validate AI-generated quiz
    const validatedQuiz = parseAndValidateAIResponse(content);

    // Step 7: Extract token usage
    const tokensUsed = apiResponse.usage?.total_tokens || 0;

    return {
      content: validatedQuiz,
      tokensUsed,
    };
  }

  /**
   * Logs AI usage for tracking and billing purposes
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user who requested the generation
   * @param model - AI model used
   * @param tokensUsed - Number of tokens consumed
   * @throws Error if logging fails (non-critical, should not break main flow)
   */
  async logAIUsage(supabase: SupabaseClientType, userId: string, model: string, tokensUsed: number): Promise<void> {
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
