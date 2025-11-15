import { useState, useEffect, useRef, useCallback } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import type { QuizDetailDTO, QuestionWithOptionsDTO, OptionDTO, QuizUpdateDTO } from "../../types";
import { useStickyFooter } from "../hooks/ui/useStickyFooter";

// Interface for component props
interface EditableQuizContentProps {
  quiz: QuizDetailDTO;
  onSave: (updatedQuiz: QuizUpdateDTO) => void;
  onCancel: () => void;
  onChange?: (updatedQuiz: QuizDetailDTO) => void;
  saveButtonText?: string;
  cancelButtonText?: string;
  className?: string;
  isPublishing?: boolean;
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
  onChange,
  saveButtonText = "Save Changes",
  cancelButtonText = "Cancel",
  className = "",
  isPublishing = false,
}: EditableQuizContentProps) {
  // Initialize editable quiz state with the provided quiz
  const [editableQuiz, setEditableQuiz] = useState<EditableQuizData>(() => ({
    ...quiz,
    isDirty: false,
    validationErrors: {},
  }));

  // State for tracking overall form validity
  const [isValid, setIsValid] = useState(true);

  // Sticky footer behavior using IntersectionObserver
  const { isSticky: isFooterSticky, sentinelRef } = useStickyFooter();

  // Accordion open state – list of open question IDs
  const [openIds, setOpenIds] = useState<string[]>([]);

  // Ref to store references to question elements for scrolling
  const questionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // State to track the newly added question for highlighting
  const [highlightedQuestionId, setHighlightedQuestionId] = useState<string | null>(null);

  // Scroll newly highlighted question into view and open accordion
  useEffect(() => {
    if (highlightedQuestionId) {
      // Open accordion for that question first
      setOpenIds([highlightedQuestionId]);

      // Wait for accordion animation to complete before scrolling
      const scrollTimer = setTimeout(() => {
        const el = questionRefs.current.get(highlightedQuestionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);

      // Clear highlight after animation completes
      const highlightTimer = setTimeout(() => {
        setHighlightedQuestionId(null);
      }, 2000);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(highlightTimer);
      };
    }
  }, [highlightedQuestionId]);

  // Validate the entire quiz and update validation state
  const validateQuiz = useCallback(() => {
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
        } else if (question.content.trim() === "New question") {
          questionErrors.content = "Please edit the question text (default placeholder is not allowed)";
        }

        // Count non-empty options (after trimming)
        const nonEmptyOptions = question.options?.filter((opt) => opt.content && opt.content.trim().length > 0) || [];

        // Validate options
        if (!question.options || question.options.length < 2) {
          questionErrors.content = "Question must have at least 2 options";
        } else if (nonEmptyOptions.length < 2) {
          questionErrors.content = "Question must have at least 2 non-empty options";
        } else {
          // Check if exactly one non-empty option is marked as correct
          const correctOptionsCount = nonEmptyOptions.filter((opt) => opt.is_correct).length;
          if (correctOptionsCount !== 1) {
            questionErrors.content = "Question must have exactly one correct answer";
          }

          // Validate individual options
          question.options.forEach((option) => {
            const trimmedContent = option.content?.trim() || "";
            if (!trimmedContent) {
              if (!questionErrors.options) questionErrors.options = {};
              questionErrors.options[option.id] = "Option content is required";
            } else if (/^(Option \d+|New option)$/i.test(trimmedContent)) {
              if (!questionErrors.options) questionErrors.options = {};
              questionErrors.options[option.id] = "Please edit the option text (default placeholder is not allowed)";
            }
          });
        }

        // Add question errors to the errors object if any exist
        if (questionErrors.content || questionErrors.options) {
          if (!errors.questions) errors.questions = {};
          errors.questions[question.id] = questionErrors;
        }
      });

      // Remove questions object if no errors
      if (errors.questions && Object.keys(errors.questions).length === 0) {
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
  }, [editableQuiz]);

  // Validate quiz on any changes
  useEffect(() => {
    validateQuiz();
  }, [validateQuiz]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange(editableQuiz);
    }
  }, [onChange, editableQuiz]);

  // Sanitize quiz data before saving - remove empty options, questions, and placeholders
  const sanitizeQuizForSave = (quiz: EditableQuizData): EditableQuizData => {
    return {
      ...quiz,
      questions:
        quiz.questions
          ?.filter((question) => {
            const content = question.content?.trim() || "";
            // Filter out empty questions and placeholder text
            return content.length > 0 && content !== "New question";
          })
          .map((question) => ({
            ...question,
            // Filter out empty options and placeholder text
            options:
              question.options
                ?.filter((option) => {
                  const content = option.content?.trim() || "";
                  // Filter out empty options and placeholders like "Option 1", "Option 2", "New option"
                  return content.length > 0 && !/^(Option \d+|New option)$/i.test(content);
                })
                .map((option, index) => ({
                  ...option,
                  position: index + 1, // Reindex positions after filtering
                })) || [],
          }))
          .map((question, index) => ({
            ...question,
            position: index + 1, // Reindex question positions
          })) || [],
    };
  };

  // Handle saving the quiz
  const handleSave = () => {
    // Run validation first
    const isValidQuiz = validateQuiz();

    if (!isValidQuiz) {
      // Validation failed - do not proceed with save
      console.warn("Cannot save: Quiz has validation errors");
      return;
    }

    // Double-check: ensure we have at least one non-empty question before sanitizing
    const hasValidQuestions = editableQuiz.questions?.some((q) => q.content && q.content.trim().length > 0);

    if (!hasValidQuestions) {
      console.error("Cannot save: No valid questions found");
      return;
    }

    // Sanitize quiz data (remove empty options/questions)
    const sanitizedQuiz = sanitizeQuizForSave(editableQuiz);

    // Validate sanitized data - ensure we still have valid content after filtering
    if (!sanitizedQuiz.questions || sanitizedQuiz.questions.length === 0) {
      console.error("Cannot save: No valid questions after sanitization");
      return;
    }

    // Check each question has at least 2 options after sanitization
    const hasInvalidQuestion = sanitizedQuiz.questions.some((q) => !q.options || q.options.length < 2);

    if (hasInvalidQuestion) {
      console.error("Cannot save: Question has less than 2 valid options after sanitization");
      return;
    }

    // Create update DTO from sanitized quiz
    // Cast to QuizUpdateDTO but include the full quiz data (including questions)
    // This allows the component to be used for both metadata-only updates
    // and full quiz updates (creation/editing)
    const updatedQuiz: QuizUpdateDTO = {
      title: sanitizedQuiz.title.trim(),
      description: sanitizedQuiz.description?.trim() || "",
      source: sanitizedQuiz.source,
      ai_model: sanitizedQuiz.ai_model,
      ai_prompt: sanitizedQuiz.ai_prompt,
      ai_temperature: sanitizedQuiz.ai_temperature,
      // Pass the full sanitized quiz as additional property (consumers can cast to get questions)
      ...(sanitizedQuiz as unknown as Record<string, unknown>),
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
  const updateOption = (questionId: string, optionId: string, field: string, value: string | boolean) => {
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
    // Generate a temporary ID for the new question using UUID
    const newQuestionId = `new-question-${crypto.randomUUID()}`;

    // Create default options with unique IDs
    const defaultOptions: OptionDTO[] = [
      {
        id: `new-option-${crypto.randomUUID()}`,
        question_id: newQuestionId,
        content: "Option 1",
        is_correct: true,
        position: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: `new-option-${crypto.randomUUID()}`,
        question_id: newQuestionId,
        content: "Option 2",
        is_correct: false,
        position: 2,
        created_at: new Date().toISOString(),
      },
    ];

    // Create new question with default values
    const newQuestion: QuestionWithOptionsDTO = {
      id: newQuestionId,
      quiz_id: editableQuiz.id,
      content: "New question",
      position: (editableQuiz.questions?.length || 0) + 1,
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

    // Trigger highlight - useEffect will handle scrolling and accordion opening
    setHighlightedQuestionId(newQuestionId);
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

    // Create new option with unique UUID
    const newOption: OptionDTO = {
      id: `new-option-${crypto.randomUUID()}`,
      question_id: questionId,
      content: "New option",
      is_correct: false,
      position: (question.options?.length || 0) + 1,
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
    <div className={`space-y-8 ${isFooterSticky ? "pb-24" : ""} ${className}`}>
      <div className="space-y-6">
        {/* Quiz Metadata Section */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium text-foreground mb-4">Quiz Details</h2>

          {/* Title Field */}
          <div className="mb-4">
            <label htmlFor="quiz-title" className="block text-sm font-medium text-foreground mb-2">
              Quiz Title*
            </label>
            <input
              id="quiz-title"
              type="text"
              className={`block w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-base ${
                editableQuiz.validationErrors.title
                  ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                  : ""
              } ${isPublishing ? "opacity-60 cursor-not-allowed" : ""}`}
              value={editableQuiz.title}
              onChange={(e) => updateMetadata("title", e.target.value)}
              maxLength={200}
              disabled={isPublishing}
            />
            {editableQuiz.validationErrors.title && (
              <p className="mt-1 text-sm text-destructive">{editableQuiz.validationErrors.title}</p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">{editableQuiz.title?.length || 0}/200 characters</p>
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="quiz-description" className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              id="quiz-description"
              rows={4}
              className={`block w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-base resize-none ${
                editableQuiz.validationErrors.description
                  ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                  : ""
              } ${isPublishing ? "opacity-60 cursor-not-allowed" : ""}`}
              value={editableQuiz.description || ""}
              onChange={(e) => updateMetadata("description", e.target.value)}
              maxLength={1000}
              disabled={isPublishing}
            />
            {editableQuiz.validationErrors.description && (
              <p className="mt-1 text-sm text-destructive">{editableQuiz.validationErrors.description}</p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              {editableQuiz.description?.length || 0}/1000 characters
            </p>
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-foreground">Questions</h2>
            <button
              type="button"
              onClick={addQuestion}
              disabled={isPublishing}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Question
            </button>
          </div>

          {/* General validation errors */}
          {editableQuiz.validationErrors.general && editableQuiz.validationErrors.general.length > 0 && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
              <ul className="list-disc list-inside text-sm text-destructive">
                {editableQuiz.validationErrors.general.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions List */}
          <Accordion type="multiple" value={openIds} onValueChange={setOpenIds} className="space-y-4">
            {editableQuiz.questions && editableQuiz.questions.length > 0 ? (
              editableQuiz.questions.map((question, questionIndex) => {
                const questionErrors = editableQuiz.validationErrors.questions?.[question.id];
                const isHighlighted = highlightedQuestionId === question.id;

                return (
                  <AccordionItem
                    key={question.id}
                    value={question.id}
                    ref={(el) => {
                      if (el) {
                        questionRefs.current.set(question.id, el as HTMLDivElement);
                      } else {
                        questionRefs.current.delete(question.id);
                      }
                    }}
                    className={`border rounded-lg transition-shadow ${
                      isHighlighted ? "shadow-lg shadow-primary/20" : ""
                    }`}
                  >
                    <AccordionTrigger className="px-5 py-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="bg-primary/10 text-primary font-semibold rounded-full w-8 h-8 flex items-center justify-center text-sm shrink-0">
                          {questionIndex + 1}
                        </span>
                        <span className="text-base font-medium text-foreground truncate">
                          {question.content || `Question ${questionIndex + 1}`}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-6">
                      {/* Remove question button */}
                      <div className="flex justify-end mb-4">
                        <button
                          type="button"
                          onClick={() => removeQuestion(question.id)}
                          disabled={isPublishing}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Remove
                        </button>
                      </div>

                      {/* Question Content */}
                      <div className="mb-4">
                        <label
                          htmlFor={`question-content-${question.id}`}
                          className="block text-sm font-medium text-foreground mb-2"
                        >
                          Question Text
                        </label>
                        <textarea
                          id={`question-content-${question.id}`}
                          className={`block w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-base resize-none ${
                            questionErrors?.content
                              ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                              : ""
                          } ${isPublishing ? "opacity-60 cursor-not-allowed" : ""}`}
                          value={question.content}
                          onChange={(e) => updateQuestion(question.id, "content", e.target.value)}
                          rows={3}
                          disabled={isPublishing}
                          placeholder="Enter your question here..."
                        />
                        {questionErrors?.content && (
                          <p className="mt-1 text-sm text-destructive">{questionErrors.content}</p>
                        )}
                      </div>

                      {/* Question Options */}
                      <div className="space-y-3 mb-5">
                        <div className="block text-sm font-medium text-foreground mb-3">Answer Options</div>

                        {question.options &&
                          question.options.map((option, optionIndex) => {
                            const optionError = questionErrors?.options?.[option.id];

                            return (
                              <div
                                key={option.id}
                                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background/50 hover:bg-background transition-colors"
                              >
                                <div className="flex items-center pt-2.5">
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
                                    disabled={isPublishing}
                                    className="h-4 w-4 border-input text-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </div>
                                <div className="flex-grow">
                                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                    Option {optionIndex + 1}
                                  </label>
                                  <input
                                    type="text"
                                    value={option.content}
                                    onChange={(e) => updateOption(question.id, option.id, "content", e.target.value)}
                                    disabled={isPublishing}
                                    placeholder="Enter answer option..."
                                    className={`block w-full px-3 py-2 rounded-md border border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-sm ${
                                      optionError
                                        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                                        : ""
                                    } ${isPublishing ? "opacity-60 cursor-not-allowed" : ""}`}
                                  />
                                  {optionError && <p className="mt-1.5 text-xs text-destructive">{optionError}</p>}
                                </div>
                                {question.options && question.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOption(question.id, option.id)}
                                    disabled={isPublishing}
                                    className="mt-6 p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Remove option"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            );
                          })}

                        {/* Add Option Button */}
                        <button
                          type="button"
                          onClick={() => addOption(question.id)}
                          disabled={isPublishing}
                          className="inline-flex items-center gap-2 px-3 py-2 border border-border shadow-sm text-sm font-medium rounded-lg text-foreground bg-background hover:bg-accent/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Option
                        </button>
                      </div>

                      {/* Explanation Field */}
                      <div>
                        <label
                          htmlFor={`explanation-${question.id}`}
                          className="block text-sm font-medium text-foreground mb-2"
                        >
                          Explanation (Optional)
                        </label>
                        <textarea
                          id={`explanation-${question.id}`}
                          rows={3}
                          className={`block w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-sm resize-none ${
                            isPublishing ? "opacity-60 cursor-not-allowed" : ""
                          }`}
                          value={question.explanation || ""}
                          onChange={(e) => updateQuestion(question.id, "explanation", e.target.value)}
                          placeholder="Explain why the correct answer is correct (optional)..."
                          disabled={isPublishing}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })
            ) : (
              <div className="text-center py-8 border border-dashed border-border rounded-md bg-muted">
                <p className="text-muted-foreground">
                  No questions yet. Click &ldquo;Add Question&rdquo; to create your first question.
                </p>
              </div>
            )}
          </Accordion>
        </div>

        {/* Sentinel element to detect bottom of content */}
        <div ref={sentinelRef} className="h-1" />
      </div>

      {/* Footer with Action Buttons - sticky when scrolling, static at bottom */}
      <div
        className={`${
          isFooterSticky ? "fixed bottom-0 left-0 right-0 shadow-lg" : "relative"
        } bg-card border-t border-border z-10 transition-all duration-200`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center gap-3">
            {/* Left side - Add Question button */}
            <button
              type="button"
              onClick={addQuestion}
              disabled={isPublishing}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-border text-foreground bg-background hover:bg-accent/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Question
            </button>

            {/* Right side - Cancel and Save buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isPublishing}
                className="px-5 py-2.5 border border-border text-foreground rounded-lg hover:bg-accent/20 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelButtonText}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isValid || !editableQuiz.isDirty || isPublishing}
                className={`px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium text-sm transition-colors ${
                  isValid && editableQuiz.isDirty && !isPublishing
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm"
                    : "bg-primary/40 text-primary-foreground/60 cursor-not-allowed"
                }`}
              >
                {isPublishing ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {saveButtonText}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
