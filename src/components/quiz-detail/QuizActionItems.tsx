import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { QuizDetailDTO } from "../../types";
import { PublishQuizButton } from "./PublishQuizButton";
import { UnpublishQuizButton } from "./UnpublishQuizButton";

interface QuizActionItemsProps {
  quiz: QuizDetailDTO;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStartQuiz: () => void;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
  variant: "button" | "menu";
}

/**
 * Reusable action items component that renders quiz actions as either buttons or dropdown menu items
 * Centralizes the action logic for both footer and header kebab menu
 */
export function QuizActionItems({
  quiz,
  isOwner,
  onEdit,
  onDelete,
  onStartQuiz,
  onPublish,
  onUnpublish,
  variant,
}: QuizActionItemsProps) {
  const isPublished = quiz.status === "public" || quiz.status === "private";
  const isDraft = quiz.status === "draft";

  if (variant === "button") {
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

  // Menu variant
  return (
    <>
      {/* Start Quiz - Available to all users */}
      <DropdownMenuItem onSelect={onStartQuiz} aria-label="Start taking this quiz">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Start Quiz
      </DropdownMenuItem>

      {/* Owner-only actions */}
      {isOwner && (
        <>
          {/* Publish - Only for draft quizzes */}
          {isDraft && (
            <DropdownMenuItem onSelect={onPublish} aria-label="Publish this quiz">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Publish Quiz
            </DropdownMenuItem>
          )}

          {/* Unpublish - Only for published quizzes */}
          {isPublished && (
            <DropdownMenuItem onSelect={onUnpublish} aria-label="Unpublish this quiz">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-12"
                />
              </svg>
              Unpublish Quiz
            </DropdownMenuItem>
          )}

          {/* Edit - Only enabled for draft quizzes */}
          <DropdownMenuItem
            onSelect={isPublished ? undefined : onEdit}
            disabled={isPublished}
            aria-label={isPublished ? "Unpublish quiz to edit" : "Edit this quiz"}
            title={isPublished ? "You must unpublish the quiz before editing" : "Edit this quiz"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Quiz
          </DropdownMenuItem>

          {/* Delete - Always available to owner */}
          <DropdownMenuItem onSelect={onDelete} variant="destructive" aria-label="Delete this quiz">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete Quiz
          </DropdownMenuItem>
        </>
      )}
    </>
  );
}
