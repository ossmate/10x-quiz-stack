/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";

import { aiQuizResponseSchema, parseAndValidateAIResponse } from "./ai-response.schema.ts";

describe("aiQuizResponseSchema", () => {
  // Helper function to create a valid option
  const createValidOption = (content: string, isCorrect = false) => ({
    content,
    is_correct: isCorrect,
  });

  // Helper function to create a valid question
  const createValidQuestion = (content: string) => ({
    content,
    explanation: "Explanation for the question",
    options: [
      createValidOption("Option 1", true),
      createValidOption("Option 2"),
      createValidOption("Option 3"),
      createValidOption("Option 4"),
    ],
  });

  // Helper function to create a valid quiz response
  const createValidQuizResponse = () => ({
    title: "Test Quiz",
    description: "A test quiz description",
    questions: [
      createValidQuestion("Question 1"),
      createValidQuestion("Question 2"),
      createValidQuestion("Question 3"),
      createValidQuestion("Question 4"),
      createValidQuestion("Question 5"),
    ],
  });

  describe("valid quiz responses", () => {
    it("should accept valid quiz response with 5 questions", () => {
      const validResponse = createValidQuizResponse();

      const result = aiQuizResponseSchema.safeParse(validResponse);

      expect(result.success).toBe(true);
    });

    it("should accept quiz with exactly 10 questions (max)", () => {
      const validResponse = {
        ...createValidQuizResponse(),
        questions: Array.from({ length: 10 }, (_, i) => createValidQuestion(`Question ${i + 1}`)),
      };

      const result = aiQuizResponseSchema.safeParse(validResponse);

      expect(result.success).toBe(true);
    });

    it("should accept quiz with minimal title (1 char)", () => {
      const validResponse = {
        ...createValidQuizResponse(),
        title: "Q",
      };

      const result = aiQuizResponseSchema.safeParse(validResponse);

      expect(result.success).toBe(true);
    });

    it("should accept quiz with maximum title length (200 chars)", () => {
      const validResponse = {
        ...createValidQuizResponse(),
        title: "a".repeat(200),
      };

      const result = aiQuizResponseSchema.safeParse(validResponse);

      expect(result.success).toBe(true);
    });

    it("should accept quiz with minimal description (1 char)", () => {
      const validResponse = {
        ...createValidQuizResponse(),
        description: "D",
      };

      const result = aiQuizResponseSchema.safeParse(validResponse);

      expect(result.success).toBe(true);
    });

    it("should accept quiz with maximum description length (500 chars)", () => {
      const validResponse = {
        ...createValidQuizResponse(),
        description: "a".repeat(500),
      };

      const result = aiQuizResponseSchema.safeParse(validResponse);

      expect(result.success).toBe(true);
    });

    it("should accept question without explanation", () => {
      const validResponse = createValidQuizResponse();
      delete validResponse.questions[0].explanation;

      const result = aiQuizResponseSchema.safeParse(validResponse);

      expect(result.success).toBe(true);
    });
  });

  describe("title validation", () => {
    it("should reject quiz with empty title", () => {
      const invalidResponse = {
        ...createValidQuizResponse(),
        title: "",
      };

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Quiz title is required");
      }
    });

    it("should reject quiz with title exceeding 200 characters", () => {
      const invalidResponse = {
        ...createValidQuizResponse(),
        title: "a".repeat(201),
      };

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Quiz title must be less than 200 characters");
      }
    });

    it("should reject quiz without title", () => {
      const invalidResponse = createValidQuizResponse();
      delete (invalidResponse as any).title;

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
    });
  });

  describe("description validation", () => {
    it("should reject quiz with empty description", () => {
      const invalidResponse = {
        ...createValidQuizResponse(),
        description: "",
      };

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Quiz description is required");
      }
    });

    it("should reject quiz with description exceeding 500 characters", () => {
      const invalidResponse = {
        ...createValidQuizResponse(),
        description: "a".repeat(501),
      };

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Description must be less than 500 characters");
      }
    });

    it("should reject quiz without description", () => {
      const invalidResponse = createValidQuizResponse();
      delete (invalidResponse as any).description;

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
    });
  });

  describe("questions array validation", () => {
    it("should reject quiz with less than 5 questions", () => {
      const invalidResponse = {
        ...createValidQuizResponse(),
        questions: Array.from({ length: 4 }, (_, i) => createValidQuestion(`Question ${i + 1}`)),
      };

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Quiz must have at least 5 questions");
      }
    });

    it("should reject quiz with more than 10 questions", () => {
      const invalidResponse = {
        ...createValidQuizResponse(),
        questions: Array.from({ length: 11 }, (_, i) => createValidQuestion(`Question ${i + 1}`)),
      };

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Quiz must have at most 10 questions");
      }
    });

    it("should reject quiz without questions", () => {
      const invalidResponse = createValidQuizResponse();
      delete (invalidResponse as any).questions;

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
    });

    it("should reject quiz with empty questions array", () => {
      const invalidResponse = {
        ...createValidQuizResponse(),
        questions: [],
      };

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
    });
  });

  describe("question content validation", () => {
    it("should reject question with empty content", () => {
      const invalidResponse = createValidQuizResponse();
      invalidResponse.questions[0].content = "";

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Question content is required");
      }
    });

    it("should reject question without content", () => {
      const invalidResponse = createValidQuizResponse();
      delete (invalidResponse.questions[0] as any).content;

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
    });
  });

  describe("options array validation", () => {
    it("should reject question without exactly 4 options", () => {
      const invalidResponse = createValidQuizResponse();
      invalidResponse.questions[0].options = [
        createValidOption("Option 1", true),
        createValidOption("Option 2"),
        createValidOption("Option 3"),
      ];

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Each question must have exactly 4 options");
      }
    });

    it("should reject question with more than 4 options", () => {
      const invalidResponse = createValidQuizResponse();
      invalidResponse.questions[0].options = [
        createValidOption("Option 1", true),
        createValidOption("Option 2"),
        createValidOption("Option 3"),
        createValidOption("Option 4"),
        createValidOption("Option 5"),
      ];

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
    });

    it("should reject question without options", () => {
      const invalidResponse = createValidQuizResponse();
      delete (invalidResponse.questions[0] as any).options;

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
    });
  });

  describe("correct answer validation", () => {
    it("should reject question without any correct answer", () => {
      const invalidResponse = createValidQuizResponse();
      invalidResponse.questions[0].options = [
        createValidOption("Option 1", false),
        createValidOption("Option 2", false),
        createValidOption("Option 3", false),
        createValidOption("Option 4", false),
      ];

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Each question must have exactly one correct answer");
      }
    });

    it("should reject question with multiple correct answers", () => {
      const invalidResponse = createValidQuizResponse();
      invalidResponse.questions[0].options = [
        createValidOption("Option 1", true),
        createValidOption("Option 2", true),
        createValidOption("Option 3", false),
        createValidOption("Option 4", false),
      ];

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Each question must have exactly one correct answer");
      }
    });

    it("should reject question with all correct answers", () => {
      const invalidResponse = createValidQuizResponse();
      invalidResponse.questions[0].options = [
        createValidOption("Option 1", true),
        createValidOption("Option 2", true),
        createValidOption("Option 3", true),
        createValidOption("Option 4", true),
      ];

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
    });
  });

  describe("option content validation", () => {
    it("should reject option with empty content", () => {
      const invalidResponse = createValidQuizResponse();
      invalidResponse.questions[0].options[0].content = "";

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Option content is required");
      }
    });

    it("should reject option without content", () => {
      const invalidResponse = createValidQuizResponse();
      delete (invalidResponse.questions[0].options[0] as any).content;

      const result = aiQuizResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
    });
  });
});

describe("parseAndValidateAIResponse", () => {
  const validQuizJSON = JSON.stringify({
    title: "Test Quiz",
    description: "A test quiz",
    questions: [
      {
        content: "Question 1",
        explanation: "Explanation",
        options: [
          { content: "Option 1", is_correct: true },
          { content: "Option 2", is_correct: false },
          { content: "Option 3", is_correct: false },
          { content: "Option 4", is_correct: false },
        ],
      },
      {
        content: "Question 2",
        options: [
          { content: "Option 1", is_correct: false },
          { content: "Option 2", is_correct: true },
          { content: "Option 3", is_correct: false },
          { content: "Option 4", is_correct: false },
        ],
      },
      {
        content: "Question 3",
        options: [
          { content: "Option 1", is_correct: false },
          { content: "Option 2", is_correct: false },
          { content: "Option 3", is_correct: true },
          { content: "Option 4", is_correct: false },
        ],
      },
      {
        content: "Question 4",
        options: [
          { content: "Option 1", is_correct: false },
          { content: "Option 2", is_correct: false },
          { content: "Option 3", is_correct: false },
          { content: "Option 4", is_correct: true },
        ],
      },
      {
        content: "Question 5",
        options: [
          { content: "Option 1", is_correct: true },
          { content: "Option 2", is_correct: false },
          { content: "Option 3", is_correct: false },
          { content: "Option 4", is_correct: false },
        ],
      },
    ],
  });

  describe("successful parsing and validation", () => {
    it("should successfully parse and validate a valid JSON response", () => {
      const result = parseAndValidateAIResponse(validQuizJSON);

      expect(result).toBeDefined();
      expect(result.title).toBe("Test Quiz");
      expect(result.description).toBe("A test quiz");
      expect(result.questions.length).toBe(5);
    });

    it("should return correctly typed data", () => {
      const result = parseAndValidateAIResponse(validQuizJSON);

      expect(typeof result.title).toBe("string");
      expect(typeof result.description).toBe("string");
      expect(Array.isArray(result.questions)).toBe(true);
    });

    it("should preserve all question data", () => {
      const result = parseAndValidateAIResponse(validQuizJSON);

      expect(result.questions[0].content).toBe("Question 1");
      expect(result.questions[0].explanation).toBe("Explanation");
      expect(result.questions[0].options.length).toBe(4);
    });

    it("should preserve option data correctly", () => {
      const result = parseAndValidateAIResponse(validQuizJSON);

      expect(result.questions[0].options[0].content).toBe("Option 1");
      expect(result.questions[0].options[0].is_correct).toBe(true);
    });
  });

  describe("JSON parsing errors", () => {
    it("should throw error for invalid JSON", () => {
      const invalidJSON = "{ invalid json }";

      expect(() => parseAndValidateAIResponse(invalidJSON)).toThrow();
    });

    it("should throw error for incomplete JSON", () => {
      const incompleteJSON = '{"title": "Test"';

      expect(() => parseAndValidateAIResponse(incompleteJSON)).toThrow();
    });

    it("should throw error for empty string", () => {
      expect(() => parseAndValidateAIResponse("")).toThrow();
    });

    it("should include error context in error message for invalid JSON", () => {
      const invalidJSON = "not valid json";

      expect(() => parseAndValidateAIResponse(invalidJSON)).toThrow(/Invalid JSON from AI/);
    });
  });

  describe("validation errors", () => {
    it("should throw error when quiz is missing title", () => {
      const invalidQuiz = JSON.stringify({
        description: "A test quiz",
        questions: [
          {
            content: "Question 1",
            options: [
              { content: "Option 1", is_correct: true },
              { content: "Option 2", is_correct: false },
              { content: "Option 3", is_correct: false },
              { content: "Option 4", is_correct: false },
            ],
          },
          {
            content: "Question 2",
            options: [
              { content: "Option 1", is_correct: true },
              { content: "Option 2", is_correct: false },
              { content: "Option 3", is_correct: false },
              { content: "Option 4", is_correct: false },
            ],
          },
          {
            content: "Question 3",
            options: [
              { content: "Option 1", is_correct: true },
              { content: "Option 2", is_correct: false },
              { content: "Option 3", is_correct: false },
              { content: "Option 4", is_correct: false },
            ],
          },
          {
            content: "Question 4",
            options: [
              { content: "Option 1", is_correct: true },
              { content: "Option 2", is_correct: false },
              { content: "Option 3", is_correct: false },
              { content: "Option 4", is_correct: false },
            ],
          },
          {
            content: "Question 5",
            options: [
              { content: "Option 1", is_correct: true },
              { content: "Option 2", is_correct: false },
              { content: "Option 3", is_correct: false },
              { content: "Option 4", is_correct: false },
            ],
          },
        ],
      });

      expect(() => parseAndValidateAIResponse(invalidQuiz)).toThrow(/AI response validation failed/);
    });

    it("should throw error when quiz has too few questions", () => {
      const invalidQuiz = JSON.stringify({
        title: "Test Quiz",
        description: "A test quiz",
        questions: [
          {
            content: "Question 1",
            options: [
              { content: "Option 1", is_correct: true },
              { content: "Option 2", is_correct: false },
              { content: "Option 3", is_correct: false },
              { content: "Option 4", is_correct: false },
            ],
          },
        ],
      });

      expect(() => parseAndValidateAIResponse(invalidQuiz)).toThrow(/AI response validation failed/);
      expect(() => parseAndValidateAIResponse(invalidQuiz)).toThrow(/at least 5 questions/);
    });

    it("should throw error when question has wrong number of options", () => {
      const invalidQuiz = JSON.stringify({
        title: "Test Quiz",
        description: "A test quiz",
        questions: Array.from({ length: 5 }, () => ({
          content: "Question",
          options: [
            { content: "Option 1", is_correct: true },
            { content: "Option 2", is_correct: false },
          ],
        })),
      });

      expect(() => parseAndValidateAIResponse(invalidQuiz)).toThrow(/AI response validation failed/);
      expect(() => parseAndValidateAIResponse(invalidQuiz)).toThrow(/exactly 4 options/);
    });

    it("should throw error when question has no correct answer", () => {
      const invalidQuiz = JSON.stringify({
        title: "Test Quiz",
        description: "A test quiz",
        questions: Array.from({ length: 5 }, () => ({
          content: "Question",
          options: [
            { content: "Option 1", is_correct: false },
            { content: "Option 2", is_correct: false },
            { content: "Option 3", is_correct: false },
            { content: "Option 4", is_correct: false },
          ],
        })),
      });

      expect(() => parseAndValidateAIResponse(invalidQuiz)).toThrow(/AI response validation failed/);
      expect(() => parseAndValidateAIResponse(invalidQuiz)).toThrow(/exactly one correct answer/);
    });

    it("should throw error when question has multiple correct answers", () => {
      const invalidQuiz = JSON.stringify({
        title: "Test Quiz",
        description: "A test quiz",
        questions: Array.from({ length: 5 }, () => ({
          content: "Question",
          options: [
            { content: "Option 1", is_correct: true },
            { content: "Option 2", is_correct: true },
            { content: "Option 3", is_correct: false },
            { content: "Option 4", is_correct: false },
          ],
        })),
      });

      expect(() => parseAndValidateAIResponse(invalidQuiz)).toThrow(/AI response validation failed/);
      expect(() => parseAndValidateAIResponse(invalidQuiz)).toThrow(/exactly one correct answer/);
    });
  });

  describe("error messages", () => {
    it("should include validation error details in error message", () => {
      const invalidQuiz = JSON.stringify({
        title: "",
        description: "A test quiz",
        questions: [],
      });

      expect(() => parseAndValidateAIResponse(invalidQuiz)).toThrow(/AI response validation failed/);
    });

    it("should handle multiple validation errors", () => {
      const invalidQuiz = JSON.stringify({
        title: "",
        description: "",
        questions: [],
      });

      expect(() => parseAndValidateAIResponse(invalidQuiz)).toThrow(/AI response validation failed/);
    });
  });

  describe("edge cases", () => {
    it("should handle JSON with extra whitespace", () => {
      const jsonWithWhitespace = `
        {
          "title": "Test Quiz",
          "description": "A test quiz",
          "questions": [
            ${Array.from(
              { length: 5 },
              () => `{
              "content": "Question",
              "options": [
                { "content": "Option 1", "is_correct": true },
                { "content": "Option 2", "is_correct": false },
                { "content": "Option 3", "is_correct": false },
                { "content": "Option 4", "is_correct": false }
              ]
            }`
            ).join(",\n")}
          ]
        }
      `;

      const result = parseAndValidateAIResponse(jsonWithWhitespace);

      expect(result).toBeDefined();
      expect(result.title).toBe("Test Quiz");
    });

    it("should handle quiz with exactly 10 questions", () => {
      const maxQuestionsQuiz = JSON.stringify({
        title: "Test Quiz",
        description: "A test quiz",
        questions: Array.from({ length: 10 }, (_, i) => ({
          content: `Question ${i + 1}`,
          options: [
            { content: "Option 1", is_correct: true },
            { content: "Option 2", is_correct: false },
            { content: "Option 3", is_correct: false },
            { content: "Option 4", is_correct: false },
          ],
        })),
      });

      const result = parseAndValidateAIResponse(maxQuestionsQuiz);

      expect(result).toBeDefined();
      expect(result.questions.length).toBe(10);
    });

    it("should handle quiz with maximum title length", () => {
      const quizWithLongTitle = JSON.stringify({
        title: "a".repeat(200),
        description: "A test quiz",
        questions: Array.from({ length: 5 }, () => ({
          content: "Question",
          options: [
            { content: "Option 1", is_correct: true },
            { content: "Option 2", is_correct: false },
            { content: "Option 3", is_correct: false },
            { content: "Option 4", is_correct: false },
          ],
        })),
      });

      const result = parseAndValidateAIResponse(quizWithLongTitle);

      expect(result).toBeDefined();
      expect(result.title.length).toBe(200);
    });
  });
});
