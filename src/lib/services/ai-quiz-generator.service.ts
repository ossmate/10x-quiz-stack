import type { SupabaseClient } from "@supabase/supabase-js";

import { aiConfig } from "../config/ai.config.ts";
import { openRouterService } from "../openrouter.service.ts";
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
 * Service for generating quiz content using AI via OpenRouter
 */
export class AIQuizGeneratorService {
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

    // Step 1: Construct the prompt
    const userPrompt = constructQuizGenerationPrompt(prompt);

    // Step 2: Create completion request
    const completionRequest = openRouterService.createChatRequest(
      [
        {
          role: "system",
          content: QUIZ_GENERATION_SYSTEM_MESSAGE,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      {
        model,
        temperature,
        maxTokens: aiConfig.maxTokens,
      }
    );

    // Step 3: Call OpenRouter API via service
    const result = await openRouterService.complete<string>(completionRequest);

    // Debug: Log response length and first/last 200 chars
    const content = result.content;
    console.log("AI Response length:", content.length);
    console.log("AI Response (first 200 chars):", content.substring(0, 200));
    console.log("AI Response (last 200 chars):", content.substring(Math.max(0, content.length - 200)));

    // Step 4: Parse and validate AI-generated quiz
    const validatedQuiz = parseAndValidateAIResponse(content);

    return {
      content: validatedQuiz,
      tokensUsed: result.tokensUsed,
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
