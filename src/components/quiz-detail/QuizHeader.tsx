import type { QuizDTO } from "../../types.ts";
import { QuizMetadata } from "./QuizMetadata.tsx";
import { QuizActions } from "./QuizActions.tsx";

interface QuizHeaderProps {
  quiz: QuizDTO;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStartQuiz: () => void;
}

/**
 * Header component for quiz detail view
 * Displays quiz title, description, metadata badges, and action buttons
 */
export function QuizHeader({ quiz, isOwner, onEdit, onDelete, onStartQuiz }: QuizHeaderProps) {
  return (
    <header className="border-b pb-6">
      {/* Title and Description */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
        {quiz.description && <p className="text-lg text-gray-600 mt-2">{quiz.description}</p>}
      </div>

      {/* Metadata Badges */}
      <QuizMetadata quiz={quiz} className="mb-4" />

      {/* Action Buttons */}
      <QuizActions isOwner={isOwner} onEdit={onEdit} onDelete={onDelete} onStartQuiz={onStartQuiz} />
    </header>
  );
}
