import { z } from "zod";

/**
 * Validation schema for UUID format
 * Used for validating path parameters like quiz ID, question ID, etc.
 */
export const uuidSchema = z.string().uuid("Invalid UUID format");

export type UuidInput = z.infer<typeof uuidSchema>;
