import { z } from "zod";

/**
 * Validation schema for quiz creation
 * Accepts quiz details along with questions and options
 */

const optionSchema = z.object({
  content: z.string().min(1, "Option content is required"),
  is_correct: z.boolean(),
  position: z.number().int().positive(),
});

const questionSchema = z.object({
  content: z.string().min(1, "Question content is required"),
  explanation: z.string().optional(),
  position: z.number().int().positive(),
  options: z
    .array(optionSchema)
    .min(2, "Question must have at least 2 options")
    .max(10, "Question cannot have more than 10 options")
    .refine((options) => options.some((opt) => opt.is_correct), {
      message: "At least one option must be marked as correct",
    }),
});

export const quizCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  source: z.enum(["manual", "ai_generated"]).default("manual"),
  ai_model: z.string().nullable().optional(),
  ai_prompt: z.string().nullable().optional(),
  ai_temperature: z.number().min(0).max(2).nullable().optional(),
  questions: z
    .array(questionSchema)
    .min(1, "Quiz must have at least one question")
    .max(50, "Quiz cannot have more than 50 questions"),
});

export type QuizCreateInput = z.infer<typeof quizCreateSchema>;
