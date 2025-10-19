import { z } from "zod";

/**
 * Validation schema for quiz list query parameters
 * Supports pagination, sorting, and filtering by status
 */
export const quizListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(["created_at", "title", "updated_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  status: z.enum(["draft", "public", "private", "archived"]).optional(),
});

export type QuizListQuery = z.infer<typeof quizListQuerySchema>;
