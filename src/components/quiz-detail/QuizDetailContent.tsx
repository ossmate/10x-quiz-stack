import type { QuizDetailDTO } from "../../types.ts";
import { QuizHeader } from "./QuizHeader.tsx";
import { QuizQuestions } from "./QuizQuestions.tsx";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog.tsx";

interface QuizDetailContentProps {
  quiz: QuizDetailDTO;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStartQuiz: () => void;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
  onVisibilityChange: (newStatus: "public" | "private") => Promise<void>;
  showDeleteDialog: boolean;
  onDeleteConfirm: () => Promise<void>;
  onDeleteCancel: () => void;
  isDeleting: boolean;
  deleteError: string | null;
}

/**
 * Main content component for quiz detail view
 * Renders the complete quiz content including header, questions, and delete dialog
 * Only displayed when quiz data is successfully loaded
 */
export function QuizDetailContent({
  quiz,
  isOwner,
  onEdit,
  onDelete,
  onStartQuiz,
  onPublish,
  onUnpublish,
  onVisibilityChange,
  showDeleteDialog,
  onDeleteConfirm,
  onDeleteCancel,
  isDeleting,
  deleteError,
}: QuizDetailContentProps) {
  // Defensive check for questions
  const hasQuestions = quiz.questions && quiz.questions.length > 0;

  return (
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
          onVisibilityChange={onVisibilityChange}
        />

        {/* Questions Section */}
        <section className="mt-8">
          {hasQuestions && quiz.questions ? (
            <QuizQuestions questions={quiz.questions} showCorrectAnswers={isOwner} />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">This quiz has no questions yet.</p>
              {isOwner && (
                <button onClick={onEdit} className="mt-4 text-blue-600 hover:text-blue-800 underline">
                  Add questions to this quiz
                </button>
              )}
            </div>
          )}
        </section>
      </article>

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
