import { Button } from "@/components/ui/button";
import type { QuizDetailDTO } from "../../types";
import { PublishQuizButton } from "./PublishQuizButton";
import { UnpublishQuizButton } from "./UnpublishQuizButton";

interface QuizDetailFooterProps {
  quiz: QuizDetailDTO;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStartQuiz: () => void;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
  isSticky: boolean;
}

/**
 * Sticky footer bar for quiz detail view
 * Shows action buttons at the bottom of the viewport when content scrolls past sentinel
 * Layout: Owner actions on left, Start Quiz button on right
 */
export function QuizDetailFooter({
  quiz,
  isOwner,
  onEdit,
  onDelete,
  onStartQuiz,
  onPublish,
  onUnpublish,
  isSticky,
}: QuizDetailFooterProps) {
  const isPublished = quiz.status === "public" || quiz.status === "private";
  const isDraft = quiz.status === "draft";

  return (
    <div
      className={`${
        isSticky ? "fixed bottom-0 left-0 right-0 shadow-lg" : "relative"
      } bg-card border-t border-border z-20 transition-all duration-200`}
    >
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center gap-3 flex-wrap">
          {/* Left side - Owner actions */}
          <div className="flex flex-wrap gap-3">
            {isOwner && (
              <>
                {/* Publish Button - Only for draft quizzes */}
                {isDraft && <PublishQuizButton quiz={quiz} onPublish={onPublish} />}

                {/* Unpublish Button - Only for published quizzes */}
                {isPublished && <UnpublishQuizButton quiz={quiz} onUnpublish={onUnpublish} />}

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

          {/* Right side - Start Quiz button */}
          <Button onClick={onStartQuiz} variant="default" size="default" aria-label="Start taking this quiz">
            Start Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}
