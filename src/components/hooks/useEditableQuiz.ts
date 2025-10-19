import { useState, useCallback, useEffect } from "react";
import type { QuizDetailDTO, EditableQuizData, QuestionWithOptionsDTO, OptionDTO, QuizUpdateDTO } from "../../types";

/**
 * Custom hook for managing editable quiz state
 * Handles validation, state updates, and form management
 */
export function useEditableQuiz(initialQuiz: QuizDetailDTO) {
  // Transform the initial quiz into editable format with validation state
  const [editableQuiz, setEditableQuiz] = useState<EditableQuizData>(() => ({
    ...initialQuiz,
    isDirty: false,
    validationErrors: {},
  }));

  // Track overall form validity
  const [isValid, setIsValid] = useState(true);

  // Validate quiz when any critical fields change
  useEffect(() => {
    validateQuiz();
  }, [editableQuiz.title, editableQuiz.description, editableQuiz.questions]);

  /**
   * Validate the entire quiz content and update validation state
   * @returns Boolean indicating whether the quiz is valid
   */
  const validateQuiz = useCallback(() => {
    const errors: EditableQuizData["validationErrors"] = {};

    // Validate title (required, max 200 chars)
    if (!editableQuiz.title || editableQuiz.title.trim().length === 0) {
      errors.title = "Quiz title is required";
    } else if (editableQuiz.title.length > 200) {
      errors.title = "Quiz title must be 200 characters or less";
    }

    // Validate description (optional, max 1000 chars)
    if (editableQuiz.description && editableQuiz.description.length > 1000) {
      errors.description = "Quiz description must be 1000 characters or less";
    }

    // Validate questions
    if (!editableQuiz.questions || editableQuiz.questions.length === 0) {
      errors.general = ["Quiz must have at least one question"];
    } else {
      const questionErrors: Record<
        string,
        {
          content?: string;
          options?: Record<string, string>;
        }
      > = {};

      // Validate each question
      editableQuiz.questions.forEach((question) => {
        const currentQuestionErrors: {
          content?: string;
          options?: Record<string, string>;
        } = {};

        // Validate question content
        if (!question.content || question.content.trim().length === 0) {
          currentQuestionErrors.content = "Question content is required";
        } else if (question.content.length > 500) {
          currentQuestionErrors.content = "Question content must be 500 characters or less";
        }

        // Validate options (min 2, exactly 1 correct)
        if (!question.options || question.options.length < 2) {
          currentQuestionErrors.content = "Question must have at least 2 options";
        } else {
          // Check for exactly one correct answer
          const correctOptionsCount = question.options.filter((opt) => opt.is_correct).length;
          if (correctOptionsCount !== 1) {
            currentQuestionErrors.content = "Question must have exactly one correct answer";
          }

          // Validate individual options
          const optionErrors: Record<string, string> = {};

          question.options.forEach((option) => {
            if (!option.content || option.content.trim().length === 0) {
              optionErrors[option.id] = "Option content is required";
            } else if (option.content.length > 200) {
              optionErrors[option.id] = "Option content must be 200 characters or less";
            }
          });

          // Add option errors if any exist
          if (Object.keys(optionErrors).length > 0) {
            currentQuestionErrors.options = optionErrors;
          }
        }

        // Add question errors to the errors object if any exist
        if (currentQuestionErrors.content || currentQuestionErrors.options) {
          questionErrors[question.id] = currentQuestionErrors;
        }
      });

      // Add questions errors if any exist
      if (Object.keys(questionErrors).length > 0) {
        errors.questions = questionErrors;
      }
    }

    // Update validation state
    setEditableQuiz((prev) => ({
      ...prev,
      validationErrors: errors,
    }));

    // Check if form is valid (no errors)
    const hasErrors =
      !!errors.title ||
      !!errors.description ||
      (errors.general && errors.general.length > 0) ||
      (errors.questions && Object.keys(errors.questions).length > 0);

    setIsValid(!hasErrors);

    return !hasErrors;
  }, [editableQuiz]);

  /**
   * Update a quiz metadata field
   */
  const updateQuizField = useCallback((field: keyof QuizUpdateDTO, value: string | number | boolean) => {
    setEditableQuiz((prev) => ({
      ...prev,
      [field]: value,
      isDirty: true,
    }));
  }, []);

  /**
   * Update a question field
   */
  const updateQuestionField = useCallback((questionId: string, field: string, value: string) => {
    setEditableQuiz((prev) => ({
      ...prev,
      questions: prev.questions?.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)) || [],
      isDirty: true,
    }));
  }, []);

  /**
   * Update an option field
   */
  const updateOptionField = useCallback((questionId: string, optionId: string, field: string, value: any) => {
    setEditableQuiz((prev) => ({
      ...prev,
      questions:
        prev.questions?.map((q) =>
          q.id === questionId
            ? {
                ...q,
                options: q.options?.map((o) => (o.id === optionId ? { ...o, [field]: value } : o)) || [],
              }
            : q
        ) || [],
      isDirty: true,
    }));
  }, []);

  /**
   * Add a new question to the quiz
   */
  const addQuestion = useCallback(() => {
    // Generate a temporary ID for the new question
    const newQuestionId = `new-question-${Date.now()}`;

    // Create default options
    const defaultOptions: OptionDTO[] = [
      {
        id: `new-option-${Date.now()}-1`,
        question_id: newQuestionId,
        content: "Option 1",
        is_correct: true,
        position: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: `new-option-${Date.now()}-2`,
        question_id: newQuestionId,
        content: "Option 2",
        is_correct: false,
        position: 1,
        created_at: new Date().toISOString(),
      },
    ];

    // Create new question with default values
    const newQuestion: QuestionWithOptionsDTO = {
      id: newQuestionId,
      quiz_id: editableQuiz.id,
      content: "New question",
      position: editableQuiz.questions?.length || 0,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      options: defaultOptions,
    };

    // Add question to the quiz
    setEditableQuiz((prev) => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion],
      isDirty: true,
    }));
  }, [editableQuiz.id, editableQuiz.questions?.length]);

  /**
   * Remove a question from the quiz
   */
  const removeQuestion = useCallback((questionId: string) => {
    setEditableQuiz((prev) => ({
      ...prev,
      questions:
        prev.questions
          ?.filter((q) => q.id !== questionId)
          .map((q, idx) => ({
            ...q,
            position: idx, // Update positions after removal
          })) || [],
      isDirty: true,
    }));
  }, []);

  /**
   * Add an option to a question
   */
  const addOption = useCallback(
    (questionId: string) => {
      const question = editableQuiz.questions?.find((q) => q.id === questionId);
      if (!question) return;

      // Create new option
      const newOption: OptionDTO = {
        id: `new-option-${Date.now()}`,
        question_id: questionId,
        content: "New option",
        is_correct: false,
        position: question.options?.length || 0,
        created_at: new Date().toISOString(),
      };

      // Add option to the question
      setEditableQuiz((prev) => ({
        ...prev,
        questions:
          prev.questions?.map((q) =>
            q.id === questionId ? { ...q, options: [...(q.options || []), newOption] } : q
          ) || [],
        isDirty: true,
      }));
    },
    [editableQuiz.questions]
  );

  /**
   * Remove an option from a question
   */
  const removeOption = useCallback((questionId: string, optionId: string) => {
    setEditableQuiz((prev) => ({
      ...prev,
      questions:
        prev.questions?.map((q) =>
          q.id === questionId
            ? {
                ...q,
                options:
                  q.options
                    ?.filter((o) => o.id !== optionId)
                    .map((o, idx) => ({
                      ...o,
                      position: idx, // Update positions after removal
                    })) || [],
              }
            : q
        ) || [],
      isDirty: true,
    }));
  }, []);

  /**
   * Prepare quiz data for saving
   * @returns Quiz update data if valid, null otherwise
   */
  const prepareForSave = useCallback((): QuizUpdateDTO | null => {
    if (!validateQuiz()) return null;

    // Create update DTO from editable quiz
    const updatedQuiz: QuizUpdateDTO = {
      title: editableQuiz.title,
      description: editableQuiz.description || "",
      source: editableQuiz.source,
      ai_model: editableQuiz.ai_model,
      ai_prompt: editableQuiz.ai_prompt,
      ai_temperature: editableQuiz.ai_temperature,
    };

    return updatedQuiz;
  }, [editableQuiz, validateQuiz]);

  /**
   * Reset the quiz to its initial state
   */
  const resetQuiz = useCallback(() => {
    setEditableQuiz({
      ...initialQuiz,
      isDirty: false,
      validationErrors: {},
    });
    setIsValid(true);
  }, [initialQuiz]);

  return {
    editableQuiz,
    isValid,
    updateQuizField,
    updateQuestionField,
    updateOptionField,
    addQuestion,
    removeQuestion,
    addOption,
    removeOption,
    prepareForSave,
    resetQuiz,
  };
}
