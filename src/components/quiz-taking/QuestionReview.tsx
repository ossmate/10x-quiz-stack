import type { QuizDetailDTO } from "../../types";
import { QuestionReviewCard } from "./QuestionReviewCard";
import { cn } from "@/lib/utils";

interface QuestionReviewProps {
  quiz: QuizDetailDTO;
  userAnswers: Record<string, string[]>;
  className?: string;
}

/**
 * Displays detailed review of all questions with user answers and correct answers
 * Shows which questions were answered correctly or incorrectly
 */
export function QuestionReview({ quiz, userAnswers, className }: QuestionReviewProps) {
  if (!quiz.questions || quiz.questions.length === 0) {
    return null;
  }

  return (
    <div className={cn("mb-8", className)}>
      <h3 className="text-2xl font-bold mb-6">Review Your Answers</h3>
      <div className="space-y-6">
        {quiz.questions.map((question, index) => {
          const userSelectedIds = userAnswers[question.id] || [];
          const correctOptionIds = question.options.filter((opt) => opt.is_correct).map((opt) => opt.id);

          // Check if answer is correct
          const isCorrect =
            userSelectedIds.length === correctOptionIds.length &&
            userSelectedIds.every((id) => correctOptionIds.includes(id));

          return (
            <QuestionReviewCard
              key={question.id}
              question={question}
              questionNumber={index + 1}
              userSelectedOptionIds={userSelectedIds}
              isCorrect={isCorrect}
            />
          );
        })}
      </div>
    </div>
  );
}
