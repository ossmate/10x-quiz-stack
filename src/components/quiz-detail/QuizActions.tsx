import { Button } from "@/components/ui/button";

interface QuizActionsProps {
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStartQuiz: () => void;
}

/**
 * Action button group for quiz detail view
 * Shows Edit/Delete buttons for quiz owner and Start Quiz button for all users
 */
export function QuizActions({ isOwner, onEdit, onDelete, onStartQuiz }: QuizActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {/* Start Quiz Button - Available to all users */}
      <Button onClick={onStartQuiz} variant="default" size="default" aria-label="Start taking this quiz">
        Start Quiz
      </Button>

      {/* Owner-only actions */}
      {isOwner && (
        <>
          <Button onClick={onEdit} variant="outline" size="default" aria-label="Edit this quiz">
            Edit Quiz
          </Button>

          <Button onClick={onDelete} variant="destructive" size="default" aria-label="Delete this quiz">
            Delete Quiz
          </Button>
        </>
      )}
    </div>
  );
}
