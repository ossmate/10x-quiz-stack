/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";

import type { QuizDetailDTO } from "../../types.ts";
import { isValidStatusTransition, validateQuizForPublishing } from "./quiz-publish.validator.ts";

describe("validateQuizForPublishing", () => {
  // Helper function to create a valid quiz
  const createValidQuiz = (): QuizDetailDTO => ({
    id: "123e4567-e89b-12d3-a456-426614174000",
    user_id: "user-123",
    title: "Test Quiz",
    description: "A test quiz",
    status: "draft",
    source: "manual",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    questions: [
      {
        id: "q1",
        quiz_id: "123e4567-e89b-12d3-a456-426614174000",
        content: "What is 2+2?",
        explanation: "Basic math",
        position: 1,
        status: "active",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        options: [
          {
            id: "o1",
            question_id: "q1",
            content: "4",
            is_correct: true,
            position: 1,
            created_at: "2025-01-01T00:00:00Z",
          },
          {
            id: "o2",
            question_id: "q1",
            content: "5",
            is_correct: false,
            position: 2,
            created_at: "2025-01-01T00:00:00Z",
          },
        ],
      },
    ],
  });

  describe("valid quizzes", () => {
    it("should validate a complete quiz with all required fields", () => {
      const quiz = createValidQuiz();

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should validate a quiz with multiple questions", () => {
      const quiz = createValidQuiz();
      quiz.questions = [
        quiz.questions![0],
        {
          ...quiz.questions![0],
          id: "q2",
          content: "What is 3+3?",
          position: 2,
        },
      ];

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should validate a quiz with multiple options per question", () => {
      const quiz = createValidQuiz();
      quiz.questions![0].options.push(
        {
          id: "o3",
          question_id: "q1",
          content: "3",
          is_correct: false,
          position: 3,
          created_at: "2025-01-01T00:00:00Z",
        },
        {
          id: "o4",
          question_id: "q1",
          content: "2",
          is_correct: false,
          position: 4,
          created_at: "2025-01-01T00:00:00Z",
        }
      );

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should validate a quiz with multiple correct answers", () => {
      const quiz = createValidQuiz();
      quiz.questions![0].options[1].is_correct = true;

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("title validation", () => {
    it("should reject quiz without title", () => {
      const quiz = createValidQuiz();
      quiz.title = "";

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Quiz must have a title");
    });

    it("should reject quiz with only whitespace title", () => {
      const quiz = createValidQuiz();
      quiz.title = "   ";

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Quiz must have a title");
    });

    it("should reject quiz with title containing only tabs", () => {
      const quiz = createValidQuiz();
      quiz.title = "\t\t\t";

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Quiz must have a title");
    });
  });

  describe("questions validation", () => {
    it("should reject quiz without questions", () => {
      const quiz = createValidQuiz();
      quiz.questions = [];

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Quiz must have at least one question");
    });

    it("should reject quiz with undefined questions", () => {
      const quiz = createValidQuiz();
      quiz.questions = undefined;

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Quiz must have at least one question");
    });
  });

  describe("question content validation", () => {
    it("should reject quiz with empty question content", () => {
      const quiz = createValidQuiz();
      quiz.questions![0].content = "";

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Question 1 must have content");
    });

    it("should reject quiz with whitespace-only question content", () => {
      const quiz = createValidQuiz();
      quiz.questions![0].content = "   ";

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Question 1 must have content");
    });

    it("should report correct question number for second question", () => {
      const quiz = createValidQuiz();
      quiz.questions!.push({
        ...quiz.questions![0],
        id: "q2",
        content: "",
        position: 2,
      });

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Question 2 must have content");
    });
  });

  describe("options validation", () => {
    it("should reject question without options", () => {
      const quiz = createValidQuiz();
      quiz.questions![0].options = [];

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Question 1 must have at least one option");
    });

    it("should reject question with undefined options", () => {
      const quiz = createValidQuiz();
      (quiz.questions![0] as any).options = undefined;

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Question 1 must have at least one option");
    });

    it("should reject question with only one option", () => {
      const quiz = createValidQuiz();
      quiz.questions![0].options = [quiz.questions![0].options[0]];

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Question 1 must have at least 2 options");
    });

    it("should reject question without any correct answer", () => {
      const quiz = createValidQuiz();
      quiz.questions![0].options.forEach((opt) => (opt.is_correct = false));

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Question 1 must have at least one correct answer");
    });
  });

  describe("option content validation", () => {
    it("should reject option with empty content", () => {
      const quiz = createValidQuiz();
      quiz.questions![0].options[0].content = "";

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Question 1, option 1 must have content");
    });

    it("should reject option with whitespace-only content", () => {
      const quiz = createValidQuiz();
      quiz.questions![0].options[0].content = "   ";

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Question 1, option 1 must have content");
    });

    it("should report correct option number", () => {
      const quiz = createValidQuiz();
      quiz.questions![0].options[1].content = "";

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Question 1, option 2 must have content");
    });
  });

  describe("multiple validation errors", () => {
    it("should collect all validation errors", () => {
      const quiz = createValidQuiz();
      quiz.title = "";
      quiz.questions![0].content = "";
      quiz.questions![0].options[0].content = "";

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain("Quiz must have a title");
      expect(result.errors).toContain("Question 1 must have content");
      expect(result.errors).toContain("Question 1, option 1 must have content");
    });

    it("should report errors for multiple questions", () => {
      const quiz = createValidQuiz();
      quiz.questions!.push({
        ...quiz.questions![0],
        id: "q2",
        content: "",
        position: 2,
      });

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Question 2 must have content");
    });

    it("should report errors for multiple options", () => {
      const quiz = createValidQuiz();
      quiz.questions![0].options[0].content = "";
      quiz.questions![0].options[1].content = "";

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Question 1, option 1 must have content");
      expect(result.errors).toContain("Question 1, option 2 must have content");
    });
  });

  describe("edge cases", () => {
    it("should handle quiz with no description", () => {
      const quiz = createValidQuiz();
      quiz.description = "";

      const result = validateQuizForPublishing(quiz);

      // Description is not required for publishing
      expect(result.valid).toBe(true);
    });

    it("should handle question with no explanation", () => {
      const quiz = createValidQuiz();
      quiz.questions![0].explanation = undefined;

      const result = validateQuizForPublishing(quiz);

      // Explanation is not required for publishing
      expect(result.valid).toBe(true);
    });

    it("should handle large number of questions", () => {
      const quiz = createValidQuiz();
      quiz.questions = Array.from({ length: 50 }, (_, i) => ({
        ...quiz.questions![0],
        id: `q${i + 1}`,
        content: `Question ${i + 1}`,
        position: i + 1,
      }));

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(true);
    });

    it("should handle large number of options", () => {
      const quiz = createValidQuiz();
      quiz.questions![0].options = Array.from({ length: 10 }, (_, i) => ({
        id: `o${i + 1}`,
        question_id: "q1",
        content: `Option ${i + 1}`,
        is_correct: i === 0,
        position: i + 1,
        created_at: "2025-01-01T00:00:00Z",
      }));

      const result = validateQuizForPublishing(quiz);

      expect(result.valid).toBe(true);
    });
  });
});

describe("isValidStatusTransition", () => {
  describe("valid transitions from draft", () => {
    it("should allow transition from draft to public", () => {
      const isValid = isValidStatusTransition("draft", "public");

      expect(isValid).toBe(true);
    });

    it("should allow transition from draft to archived", () => {
      const isValid = isValidStatusTransition("draft", "archived");

      expect(isValid).toBe(true);
    });
  });

  describe("invalid transitions from draft", () => {
    it("should not allow transition from draft to private", () => {
      const isValid = isValidStatusTransition("draft", "private");

      expect(isValid).toBe(false);
    });

    it("should not allow transition from draft to draft", () => {
      const isValid = isValidStatusTransition("draft", "draft");

      expect(isValid).toBe(false);
    });
  });

  describe("valid transitions from public", () => {
    it("should allow transition from public to draft", () => {
      const isValid = isValidStatusTransition("public", "draft");

      expect(isValid).toBe(true);
    });

    it("should allow transition from public to private", () => {
      const isValid = isValidStatusTransition("public", "private");

      expect(isValid).toBe(true);
    });

    it("should allow transition from public to archived", () => {
      const isValid = isValidStatusTransition("public", "archived");

      expect(isValid).toBe(true);
    });
  });

  describe("invalid transitions from public", () => {
    it("should not allow transition from public to public", () => {
      const isValid = isValidStatusTransition("public", "public");

      expect(isValid).toBe(false);
    });
  });

  describe("valid transitions from private", () => {
    it("should allow transition from private to draft", () => {
      const isValid = isValidStatusTransition("private", "draft");

      expect(isValid).toBe(true);
    });

    it("should allow transition from private to public", () => {
      const isValid = isValidStatusTransition("private", "public");

      expect(isValid).toBe(true);
    });

    it("should allow transition from private to archived", () => {
      const isValid = isValidStatusTransition("private", "archived");

      expect(isValid).toBe(true);
    });
  });

  describe("invalid transitions from private", () => {
    it("should not allow transition from private to private", () => {
      const isValid = isValidStatusTransition("private", "private");

      expect(isValid).toBe(false);
    });
  });

  describe("valid transitions from archived", () => {
    it("should allow transition from archived to draft", () => {
      const isValid = isValidStatusTransition("archived", "draft");

      expect(isValid).toBe(true);
    });
  });

  describe("invalid transitions from archived", () => {
    it("should not allow transition from archived to public", () => {
      const isValid = isValidStatusTransition("archived", "public");

      expect(isValid).toBe(false);
    });

    it("should not allow transition from archived to private", () => {
      const isValid = isValidStatusTransition("archived", "private");

      expect(isValid).toBe(false);
    });

    it("should not allow transition from archived to archived", () => {
      const isValid = isValidStatusTransition("archived", "archived");

      expect(isValid).toBe(false);
    });
  });

  describe("invalid status values", () => {
    it("should return false for unknown current status", () => {
      const isValid = isValidStatusTransition("unknown", "public");

      expect(isValid).toBe(false);
    });

    it("should return false for unknown new status", () => {
      const isValid = isValidStatusTransition("draft", "unknown");

      expect(isValid).toBe(false);
    });

    it("should return false for both unknown statuses", () => {
      const isValid = isValidStatusTransition("unknown1", "unknown2");

      expect(isValid).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle empty string as current status", () => {
      const isValid = isValidStatusTransition("", "public");

      expect(isValid).toBe(false);
    });

    it("should handle empty string as new status", () => {
      const isValid = isValidStatusTransition("draft", "");

      expect(isValid).toBe(false);
    });

    it("should be case sensitive", () => {
      const isValid = isValidStatusTransition("DRAFT", "PUBLIC");

      expect(isValid).toBe(false);
    });

    it("should not allow whitespace-padded status values", () => {
      const isValid = isValidStatusTransition(" draft ", " public ");

      expect(isValid).toBe(false);
    });
  });

  describe("complete status workflow", () => {
    it("should support typical workflow: draft -> public -> private -> archived", () => {
      expect(isValidStatusTransition("draft", "public")).toBe(true);
      expect(isValidStatusTransition("public", "private")).toBe(true);
      expect(isValidStatusTransition("private", "archived")).toBe(true);
    });

    it("should support restoration: archived -> draft -> public", () => {
      expect(isValidStatusTransition("archived", "draft")).toBe(true);
      expect(isValidStatusTransition("draft", "public")).toBe(true);
    });

    it("should support unpublishing: public -> draft", () => {
      expect(isValidStatusTransition("public", "draft")).toBe(true);
    });

    it("should support direct archiving from any active status", () => {
      expect(isValidStatusTransition("draft", "archived")).toBe(true);
      expect(isValidStatusTransition("public", "archived")).toBe(true);
      expect(isValidStatusTransition("private", "archived")).toBe(true);
    });
  });
});
