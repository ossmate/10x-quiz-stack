import type { QuizDTO } from "../../types.ts";
import { QuizMetadata } from "./QuizMetadata.tsx";
import { QuizActions } from "./QuizActions.tsx";

interface QuizHeaderProps {
  quiz: QuizDTO;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStartQuiz: () => void;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
  onVisibilityChange: (newStatus: "public" | "private") => Promise<void>;
}

/**
 * Header component for quiz detail view
 * Displays quiz title, description, metadata badges, and action buttons
 */
export function QuizHeader({
  quiz,
  isOwner,
  onEdit,
  onDelete,
  onStartQuiz,
  onPublish,
  onUnpublish,
  onVisibilityChange,
}: QuizHeaderProps) {
  return (
    <header className="border-b border-border pb-6">
      {/* Title and Description */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-foreground mb-2">{quiz.title}</h1>
        {quiz.description && <p className="text-lg text-muted-foreground mt-2">{quiz.description}</p>}
      </div>

      {/* Metadata Badges */}
      <QuizMetadata quiz={quiz} className="mb-4" />

      {/* Action Buttons */}
      <QuizActions
        quiz={quiz}
        isOwner={isOwner}
        onEdit={onEdit}
        onDelete={onDelete}
        onStartQuiz={onStartQuiz}
        onPublish={onPublish}
        onUnpublish={onUnpublish}
        onVisibilityChange={onVisibilityChange}
      />
    </header>
  );
}
