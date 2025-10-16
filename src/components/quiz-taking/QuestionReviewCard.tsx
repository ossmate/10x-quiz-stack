import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QuestionWithOptionsDTO } from "../../types";

interface QuestionReviewCardProps {
  question: QuestionWithOptionsDTO;
  questionNumber: number;
  userSelectedOptionIds: string[];
  isCorrect: boolean;
}

/**
 * Displays a single question review card
 * Shows question, user's answer, correct answer, and explanation
 */
export function QuestionReviewCard({
  question,
  questionNumber,
  userSelectedOptionIds,
  isCorrect,
}: QuestionReviewCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 flex-1">
          <Badge variant="outline" className="shrink-0">
            Q{questionNumber}
          </Badge>
          <p className="flex-1 font-medium">{question.content}</p>
        </div>
        <Badge variant={isCorrect ? "default" : "destructive"} className="shrink-0">
          {isCorrect ? (
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Correct
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Incorrect
            </span>
          )}
        </Badge>
      </div>

      {/* Options Review */}
      <div className="space-y-2">
        {question.options
          .sort((a, b) => a.position - b.position)
          .map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            const isUserAnswer = userSelectedOptionIds.includes(option.id);
            const isCorrectAnswer = option.is_correct;

            return (
              <div
                key={option.id}
                className={cn("p-3 rounded-lg border-2", {
                  "border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800": isUserAnswer && !isCorrectAnswer,
                  "border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800":
                    isCorrectAnswer || (isUserAnswer && isCorrectAnswer),
                  "border-border bg-background": !isUserAnswer && !isCorrectAnswer,
                })}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn("font-semibold shrink-0", {
                      "text-red-600 dark:text-red-400": isUserAnswer && !isCorrectAnswer,
                      "text-green-600 dark:text-green-400": isCorrectAnswer,
                      "text-muted-foreground": !isUserAnswer && !isCorrectAnswer,
                    })}
                  >
                    {letter}.
                  </span>
                  <span className="flex-1">{option.content}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {isUserAnswer && (
                      <span className="text-xs text-muted-foreground px-2 py-1 bg-background rounded">Your answer</span>
                    )}
                    {isCorrectAnswer && (
                      <svg
                        className="h-5 w-5 text-green-600 dark:text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Explanation */}
      {question.explanation && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm font-semibold mb-1 text-blue-900 dark:text-blue-100">Explanation:</p>
          <p className="text-sm text-blue-800 dark:text-blue-200">{question.explanation}</p>
        </div>
      )}
    </Card>
  );
}
