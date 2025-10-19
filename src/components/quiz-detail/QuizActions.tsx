import { Button } from "@/components/ui/button";
import type { QuizDetailDTO } from "../../types";
import { PublishQuizButton } from "./PublishQuizButton";
import { UnpublishQuizButton } from "./UnpublishQuizButton";
import { QuizVisibilityToggle } from "./QuizVisibilityToggle";

interface QuizActionsProps {
  quiz: QuizDetailDTO;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStartQuiz: () => void;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
  onVisibilityChange: (newStatus: "public" | "private") => Promise<void>;
}

/**
 * Action button group for quiz detail view
 * Shows appropriate buttons based on quiz status and user ownership
 */
export function QuizActions({
  quiz,
  isOwner,
  onEdit,
  onDelete,
  onStartQuiz,
  onPublish,
  onUnpublish,
  onVisibilityChange,
}: QuizActionsProps) {
  const isPublished = quiz.status === "public" || quiz.status === "private";
  const isDraft = quiz.status === "draft";

  return (
    <div className="flex flex-wrap gap-3">
      {/* Start Quiz Button - Available to all users */}
      <Button onClick={onStartQuiz} variant="default" size="default" aria-label="Start taking this quiz">
        Start Quiz
      </Button>

      {/* Owner-only actions */}
      {isOwner && (
        <>
          {/* Publish Button - Only for draft quizzes */}
          {isDraft && <PublishQuizButton quiz={quiz} onPublish={onPublish} />}

          {/* Unpublish Button - Only for published quizzes */}
          {isPublished && <UnpublishQuizButton quiz={quiz} onUnpublish={onUnpublish} />}

          {/* Visibility Toggle - Only for published quizzes */}
          {isPublished && <QuizVisibilityToggle quiz={quiz} onVisibilityChange={onVisibilityChange} />}

          {/* Edit Button - Only enabled for draft quizzes */}
          <Button
            onClick={onEdit}
            variant="outline"
            size="default"
            disabled={isPublished}
            aria-label={isPublished ? "Unpublish quiz to edit" : "Edit this quiz"}
            title={isPublished ? "You must unpublish the quiz before editing" : "Edit this quiz"}
          >
            Edit Quiz
          </Button>

          {/* Delete Button - Always available to owner */}
          <Button onClick={onDelete} variant="destructive" size="default" aria-label="Delete this quiz">
            Delete Quiz
          </Button>
        </>
      )}
    </div>
  );
}
