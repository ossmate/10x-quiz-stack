import { describe, expect, it } from "vitest";

import { aiQuizGenerationSchema } from "./ai-quiz-generation.schema.ts";

describe("aiQuizGenerationSchema", () => {
  describe("valid prompts", () => {
    it("should accept valid prompt with minimum length", () => {
      const validPrompt = { prompt: "a" };

      const result = aiQuizGenerationSchema.safeParse(validPrompt);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prompt).toBe("a");
      }
    });

    it("should accept prompt with exactly 1000 characters", () => {
      const validPrompt = { prompt: "a".repeat(1000) };

      const result = aiQuizGenerationSchema.safeParse(validPrompt);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prompt.length).toBe(1000);
      }
    });

    it("should accept prompt with typical length", () => {
      const validPrompt = {
        prompt: "Create a quiz about JavaScript fundamentals including variables, functions, and async programming",
      };

      const result = aiQuizGenerationSchema.safeParse(validPrompt);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prompt).toBe(validPrompt.prompt);
      }
    });

    it("should accept prompt with special characters", () => {
      const validPrompt = {
        prompt: "Create a quiz about C++ & Python: Which is better? (Hint: both!)",
      };

      const result = aiQuizGenerationSchema.safeParse(validPrompt);

      expect(result.success).toBe(true);
    });

    it("should accept prompt with numbers", () => {
      const validPrompt = {
        prompt: "Create a quiz about JavaScript ES6, ES2015, and the top 10 features from ES2020",
      };

      const result = aiQuizGenerationSchema.safeParse(validPrompt);

      expect(result.success).toBe(true);
    });

    it("should accept prompt with unicode characters", () => {
      const validPrompt = {
        prompt: "Create a quiz about programming in 日本語 and emojis 🚀",
      };

      const result = aiQuizGenerationSchema.safeParse(validPrompt);

      expect(result.success).toBe(true);
    });

    it("should accept prompt with newlines", () => {
      const validPrompt = {
        prompt: "Create a quiz about:\n1. Variables\n2. Functions\n3. Classes",
      };

      const result = aiQuizGenerationSchema.safeParse(validPrompt);

      expect(result.success).toBe(true);
    });

    it("should accept prompt with multiple spaces", () => {
      const validPrompt = {
        prompt: "Create  a  quiz  about  JavaScript",
      };

      const result = aiQuizGenerationSchema.safeParse(validPrompt);

      expect(result.success).toBe(true);
    });
  });

  describe("invalid prompts - length validation", () => {
    it("should reject empty string prompt", () => {
      const invalidPrompt = { prompt: "" };

      const result = aiQuizGenerationSchema.safeParse(invalidPrompt);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Prompt is required");
      }
    });

    it("should reject prompt exceeding 1000 characters", () => {
      const invalidPrompt = { prompt: "a".repeat(1001) };

      const result = aiQuizGenerationSchema.safeParse(invalidPrompt);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Prompt must be less than 1000 characters");
      }
    });

    it("should reject prompt much longer than max length", () => {
      const invalidPrompt = { prompt: "a".repeat(5000) };

      const result = aiQuizGenerationSchema.safeParse(invalidPrompt);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Prompt must be less than 1000 characters");
      }
    });
  });

  describe("invalid prompts - type validation", () => {
    it("should reject missing prompt field", () => {
      const invalidPrompt = {};

      const result = aiQuizGenerationSchema.safeParse(invalidPrompt);

      expect(result.success).toBe(false);
      if (!result.success) {
        // When field is completely missing, Zod returns "Required"
        expect(result.error.errors[0].message).toBe("Required");
      }
    });

    it("should reject number instead of string", () => {
      const invalidPrompt = { prompt: 123 };

      const result = aiQuizGenerationSchema.safeParse(invalidPrompt);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].code).toBe("invalid_type");
      }
    });

    it("should reject null prompt", () => {
      const invalidPrompt = { prompt: null };

      const result = aiQuizGenerationSchema.safeParse(invalidPrompt);

      expect(result.success).toBe(false);
    });

    it("should reject undefined prompt", () => {
      const invalidPrompt = { prompt: undefined };

      const result = aiQuizGenerationSchema.safeParse(invalidPrompt);

      expect(result.success).toBe(false);
    });

    it("should reject array instead of string", () => {
      const invalidPrompt = { prompt: ["Create a quiz about JavaScript"] };

      const result = aiQuizGenerationSchema.safeParse(invalidPrompt);

      expect(result.success).toBe(false);
    });

    it("should reject object instead of string", () => {
      const invalidPrompt = { prompt: { text: "Create a quiz" } };

      const result = aiQuizGenerationSchema.safeParse(invalidPrompt);

      expect(result.success).toBe(false);
    });

    it("should reject boolean instead of string", () => {
      const invalidPrompt = { prompt: true };

      const result = aiQuizGenerationSchema.safeParse(invalidPrompt);

      expect(result.success).toBe(false);
    });
  });

  describe("invalid prompts - additional fields", () => {
    it("should strip additional fields not in schema", () => {
      const inputWithExtra = {
        prompt: "Create a quiz about JavaScript",
        temperature: 0.7,
        model: "gpt-4",
      };

      const result = aiQuizGenerationSchema.safeParse(inputWithExtra);

      expect(result.success).toBe(true);
      if (result.success) {
        // Additional fields should be stripped
        expect(result.data).toEqual({ prompt: "Create a quiz about JavaScript" });
        expect("temperature" in result.data).toBe(false);
        expect("model" in result.data).toBe(false);
      }
    });

    it("should not accept AI configuration parameters", () => {
      const inputWithAiParams = {
        prompt: "Create a quiz",
        maxTokens: 1000,
        topP: 0.9,
      };

      const result = aiQuizGenerationSchema.safeParse(inputWithAiParams);

      expect(result.success).toBe(true);
      if (result.success) {
        // AI parameters should be stripped as they're not in schema
        expect(Object.keys(result.data)).toEqual(["prompt"]);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle prompt with only whitespace characters", () => {
      const invalidPrompt = { prompt: "   " };

      // Zod's min(1) checks string length, not trimmed length
      // So "   " has length 3 and is valid according to the schema
      const result = aiQuizGenerationSchema.safeParse(invalidPrompt);

      expect(result.success).toBe(true);
    });

    it("should handle prompt with tabs and newlines", () => {
      const validPrompt = { prompt: "\t\n\r" };

      // These are still characters, so the prompt has length > 0
      const result = aiQuizGenerationSchema.safeParse(validPrompt);

      expect(result.success).toBe(true);
    });

    it("should handle prompt at exact boundary (999 chars)", () => {
      const validPrompt = { prompt: "a".repeat(999) };

      const result = aiQuizGenerationSchema.safeParse(validPrompt);

      expect(result.success).toBe(true);
    });

    it("should reject prompt at boundary + 1 (1001 chars)", () => {
      const invalidPrompt = { prompt: "a".repeat(1001) };

      const result = aiQuizGenerationSchema.safeParse(invalidPrompt);

      expect(result.success).toBe(false);
    });
  });

  describe("error messages", () => {
    it("should provide clear error message for empty prompt", () => {
      const result = aiQuizGenerationSchema.safeParse({ prompt: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Prompt is required");
        expect(result.error.errors[0].path).toEqual(["prompt"]);
      }
    });

    it("should provide clear error message for too long prompt", () => {
      const result = aiQuizGenerationSchema.safeParse({ prompt: "a".repeat(1001) });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Prompt must be less than 1000 characters");
        expect(result.error.errors[0].path).toEqual(["prompt"]);
      }
    });

    it("should provide clear error message for missing prompt", () => {
      const result = aiQuizGenerationSchema.safeParse({});

      expect(result.success).toBe(false);
      if (!result.success) {
        // When field is completely missing, Zod returns "Required"
        expect(result.error.errors[0].message).toBe("Required");
      }
    });
  });

  describe("type inference", () => {
    it("should correctly infer the input type", () => {
      const validInput = { prompt: "Create a quiz about TypeScript" };
      const result = aiQuizGenerationSchema.safeParse(validInput);

      if (result.success) {
        // Should have correct TypeScript type
        const data: { prompt: string } = result.data;
        expect(data.prompt).toBe("Create a quiz about TypeScript");
      }
    });
  });

  describe("real-world prompts", () => {
    it("should accept detailed technical prompt", () => {
      const validPrompt = {
        prompt:
          "Create a comprehensive quiz about React Hooks, covering useState, useEffect, useContext, useReducer, useMemo, and useCallback. Include questions about their use cases, common pitfalls, and best practices.",
      };

      const result = aiQuizGenerationSchema.safeParse(validPrompt);

      expect(result.success).toBe(true);
    });

    it("should accept simple prompt", () => {
      const validPrompt = { prompt: "JavaScript basics" };

      const result = aiQuizGenerationSchema.safeParse(validPrompt);

      expect(result.success).toBe(true);
    });

    it("should accept prompt with instructions", () => {
      const validPrompt = {
        prompt:
          "Generate 5 multiple-choice questions about Python data structures (lists, tuples, dictionaries, sets). Make them challenging but fair for intermediate developers.",
      };

      const result = aiQuizGenerationSchema.safeParse(validPrompt);

      expect(result.success).toBe(true);
    });

    it("should accept prompt with formatting", () => {
      const validPrompt = {
        prompt: `Topic: Web Security
        Focus areas:
        - XSS attacks
        - CSRF protection
        - SQL injection
        - Authentication best practices

        Create 10 questions covering these topics.`,
      };

      const result = aiQuizGenerationSchema.safeParse(validPrompt);

      expect(result.success).toBe(true);
    });
  });
});
