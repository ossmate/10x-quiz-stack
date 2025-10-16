import type { QuizDetailDTO } from "../../types";
import type { ReactNode } from "react";

interface QuizPreviewProps {
  quiz: QuizDetailDTO;
  actions?: ReactNode;
  showCorrectAnswers?: boolean;
  className?: string;
}

/**
 * QuizPreview - Read-only preview component displaying quiz content with
 * customizable action buttons. Designed for reuse across AI generation,
 * manual creation, and quiz browsing features.
 */
export function QuizPreview({ quiz, actions, showCorrectAnswers = false, className = "" }: QuizPreviewProps) {
  if (!quiz) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quiz Header */}
      <div className="border-b border-border pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{quiz.title}</h2>
            {quiz.description && <p className="mt-2 text-muted-foreground">{quiz.description}</p>}
          </div>

          {/* Quiz Metadata Badges */}
          <div className="flex space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {quiz.visibility}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
              {quiz.questions?.length || 0} questions
            </span>
            {quiz.source === "ai_generated" && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/20 text-accent-foreground">
                AI Generated
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {quiz.questions && quiz.questions.length > 0 ? (
          quiz.questions.map((question, questionIndex) => (
            <div key={question.id} className="bg-card border border-border rounded-lg p-4 shadow-sm">
              <div className="flex items-start">
                <span className="flex-shrink-0 bg-primary/10 text-primary font-medium rounded-full w-8 h-8 flex items-center justify-center mr-3">
                  {questionIndex + 1}
                </span>
                <div className="flex-grow">
                  <h3 className="text-lg font-medium text-foreground">{question.content}</h3>

                  {/* Answer Options */}
                  <div className="mt-3 space-y-2">
                    {question.options &&
                      question.options.map((option) => (
                        <div
                          key={option.id}
                          className={`flex items-center p-3 border rounded-md ${
                            showCorrectAnswers && option.is_correct
                              ? "border-accent bg-accent/10"
                              : "border-border hover:bg-accent/5"
                          }`}
                        >
                          <span className="mr-3 flex items-center justify-center w-5 h-5 border border-border rounded-full">
                            {/* Display appropriate icon or letter for answer option */}
                            {String.fromCharCode(65 + option.position)}
                          </span>

                          <span className="flex-grow text-foreground">{option.content}</span>

                          {/* Correct Answer Indicator */}
                          {showCorrectAnswers && option.is_correct && (
                            <span className="flex-shrink-0 ml-3 text-accent-foreground">✓ Correct</span>
                          )}
                        </div>
                      ))}
                  </div>

                  {/* Explanation (if available) */}
                  {question.explanation && showCorrectAnswers && (
                    <div className="mt-4 p-3 bg-muted border border-border rounded-md">
                      <h4 className="text-sm font-medium text-foreground">Explanation:</h4>
                      <p className="text-sm text-muted-foreground">{question.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">This quiz doesn't contain any questions yet.</div>
        )}
      </div>

      {/* Action Buttons */}
      {actions && <div className="pt-4 border-t border-border">{actions}</div>}
    </div>
  );
}
