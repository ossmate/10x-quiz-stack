import type { QuestionWithOptionsDTO } from "../../types.ts";
import { QuestionCard } from "./QuestionCard.tsx";

interface QuizQuestionsProps {
  questions: QuestionWithOptionsDTO[];
  showCorrectAnswers: boolean;
  className?: string;
}

/**
 * Container component that renders the list of questions
 * Questions are displayed in an ordered list with proper semantic structure
 */
export function QuizQuestions({ questions, showCorrectAnswers, className }: QuizQuestionsProps) {
  // Sort questions by position to ensure correct ordering
  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position);

  return (
    <div className={className}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions</h2>

      <ol className="space-y-6">
        {sortedQuestions.map((question, index) => (
          <li key={question.id}>
            <QuestionCard question={question} questionNumber={index + 1} showCorrectAnswers={showCorrectAnswers} />
          </li>
        ))}
      </ol>
    </div>
  );
}
