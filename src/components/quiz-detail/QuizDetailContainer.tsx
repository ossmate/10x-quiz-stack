import { useState, useCallback } from "react";
import { navigate } from "astro:transitions/client";
import { toast } from "sonner";
import { useQuizDetail } from "../../hooks/useQuizDetail.ts";
import { LoadingSpinner } from "../Dashboard/LoadingSpinner.tsx";
import { ErrorAlert } from "../Dashboard/ErrorAlert.tsx";
import { QuizDetailContent } from "./QuizDetailContent.tsx";

interface QuizDetailContainerProps {
  quizId: string;
  currentUserId?: string;
}

/**
 * Main container component for quiz detail view
 * Manages state, fetches quiz data, and orchestrates rendering of child components
 * based on loading/error/success states
 */
export function QuizDetailContainer({ quizId, currentUserId }: QuizDetailContainerProps) {
  const { quiz, isLoading, error, isOwner, refetch, deleteQuiz } = useQuizDetail({
    quizId,
    currentUserId,
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /**
   * Handle edit button click - navigate to edit page
   */
  const handleEdit = useCallback(() => {
    navigate(`/quizzes/${quizId}/edit`);
  }, [quizId]);

  /**
   * Handle delete button click - open confirmation dialog
   */
  const handleDelete = useCallback(() => {
    setShowDeleteDialog(true);
    setDeleteError(null);
  }, []);

  /**
   * Handle delete confirmation - execute deletion
   */
  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteQuiz();
      // Navigation happens in deleteQuiz on success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete quiz. Please try again.";
      setDeleteError(errorMessage);
      setIsDeleting(false);
    }
  }, [deleteQuiz]);

  /**
   * Handle delete dialog close
   */
  const handleDeleteCancel = useCallback(() => {
    if (!isDeleting) {
      setShowDeleteDialog(false);
      setDeleteError(null);
    }
  }, [isDeleting]);

  /**
   * Handle start quiz button click
   */
  const handleStartQuiz = useCallback(() => {
    navigate(`/quizzes/${quizId}/take`);
  }, [quizId]);

  /**
   * Handle publish quiz
   */
  const handlePublish = useCallback(async () => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to publish quiz");
      }

      toast.success("Quiz published successfully!");
      await refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to publish quiz";
      toast.error(errorMessage);
      throw err;
    }
  }, [quizId, refetch]);

  /**
   * Handle unpublish quiz
   */
  const handleUnpublish = useCallback(async () => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}/unpublish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to unpublish quiz");
      }

      toast.success("Quiz unpublished successfully!");
      await refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to unpublish quiz";
      toast.error(errorMessage);
      throw err;
    }
  }, [quizId, refetch]);

  /**
   * Handle retry after error
   */
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  /**
   * Handle navigation to dashboard from error state
   */
  const handleGoToDashboard = useCallback(() => {
    navigate("/dashboard");
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner message="Loading quiz..." />
      </div>
    );
  }

  // Error state
  if (error) {
    // Determine if retry button should be shown based on error type
    const showRetry = !error.includes("not found") && !error.includes("Invalid quiz ID");

    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorAlert title="Failed to Load Quiz" message={error} onRetry={showRetry ? handleRetry : undefined} />
        <div className="mt-4">
          <button onClick={handleGoToDashboard} className="text-sm text-blue-600 hover:text-blue-800 underline">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // No quiz data (shouldn't happen, but defensive check)
  if (!quiz) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorAlert title="No Quiz Data" message="Unable to display quiz data." />
        <div className="mt-4">
          <button onClick={handleGoToDashboard} className="text-sm text-blue-600 hover:text-blue-800 underline">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Success state - render quiz content
  return (
    <QuizDetailContent
      quiz={quiz}
      isOwner={isOwner}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onStartQuiz={handleStartQuiz}
      onPublish={handlePublish}
      onUnpublish={handleUnpublish}
      showDeleteDialog={showDeleteDialog}
      onDeleteConfirm={handleDeleteConfirm}
      onDeleteCancel={handleDeleteCancel}
      isDeleting={isDeleting}
      deleteError={deleteError}
    />
  );
}
