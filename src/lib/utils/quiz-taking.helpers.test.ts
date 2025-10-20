import { describe, it, expect } from "vitest";
import type { QuizDetailDTO, QuestionWithOptionsDTO, OptionDTO } from "../../types";
import {
  calculateScore,
  getOptionLetter,
  isAnswerComplete,
  getAnsweredCount,
  areAllQuestionsAnswered,
} from "./quiz-taking.helpers";

// Test Data Factories
const createOption = (overrides?: Partial<OptionDTO>): OptionDTO => ({
  id: "opt-1",
  question_id: "q-1",
  content: "Option A",
  is_correct: false,
  position: 0,
  created_at: "2025-01-01T00:00:00Z",
  ...overrides,
});

const createQuestion = (overrides?: Partial<QuestionWithOptionsDTO>): QuestionWithOptionsDTO => ({
  id: "q-1",
  quiz_id: "quiz-1",
  content: "Question 1",
  explanation: "Explanation",
  position: 0,
  status: "active",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  options: [
    createOption({ id: "opt-1", is_correct: true, position: 0 }),
    createOption({ id: "opt-2", is_correct: false, position: 1 }),
  ],
  ...overrides,
});

const createQuiz = (overrides?: Partial<QuizDetailDTO>): QuizDetailDTO => ({
  id: "quiz-1",
  user_id: "user-1",
  title: "Test Quiz",
  description: "Test Description",
  status: "public",
  source: "manual",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  questions: [createQuestion()],
  ...overrides,
});

describe("calculateScore", () => {
  describe("edge cases", () => {
    it("should return 0 for quiz with no questions property", () => {
      // Arrange
      const quiz = createQuiz({ questions: undefined });
      const userAnswers = {};

      // Act
      const score = calculateScore(quiz, userAnswers);

      // Assert
      expect(score).toBe(0);
    });

    it("should return 0 for quiz with empty questions array", () => {
      // Arrange
      const quiz = createQuiz({ questions: [] });
      const userAnswers = {};

      // Act
      const score = calculateScore(quiz, userAnswers);

      // Assert
      expect(score).toBe(0);
    });

    it("should return 0 when user provides no answers", () => {
      // Arrange
      const quiz = createQuiz();
      const userAnswers = {};

      // Act
      const score = calculateScore(quiz, userAnswers);

      // Assert
      expect(score).toBe(0);
    });

    it("should handle question with no correct options", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [
          createQuestion({
            id: "q-1",
            options: [
              createOption({ id: "opt-1", is_correct: false }),
              createOption({ id: "opt-2", is_correct: false }),
            ],
          }),
        ],
      });
      const userAnswers = { "q-1": ["opt-1"] };

      // Act
      const score = calculateScore(quiz, userAnswers);

      // Assert
      expect(score).toBe(0);
    });
  });

  describe("single-answer questions", () => {
    it("should count correct single answer", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [
          createQuestion({
            id: "q-1",
            options: [
              createOption({ id: "opt-1", is_correct: true }),
              createOption({ id: "opt-2", is_correct: false }),
            ],
          }),
        ],
      });
      const userAnswers = { "q-1": ["opt-1"] };

      // Act
      const score = calculateScore(quiz, userAnswers);

      // Assert
      expect(score).toBe(1);
    });

    it("should not count incorrect single answer", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [
          createQuestion({
            id: "q-1",
            options: [
              createOption({ id: "opt-1", is_correct: true }),
              createOption({ id: "opt-2", is_correct: false }),
            ],
          }),
        ],
      });
      const userAnswers = { "q-1": ["opt-2"] };

      // Act
      const score = calculateScore(quiz, userAnswers);

      // Assert
      expect(score).toBe(0);
    });

    it("should not count unanswered question", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [
          createQuestion({
            id: "q-1",
            options: [
              createOption({ id: "opt-1", is_correct: true }),
              createOption({ id: "opt-2", is_correct: false }),
            ],
          }),
        ],
      });
      const userAnswers = { "q-1": [] };

      // Act
      const score = calculateScore(quiz, userAnswers);

      // Assert
      expect(score).toBe(0);
    });
  });

  describe("multi-answer questions", () => {
    it("should count correct when all correct options selected", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [
          createQuestion({
            id: "q-1",
            options: [
              createOption({ id: "opt-1", is_correct: true }),
              createOption({ id: "opt-2", is_correct: true }),
              createOption({ id: "opt-3", is_correct: false }),
            ],
          }),
        ],
      });
      const userAnswers = { "q-1": ["opt-1", "opt-2"] };

      // Act
      const score = calculateScore(quiz, userAnswers);

      // Assert
      expect(score).toBe(1);
    });

    it("should not count when only some correct options selected", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [
          createQuestion({
            id: "q-1",
            options: [
              createOption({ id: "opt-1", is_correct: true }),
              createOption({ id: "opt-2", is_correct: true }),
              createOption({ id: "opt-3", is_correct: false }),
            ],
          }),
        ],
      });
      const userAnswers = { "q-1": ["opt-1"] };

      // Act
      const score = calculateScore(quiz, userAnswers);

      // Assert
      expect(score).toBe(0);
    });

    it("should not count when correct options plus incorrect option selected", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [
          createQuestion({
            id: "q-1",
            options: [
              createOption({ id: "opt-1", is_correct: true }),
              createOption({ id: "opt-2", is_correct: true }),
              createOption({ id: "opt-3", is_correct: false }),
            ],
          }),
        ],
      });
      const userAnswers = { "q-1": ["opt-1", "opt-2", "opt-3"] };

      // Act
      const score = calculateScore(quiz, userAnswers);

      // Assert
      expect(score).toBe(0);
    });

    it("should handle order-independent selection for multi-answer", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [
          createQuestion({
            id: "q-1",
            options: [
              createOption({ id: "opt-1", is_correct: true }),
              createOption({ id: "opt-2", is_correct: true }),
              createOption({ id: "opt-3", is_correct: false }),
            ],
          }),
        ],
      });
      const userAnswers = { "q-1": ["opt-2", "opt-1"] }; // Different order

      // Act
      const score = calculateScore(quiz, userAnswers);

      // Assert
      expect(score).toBe(1);
    });
  });

  describe("multiple questions", () => {
    it("should calculate score for all correct answers", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [
          createQuestion({
            id: "q-1",
            options: [
              createOption({ id: "opt-1", is_correct: true }),
              createOption({ id: "opt-2", is_correct: false }),
            ],
          }),
          createQuestion({
            id: "q-2",
            options: [
              createOption({ id: "opt-3", is_correct: false, question_id: "q-2" }),
              createOption({ id: "opt-4", is_correct: true, question_id: "q-2" }),
            ],
          }),
          createQuestion({
            id: "q-3",
            options: [
              createOption({ id: "opt-5", is_correct: true, question_id: "q-3" }),
              createOption({ id: "opt-6", is_correct: true, question_id: "q-3" }),
            ],
          }),
        ],
      });
      const userAnswers = {
        "q-1": ["opt-1"],
        "q-2": ["opt-4"],
        "q-3": ["opt-5", "opt-6"],
      };

      // Act
      const score = calculateScore(quiz, userAnswers);

      // Assert
      expect(score).toBe(3);
    });

    it("should calculate score for mix of correct and incorrect answers", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [
          createQuestion({
            id: "q-1",
            options: [
              createOption({ id: "opt-1", is_correct: true }),
              createOption({ id: "opt-2", is_correct: false }),
            ],
          }),
          createQuestion({
            id: "q-2",
            options: [
              createOption({ id: "opt-3", is_correct: false, question_id: "q-2" }),
              createOption({ id: "opt-4", is_correct: true, question_id: "q-2" }),
            ],
          }),
        ],
      });
      const userAnswers = {
        "q-1": ["opt-1"], // Correct
        "q-2": ["opt-3"], // Incorrect
      };

      // Act
      const score = calculateScore(quiz, userAnswers);

      // Assert
      expect(score).toBe(1);
    });

    it("should handle missing answers for some questions", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [
          createQuestion({
            id: "q-1",
            options: [createOption({ id: "opt-1", is_correct: true })],
          }),
          createQuestion({
            id: "q-2",
            options: [createOption({ id: "opt-2", is_correct: true, question_id: "q-2" })],
          }),
        ],
      });
      const userAnswers = {
        "q-1": ["opt-1"], // Answered correctly
        // q-2 not answered
      };

      // Act
      const score = calculateScore(quiz, userAnswers);

      // Assert
      expect(score).toBe(1);
    });
  });
});

describe("getOptionLetter", () => {
  it("should convert 0 to 'A'", () => {
    expect(getOptionLetter(0)).toBe("A");
  });

  it("should convert 1 to 'B'", () => {
    expect(getOptionLetter(1)).toBe("B");
  });

  it("should convert 2 to 'C'", () => {
    expect(getOptionLetter(2)).toBe("C");
  });

  it("should convert 25 to 'Z'", () => {
    expect(getOptionLetter(25)).toBe("Z");
  });

  it("should handle positions beyond Z", () => {
    // 26 = '[', 27 = '\', etc. (ASCII characters after Z)
    expect(getOptionLetter(26)).toBe("[");
    expect(getOptionLetter(27)).toBe("\\");
  });

  it("should handle negative positions", () => {
    // -1 = '@' (ASCII 64), -2 = '?' (ASCII 63)
    expect(getOptionLetter(-1)).toBe("@");
  });
});

describe("isAnswerComplete", () => {
  it("should return true when question has selected options", () => {
    // Arrange
    const userAnswers = { "q-1": ["opt-1"] };

    // Act
    const result = isAnswerComplete(userAnswers, "q-1");

    // Assert
    expect(result).toBe(true);
  });

  it("should return true when question has multiple selected options", () => {
    // Arrange
    const userAnswers = { "q-1": ["opt-1", "opt-2", "opt-3"] };

    // Act
    const result = isAnswerComplete(userAnswers, "q-1");

    // Assert
    expect(result).toBe(true);
  });

  it("should return false when question has empty array", () => {
    // Arrange
    const userAnswers = { "q-1": [] };

    // Act
    const result = isAnswerComplete(userAnswers, "q-1");

    // Assert
    expect(result).toBe(false);
  });

  it("should return false when question is not in userAnswers", () => {
    // Arrange
    const userAnswers = { "q-1": ["opt-1"] };

    // Act
    const result = isAnswerComplete(userAnswers, "q-2");

    // Assert
    expect(result).toBe(false);
  });

  it("should return false when userAnswers is empty object", () => {
    // Arrange
    const userAnswers = {};

    // Act
    const result = isAnswerComplete(userAnswers, "q-1");

    // Assert
    expect(result).toBe(false);
  });

  it("should handle undefined value gracefully", () => {
    // Arrange
    const userAnswers = { "q-1": undefined as unknown as string[] };

    // Act
    const result = isAnswerComplete(userAnswers, "q-1");

    // Assert
    expect(result).toBe(false);
  });

  it("should handle null value gracefully", () => {
    // Arrange
    const userAnswers = { "q-1": null as unknown as string[] };

    // Act
    const result = isAnswerComplete(userAnswers, "q-1");

    // Assert
    expect(result).toBe(false);
  });

  it("should handle non-array value gracefully", () => {
    // Arrange
    const userAnswers = { "q-1": "not-an-array" as unknown as string[] };

    // Act
    const result = isAnswerComplete(userAnswers, "q-1");

    // Assert
    expect(result).toBe(false);
  });
});

describe("getAnsweredCount", () => {
  it("should return 0 for empty userAnswers", () => {
    // Arrange
    const userAnswers = {};

    // Act
    const count = getAnsweredCount(userAnswers);

    // Assert
    expect(count).toBe(0);
  });

  it("should count single answered question", () => {
    // Arrange
    const userAnswers = { "q-1": ["opt-1"] };

    // Act
    const count = getAnsweredCount(userAnswers);

    // Assert
    expect(count).toBe(1);
  });

  it("should count multiple answered questions", () => {
    // Arrange
    const userAnswers = {
      "q-1": ["opt-1"],
      "q-2": ["opt-2"],
      "q-3": ["opt-3", "opt-4"],
    };

    // Act
    const count = getAnsweredCount(userAnswers);

    // Assert
    expect(count).toBe(3);
  });

  it("should not count questions with empty arrays", () => {
    // Arrange
    const userAnswers = {
      "q-1": ["opt-1"],
      "q-2": [],
      "q-3": ["opt-3"],
    };

    // Act
    const count = getAnsweredCount(userAnswers);

    // Assert
    expect(count).toBe(2);
  });

  it("should not count questions with undefined values", () => {
    // Arrange
    const userAnswers = {
      "q-1": ["opt-1"],
      "q-2": undefined as unknown as string[],
      "q-3": ["opt-3"],
    };

    // Act
    const count = getAnsweredCount(userAnswers);

    // Assert
    expect(count).toBe(2);
  });

  it("should handle mix of complete and incomplete answers", () => {
    // Arrange
    const userAnswers = {
      "q-1": ["opt-1"],
      "q-2": [],
      "q-3": ["opt-3"],
      "q-4": undefined as unknown as string[],
      "q-5": ["opt-5", "opt-6"],
    };

    // Act
    const count = getAnsweredCount(userAnswers);

    // Assert
    expect(count).toBe(3);
  });
});

describe("areAllQuestionsAnswered", () => {
  describe("edge cases", () => {
    it("should return false for quiz with no questions property", () => {
      // Arrange
      const quiz = createQuiz({ questions: undefined });
      const userAnswers = {};

      // Act
      const result = areAllQuestionsAnswered(quiz, userAnswers);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for quiz with empty questions array", () => {
      // Arrange
      const quiz = createQuiz({ questions: [] });
      const userAnswers = {};

      // Act
      const result = areAllQuestionsAnswered(quiz, userAnswers);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when no answers provided", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [createQuestion({ id: "q-1" })],
      });
      const userAnswers = {};

      // Act
      const result = areAllQuestionsAnswered(quiz, userAnswers);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("single question", () => {
    it("should return true when single question is answered", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [createQuestion({ id: "q-1" })],
      });
      const userAnswers = { "q-1": ["opt-1"] };

      // Act
      const result = areAllQuestionsAnswered(quiz, userAnswers);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false when single question is not answered", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [createQuestion({ id: "q-1" })],
      });
      const userAnswers = { "q-1": [] };

      // Act
      const result = areAllQuestionsAnswered(quiz, userAnswers);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("multiple questions", () => {
    it("should return true when all questions are answered", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [createQuestion({ id: "q-1" }), createQuestion({ id: "q-2" }), createQuestion({ id: "q-3" })],
      });
      const userAnswers = {
        "q-1": ["opt-1"],
        "q-2": ["opt-2"],
        "q-3": ["opt-3"],
      };

      // Act
      const result = areAllQuestionsAnswered(quiz, userAnswers);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false when some questions are not answered", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [createQuestion({ id: "q-1" }), createQuestion({ id: "q-2" }), createQuestion({ id: "q-3" })],
      });
      const userAnswers = {
        "q-1": ["opt-1"],
        "q-2": [],
        "q-3": ["opt-3"],
      };

      // Act
      const result = areAllQuestionsAnswered(quiz, userAnswers);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when only first question is answered", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [createQuestion({ id: "q-1" }), createQuestion({ id: "q-2" }), createQuestion({ id: "q-3" })],
      });
      const userAnswers = {
        "q-1": ["opt-1"],
      };

      // Act
      const result = areAllQuestionsAnswered(quiz, userAnswers);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when only last question is answered", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [createQuestion({ id: "q-1" }), createQuestion({ id: "q-2" }), createQuestion({ id: "q-3" })],
      });
      const userAnswers = {
        "q-3": ["opt-3"],
      };

      // Act
      const result = areAllQuestionsAnswered(quiz, userAnswers);

      // Assert
      expect(result).toBe(false);
    });

    it("should return true when all questions have multiple options selected", () => {
      // Arrange
      const quiz = createQuiz({
        questions: [createQuestion({ id: "q-1" }), createQuestion({ id: "q-2" })],
      });
      const userAnswers = {
        "q-1": ["opt-1", "opt-2"],
        "q-2": ["opt-3", "opt-4", "opt-5"],
      };

      // Act
      const result = areAllQuestionsAnswered(quiz, userAnswers);

      // Assert
      expect(result).toBe(true);
    });
  });
});
