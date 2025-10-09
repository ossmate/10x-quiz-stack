import { z } from "zod";

import { parseJSONRobustly } from "../utils/json-extractor.ts";

/**
 * Schema for validating AI-generated quiz option
 */
const aiQuizOptionSchema = z.object({
  content: z.string().min(1, "Option content is required"),
  is_correct: z.boolean(),
});

/**
 * Schema for validating AI-generated quiz question
 */
const aiQuizQuestionSchema = z.object({
  content: z.string().min(1, "Question content is required"),
  explanation: z.string().optional(),
  options: z
    .array(aiQuizOptionSchema)
    .length(4, "Each question must have exactly 4 options")
    .refine(
      (options) => options.filter((opt) => opt.is_correct).length === 1,
      "Each question must have exactly one correct answer"
    ),
});

/**
 * Schema for validating AI-generated quiz content
 * Ensures the AI response matches our expected structure
 */
export const aiQuizResponseSchema = z.object({
  title: z.string().min(1, "Quiz title is required").max(200, "Quiz title must be less than 200 characters"),
  description: z
    .string()
    .min(1, "Quiz description is required")
    .max(500, "Description must be less than 500 characters"),
  questions: z
    .array(aiQuizQuestionSchema)
    .min(5, "Quiz must have at least 5 questions")
    .max(10, "Quiz must have at most 10 questions"),
});

export type AIQuizResponse = z.infer<typeof aiQuizResponseSchema>;

/**
 * Validates and parses AI response
 *
 * @param jsonString - JSON string from AI response
 * @returns Validated quiz content
 * @throws Error if JSON is invalid or doesn't match schema
 */
export function parseAndValidateAIResponse(jsonString: string): AIQuizResponse {
  let parsed;

  try {
    parsed = parseJSONRobustly(jsonString);
  } catch (error) {
    // Log the problematic content for debugging (first 500 chars)
    console.error("Failed to parse AI response. First 500 chars:", jsonString.substring(0, 500));
    throw new Error(`Invalid JSON from AI: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  const result = aiQuizResponseSchema.safeParse(parsed);

  if (!result.success) {
    const errors = result.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ");
    console.error("AI response validation failed. Parsed object:", JSON.stringify(parsed, null, 2).substring(0, 1000));
    throw new Error(`AI response validation failed: ${errors}`);
  }

  return result.data;
}
