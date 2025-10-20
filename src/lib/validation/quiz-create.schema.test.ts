import { describe, expect, it } from "vitest";

import { quizCreateSchema } from "./quiz-create.schema.ts";

describe("quizCreateSchema", () => {
  // Helper function to create a valid option
  const createValidOption = (position: number, isCorrect: boolean = false) => ({
    content: `Option ${position}`,
    is_correct: isCorrect,
    position,
  });

  // Helper function to create a valid question
  const createValidQuestion = (position: number) => ({
    content: `Question ${position}`,
    explanation: "Explanation for the question",
    position,
    options: [createValidOption(1, true), createValidOption(2)],
  });

  // Helper function to create a valid quiz
  const createValidQuiz = () => ({
    title: "Test Quiz",
    description: "A test quiz description",
    source: "manual" as const,
    questions: [createValidQuestion(1)],
  });

  describe("valid quiz creation", () => {
    it("should accept valid quiz with minimal required fields", () => {
      const validQuiz = {
        title: "Test Quiz",
        questions: [createValidQuestion(1)],
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Test Quiz");
        expect(result.data.source).toBe("manual"); // default
      }
    });

    it("should accept valid quiz with all fields", () => {
      const validQuiz = createValidQuiz();

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
    });

    it("should accept quiz with AI-generated source", () => {
      const validQuiz = {
        ...createValidQuiz(),
        source: "ai_generated",
        ai_model: "gpt-4",
        ai_prompt: "Create a quiz about JavaScript",
        ai_temperature: 0.7,
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
    });

    it("should accept quiz with multiple questions", () => {
      const validQuiz = {
        ...createValidQuiz(),
        questions: [createValidQuestion(1), createValidQuestion(2), createValidQuestion(3)],
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.questions.length).toBe(3);
      }
    });

    it("should accept quiz with exactly 50 questions (max)", () => {
      const validQuiz = {
        ...createValidQuiz(),
        questions: Array.from({ length: 50 }, (_, i) => createValidQuestion(i + 1)),
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
    });

    it("should accept question with exactly 2 options (min)", () => {
      const validQuiz = {
        ...createValidQuiz(),
        questions: [
          {
            content: "Question 1",
            position: 1,
            options: [createValidOption(1, true), createValidOption(2)],
          },
        ],
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
    });

    it("should accept question with exactly 10 options (max)", () => {
      const validQuiz = {
        ...createValidQuiz(),
        questions: [
          {
            content: "Question 1",
            position: 1,
            options: Array.from({ length: 10 }, (_, i) => createValidOption(i + 1, i === 0)),
          },
        ],
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
    });

    it("should accept question without explanation", () => {
      const validQuiz = {
        ...createValidQuiz(),
        questions: [
          {
            content: "Question 1",
            position: 1,
            options: [createValidOption(1, true), createValidOption(2)],
          },
        ],
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
    });
  });

  describe("title validation", () => {
    it("should reject empty title", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        title: "",
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Title is required");
      }
    });

    it("should reject title exceeding 200 characters", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        title: "a".repeat(201),
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Title must be less than 200 characters");
      }
    });

    it("should accept title with exactly 200 characters", () => {
      const validQuiz = {
        ...createValidQuiz(),
        title: "a".repeat(200),
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
    });

    it("should reject missing title", () => {
      const invalidQuiz = {
        questions: [createValidQuestion(1)],
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
    });
  });

  describe("description validation", () => {
    it("should allow missing description (optional)", () => {
      const validQuiz = {
        title: "Test Quiz",
        questions: [createValidQuestion(1)],
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
    });

    it("should accept empty description", () => {
      const validQuiz = {
        ...createValidQuiz(),
        description: "",
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
    });

    it("should accept description with exactly 1000 characters", () => {
      const validQuiz = {
        ...createValidQuiz(),
        description: "a".repeat(1000),
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
    });

    it("should reject description exceeding 1000 characters", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        description: "a".repeat(1001),
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Description must be less than 1000 characters");
      }
    });
  });

  describe("source validation", () => {
    it("should default to 'manual' when not provided", () => {
      const validQuiz = {
        title: "Test Quiz",
        questions: [createValidQuestion(1)],
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe("manual");
      }
    });

    it("should accept 'manual' source", () => {
      const validQuiz = {
        ...createValidQuiz(),
        source: "manual",
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
    });

    it("should accept 'ai_generated' source", () => {
      const validQuiz = {
        ...createValidQuiz(),
        source: "ai_generated",
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
    });

    it("should reject invalid source", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        source: "invalid_source",
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
    });
  });

  describe("AI parameters validation", () => {
    it("should accept AI parameters when provided", () => {
      const validQuiz = {
        ...createValidQuiz(),
        ai_model: "gpt-4",
        ai_prompt: "Create a quiz",
        ai_temperature: 0.5,
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
    });

    it("should accept temperature at minimum (0)", () => {
      const validQuiz = {
        ...createValidQuiz(),
        ai_temperature: 0,
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
    });

    it("should accept temperature at maximum (2)", () => {
      const validQuiz = {
        ...createValidQuiz(),
        ai_temperature: 2,
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
    });

    it("should reject temperature below 0", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        ai_temperature: -0.1,
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
    });

    it("should reject temperature above 2", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        ai_temperature: 2.1,
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
    });
  });

  describe("questions validation", () => {
    it("should reject quiz without questions", () => {
      const invalidQuiz = {
        title: "Test Quiz",
        questions: [],
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Quiz must have at least one question");
      }
    });

    it("should reject quiz with more than 50 questions", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        questions: Array.from({ length: 51 }, (_, i) => createValidQuestion(i + 1)),
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Quiz cannot have more than 50 questions");
      }
    });

    it("should reject missing questions field", () => {
      const invalidQuiz = {
        title: "Test Quiz",
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
    });
  });

  describe("question content validation", () => {
    it("should reject question with empty content", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        questions: [
          {
            content: "",
            position: 1,
            options: [createValidOption(1, true), createValidOption(2)],
          },
        ],
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Question content is required");
      }
    });

    it("should reject question without content", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        questions: [
          {
            position: 1,
            options: [createValidOption(1, true), createValidOption(2)],
          },
        ],
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
    });
  });

  describe("question position validation", () => {
    it("should reject question with negative position", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        questions: [
          {
            content: "Question 1",
            position: -1,
            options: [createValidOption(1, true), createValidOption(2)],
          },
        ],
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
    });

    it("should reject question with zero position", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        questions: [
          {
            content: "Question 1",
            position: 0,
            options: [createValidOption(1, true), createValidOption(2)],
          },
        ],
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
    });

    it("should reject question with non-integer position", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        questions: [
          {
            content: "Question 1",
            position: 1.5,
            options: [createValidOption(1, true), createValidOption(2)],
          },
        ],
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
    });
  });

  describe("options validation", () => {
    it("should reject question with less than 2 options", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        questions: [
          {
            content: "Question 1",
            position: 1,
            options: [createValidOption(1, true)],
          },
        ],
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Question must have at least 2 options");
      }
    });

    it("should reject question with more than 10 options", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        questions: [
          {
            content: "Question 1",
            position: 1,
            options: Array.from({ length: 11 }, (_, i) => createValidOption(i + 1, i === 0)),
          },
        ],
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Question cannot have more than 10 options");
      }
    });

    it("should reject question without any correct option", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        questions: [
          {
            content: "Question 1",
            position: 1,
            options: [createValidOption(1, false), createValidOption(2, false)],
          },
        ],
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("At least one option must be marked as correct");
      }
    });

    it("should accept question with multiple correct options", () => {
      const validQuiz = {
        ...createValidQuiz(),
        questions: [
          {
            content: "Question 1",
            position: 1,
            options: [createValidOption(1, true), createValidOption(2, true), createValidOption(3, false)],
          },
        ],
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
    });
  });

  describe("option content validation", () => {
    it("should reject option with empty content", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        questions: [
          {
            content: "Question 1",
            position: 1,
            options: [
              { content: "", is_correct: true, position: 1 },
              createValidOption(2),
            ],
          },
        ],
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Option content is required");
      }
    });

    it("should reject option without content", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        questions: [
          {
            content: "Question 1",
            position: 1,
            options: [{ is_correct: true, position: 1 }, createValidOption(2)],
          },
        ],
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
    });
  });

  describe("option position validation", () => {
    it("should reject option with negative position", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        questions: [
          {
            content: "Question 1",
            position: 1,
            options: [
              { content: "Option 1", is_correct: true, position: -1 },
              createValidOption(2),
            ],
          },
        ],
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
    });

    it("should reject option with zero position", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        questions: [
          {
            content: "Question 1",
            position: 1,
            options: [
              { content: "Option 1", is_correct: true, position: 0 },
              createValidOption(2),
            ],
          },
        ],
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
    });

    it("should reject option with non-integer position", () => {
      const invalidQuiz = {
        ...createValidQuiz(),
        questions: [
          {
            content: "Question 1",
            position: 1,
            options: [
              { content: "Option 1", is_correct: true, position: 1.5 },
              createValidOption(2),
            ],
          },
        ],
      };

      const result = quizCreateSchema.safeParse(invalidQuiz);

      expect(result.success).toBe(false);
    });
  });

  describe("real-world quiz scenarios", () => {
    it("should accept a typical manual quiz", () => {
      const validQuiz = {
        title: "JavaScript Fundamentals",
        description: "Test your knowledge of JavaScript basics",
        source: "manual",
        questions: [
          {
            content: "What is the correct syntax for a variable declaration?",
            explanation: "let and const are modern JavaScript variable declarations",
            position: 1,
            options: [
              { content: "let x = 5", is_correct: true, position: 1 },
              { content: "var x = 5", is_correct: true, position: 2 },
              { content: "x = 5", is_correct: false, position: 3 },
              { content: "variable x = 5", is_correct: false, position: 4 },
            ],
          },
          {
            content: "Which of these is a primitive type?",
            position: 2,
            options: [
              { content: "string", is_correct: true, position: 1 },
              { content: "object", is_correct: false, position: 2 },
              { content: "array", is_correct: false, position: 3 },
            ],
          },
        ],
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
    });

    it("should accept an AI-generated quiz", () => {
      const validQuiz = {
        title: "React Hooks Quiz",
        description: "Generated quiz about React Hooks",
        source: "ai_generated",
        ai_model: "gpt-4",
        ai_prompt: "Create a quiz about React Hooks",
        ai_temperature: 0.7,
        questions: Array.from({ length: 10 }, (_, i) => ({
          content: `Question ${i + 1} about React Hooks`,
          explanation: `Explanation for question ${i + 1}`,
          position: i + 1,
          options: [
            createValidOption(1, true),
            createValidOption(2),
            createValidOption(3),
            createValidOption(4),
          ],
        })),
      };

      const result = quizCreateSchema.safeParse(validQuiz);

      expect(result.success).toBe(true);
    });
  });
});
