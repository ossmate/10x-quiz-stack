import type { QuizDetailDTO } from "../../types.ts";
import { QuizHeader } from "./QuizHeader.tsx";
import { QuizQuestions } from "./QuizQuestions.tsx";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog.tsx";
import { QuizAttemptHistory } from "../QuizAttempts/QuizAttemptHistory.tsx";
import { QuizDetailFooter } from "./QuizDetailFooter.tsx";
import { useStickyFooter } from "../hooks/ui/useStickyFooter.ts";

interface QuizDetailContentProps {
  quiz: QuizDetailDTO;
  isOwner: boolean;
  currentUserId?: string;
  onEdit: () => void;
  onDelete: () => void;
  onStartQuiz: () => void;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
  showDeleteDialog: boolean;
  onDeleteConfirm: () => Promise<void>;
  onDeleteCancel: () => void;
  isDeleting: boolean;
  deleteError: string | null;
}

/**
 * Main content component for quiz detail view
 * Renders the complete quiz content including header, questions, sticky footer, and delete dialog
 * Only displayed when quiz data is successfully loaded
 */
export function QuizDetailContent({
  quiz,
  isOwner,
  currentUserId,
  onEdit,
  onDelete,
  onStartQuiz,
  onPublish,
  onUnpublish,
  showDeleteDialog,
  onDeleteConfirm,
  onDeleteCancel,
  isDeleting,
  deleteError,
}: QuizDetailContentProps) {
  // Defensive check for questions
  const hasQuestions = quiz.questions && quiz.questions.length > 0;

  // Sticky footer behavior using IntersectionObserver
  const { isSticky: isFooterSticky, sentinelRef } = useStickyFooter();

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          {/* Quiz Header Section */}
          <QuizHeader
            quiz={quiz}
            isOwner={isOwner}
            onEdit={onEdit}
            onDelete={onDelete}
            onStartQuiz={onStartQuiz}
            onPublish={onPublish}
            onUnpublish={onUnpublish}
          />

          {/* Quiz Attempt History Section - Scoreboard (placed before questions for better visibility) */}
          <QuizAttemptHistory quizId={quiz.id} userId={currentUserId} />

          {/* Questions Section */}
          <section className="mt-8">
            {hasQuestions && quiz.questions ? (
              <QuizQuestions questions={quiz.questions} isOwner={isOwner} />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">This quiz has no questions yet.</p>
                {isOwner && (
                  <button onClick={onEdit} className="mt-4 text-primary hover:underline">
                    Add questions to this quiz
                  </button>
                )}
              </div>
            )}
          </section>
        </article>

        {/* Sentinel element to detect bottom of content */}
        <div ref={sentinelRef} className="h-1" />
      </div>

      {/* Sticky Footer with Action Buttons */}
      <QuizDetailFooter
        quiz={quiz}
        isOwner={isOwner}
        onEdit={onEdit}
        onDelete={onDelete}
        onStartQuiz={onStartQuiz}
        onPublish={onPublish}
        onUnpublish={onUnpublish}
        isSticky={isFooterSticky}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        quizTitle={quiz.title}
        onClose={onDeleteCancel}
        onConfirm={onDeleteConfirm}
        isDeleting={isDeleting}
        error={deleteError}
      />
    </div>
  );
}
