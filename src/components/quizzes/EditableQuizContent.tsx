import { useState, useEffect } from "react";
import type { QuizDetailDTO, QuestionWithOptionsDTO, OptionDTO, QuizUpdateDTO } from "../../types";

// Interface for component props
interface EditableQuizContentProps {
  quiz: QuizDetailDTO;
  onSave: (updatedQuiz: QuizUpdateDTO) => void;
  onCancel: () => void;
  saveButtonText?: string;
  cancelButtonText?: string;
  className?: string;
}

// Interface for editable quiz state with validation
interface EditableQuizData extends QuizDetailDTO {
  isDirty: boolean;
  validationErrors: {
    title?: string;
    description?: string;
    questions?: Record<
      string,
      {
        content?: string;
        options?: Record<string, string>;
      }
    >;
    general?: string[];
  };
}

/**
 * EditableQuizContent - Comprehensive editing interface for quiz content
 * with real-time validation
 */
export function EditableQuizContent({
  quiz,
  onSave,
  onCancel,
  saveButtonText = "Save Changes",
  cancelButtonText = "Cancel",
  className = "",
}: EditableQuizContentProps) {
  // Initialize editable quiz state with the provided quiz
  const [editableQuiz, setEditableQuiz] = useState<EditableQuizData>(() => ({
    ...quiz,
    isDirty: false,
    validationErrors: {},
  }));

  // State for tracking overall form validity
  const [isValid, setIsValid] = useState(true);

  // Validate quiz on any changes
  useEffect(() => {
    validateQuiz();
  }, [editableQuiz.title, editableQuiz.description, editableQuiz.questions]);

  // Validate the entire quiz and update validation state
  const validateQuiz = () => {
    const errors: EditableQuizData["validationErrors"] = {};

    // Validate title
    if (!editableQuiz.title || editableQuiz.title.trim().length === 0) {
      errors.title = "Quiz title is required";
    } else if (editableQuiz.title.length > 200) {
      errors.title = "Quiz title must be 200 characters or less";
    }

    // Validate description
    if (editableQuiz.description && editableQuiz.description.length > 1000) {
      errors.description = "Quiz description must be 1000 characters or less";
    }

    // Validate questions
    if (!editableQuiz.questions || editableQuiz.questions.length === 0) {
      errors.general = [...(errors.general || []), "Quiz must have at least one question"];
    } else {
      errors.questions = {};

      // Validate each question
      editableQuiz.questions.forEach((question) => {
        const questionErrors: {
          content?: string;
          options?: Record<string, string>;
        } = {};

        // Validate question content
        if (!question.content || question.content.trim().length === 0) {
          questionErrors.content = "Question content is required";
        }

        // Validate options
        if (!question.options || question.options.length < 2) {
          questionErrors.content = "Question must have at least 2 options";
        } else {
          // Check if exactly one option is marked as correct
          const correctOptionsCount = question.options.filter((opt) => opt.is_correct).length;
          if (correctOptionsCount !== 1) {
            questionErrors.content = "Question must have exactly one correct answer";
          }

          // Validate individual options
          question.options.forEach((option) => {
            if (!option.content || option.content.trim().length === 0) {
              if (!questionErrors.options) questionErrors.options = {};
              questionErrors.options[option.id] = "Option content is required";
            }
          });
        }

        // Add question errors to the errors object if any exist
        if (questionErrors.content || questionErrors.options) {
          errors.questions[question.id] = questionErrors;
        }
      });

      // Remove questions object if no errors
      if (Object.keys(errors.questions).length === 0) {
        delete errors.questions;
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
  };

  // Handle saving the quiz
  const handleSave = () => {
    if (!validateQuiz()) return;

    // Create update DTO from editable quiz
    const updatedQuiz: QuizUpdateDTO = {
      title: editableQuiz.title,
      description: editableQuiz.description || "",
      visibility: editableQuiz.visibility,
      source: editableQuiz.source,
      ai_model: editableQuiz.ai_model,
      ai_prompt: editableQuiz.ai_prompt,
      ai_temperature: editableQuiz.ai_temperature,
    };

    onSave(updatedQuiz);
  };

  // Update quiz metadata fields
  const updateMetadata = (field: keyof QuizUpdateDTO, value: string | number) => {
    setEditableQuiz((prev) => ({
      ...prev,
      [field]: value,
      isDirty: true,
    }));
  };

  // Update a question
  const updateQuestion = (questionId: string, field: string, value: string) => {
    setEditableQuiz((prev) => ({
      ...prev,
      questions: prev.questions?.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)) || [],
      isDirty: true,
    }));
  };

  // Update an option
  const updateOption = (questionId: string, optionId: string, field: string, value: any) => {
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
  };

  // Add a new question
  const addQuestion = () => {
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
  };

  // Remove a question
  const removeQuestion = (questionId: string) => {
    setEditableQuiz((prev) => ({
      ...prev,
      questions: prev.questions?.filter((q) => q.id !== questionId) || [],
      isDirty: true,
    }));
  };

  // Add an option to a question
  const addOption = (questionId: string) => {
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
        prev.questions?.map((q) => (q.id === questionId ? { ...q, options: [...(q.options || []), newOption] } : q)) ||
        [],
      isDirty: true,
    }));
  };

  // Remove an option from a question
  const removeOption = (questionId: string, optionId: string) => {
    setEditableQuiz((prev) => ({
      ...prev,
      questions:
        prev.questions?.map((q) =>
          q.id === questionId ? { ...q, options: q.options?.filter((o) => o.id !== optionId) || [] } : q
        ) || [],
      isDirty: true,
    }));
  };

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="space-y-6">
        {/* Quiz Metadata Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quiz Details</h2>

          {/* Title Field */}
          <div className="mb-4">
            <label htmlFor="quiz-title" className="block text-sm font-medium text-gray-700 mb-1">
              Quiz Title*
            </label>
            <input
              id="quiz-title"
              type="text"
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                editableQuiz.validationErrors.title ? "border-red-300" : ""
              }`}
              value={editableQuiz.title}
              onChange={(e) => updateMetadata("title", e.target.value)}
              maxLength={200}
            />
            {editableQuiz.validationErrors.title && (
              <p className="mt-1 text-sm text-red-600">{editableQuiz.validationErrors.title}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">{editableQuiz.title?.length || 0}/200 characters</p>
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="quiz-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="quiz-description"
              rows={3}
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                editableQuiz.validationErrors.description ? "border-red-300" : ""
              }`}
              value={editableQuiz.description || ""}
              onChange={(e) => updateMetadata("description", e.target.value)}
              maxLength={1000}
            />
            {editableQuiz.validationErrors.description && (
              <p className="mt-1 text-sm text-red-600">{editableQuiz.validationErrors.description}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">{editableQuiz.description?.length || 0}/1000 characters</p>
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Questions</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Question
            </button>
          </div>

          {/* General validation errors */}
          {editableQuiz.validationErrors.general && editableQuiz.validationErrors.general.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <ul className="list-disc list-inside text-sm text-red-600">
                {editableQuiz.validationErrors.general.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-6">
            {editableQuiz.questions && editableQuiz.questions.length > 0 ? (
              editableQuiz.questions.map((question, questionIndex) => {
                const questionErrors = editableQuiz.validationErrors.questions?.[question.id];

                return (
                  <div key={question.id} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    {/* Question Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className="bg-blue-100 text-blue-800 font-medium rounded-full w-6 h-6 flex items-center justify-center mr-2">
                          {questionIndex + 1}
                        </span>
                        <h3 className="text-sm font-medium text-gray-900">Question</h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Question Content */}
                    <div className="mb-4">
                      <textarea
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                          questionErrors?.content ? "border-red-300" : ""
                        }`}
                        value={question.content}
                        onChange={(e) => updateQuestion(question.id, "content", e.target.value)}
                        rows={2}
                      />
                      {questionErrors?.content && <p className="mt-1 text-sm text-red-600">{questionErrors.content}</p>}
                    </div>

                    {/* Question Options */}
                    <div className="space-y-3 mb-4">
                      <label className="block text-sm font-medium text-gray-700">Answer Options</label>

                      {question.options &&
                        question.options.map((option) => {
                          const optionError = questionErrors?.options?.[option.id];

                          return (
                            <div key={option.id} className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name={`question-${question.id}-correct`}
                                checked={option.is_correct}
                                onChange={() => {
                                  // Update correct answer (set all others to false)
                                  question.options?.forEach((o) => {
                                    updateOption(question.id, o.id, "is_correct", o.id === option.id);
                                  });
                                }}
                                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-grow">
                                <input
                                  type="text"
                                  value={option.content}
                                  onChange={(e) => updateOption(question.id, option.id, "content", e.target.value)}
                                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                                    optionError ? "border-red-300" : ""
                                  }`}
                                />
                                {optionError && <p className="mt-1 text-sm text-red-600">{optionError}</p>}
                              </div>
                              {question.options && question.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(question.id, option.id)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          );
                        })}

                      {/* Add Option Button */}
                      <button
                        type="button"
                        onClick={() => addOption(question.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Add Option
                      </button>
                    </div>

                    {/* Explanation Field */}
                    <div>
                      <label
                        htmlFor={`explanation-${question.id}`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Explanation (Optional)
                      </label>
                      <textarea
                        id={`explanation-${question.id}`}
                        rows={2}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={question.explanation || ""}
                        onChange={(e) => updateQuestion(question.id, "explanation", e.target.value)}
                        placeholder="Explain why the correct answer is correct..."
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-md bg-gray-50">
                <p className="text-gray-500">No questions yet. Click "Add Question" to create your first question.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          {cancelButtonText}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid || !editableQuiz.isDirty}
          className={`px-4 py-2 rounded-md text-white ${
            isValid && editableQuiz.isDirty
              ? "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              : "bg-blue-400 cursor-not-allowed"
          }`}
        >
          {saveButtonText}
        </button>
      </div>
    </div>
  );
}
