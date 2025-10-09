import { z } from "zod";

/**
 * Validation schema for AI quiz generation request
 * Only accepts the prompt - AI parameters are configured at the application level
 */
export const aiQuizGenerationSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(1000, "Prompt must be less than 1000 characters"),
});

export type AIQuizGenerationInput = z.infer<typeof aiQuizGenerationSchema>;
