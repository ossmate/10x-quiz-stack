import type { QuizDetailDTO } from "../../types";
import { QuizActionItems } from "./QuizActionItems";

interface QuizActionsProps {
  quiz: QuizDetailDTO;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStartQuiz: () => void;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
}

/**
 * Action button group for quiz detail view
 * Shows appropriate buttons based on quiz status and user ownership
 * Now a thin wrapper around QuizActionItems for backwards compatibility
 */
export function QuizActions({
  quiz,
  isOwner,
  onEdit,
  onDelete,
  onStartQuiz,
  onPublish,
  onUnpublish,
}: QuizActionsProps) {
  return (
    <QuizActionItems
      quiz={quiz}
      isOwner={isOwner}
      onEdit={onEdit}
      onDelete={onDelete}
      onStartQuiz={onStartQuiz}
      onPublish={onPublish}
      onUnpublish={onUnpublish}
      variant="button"
    />
  );
}
