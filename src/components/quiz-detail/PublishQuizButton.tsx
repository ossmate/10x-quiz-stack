import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { QuizDetailDTO } from "../../types";

interface PublishQuizButtonProps {
  quiz: QuizDetailDTO;
  onPublish: () => Promise<void>;
}

/**
 * Button to publish a draft quiz with confirmation dialog
 * Shows quiz validation summary before publishing
 */
export function PublishQuizButton({ quiz, onPublish }: PublishQuizButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [open, setOpen] = useState(false);

  // Only show for draft quizzes
  if (quiz.status !== "draft") {
    return null;
  }

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await onPublish();
      setOpen(false);
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Publish failed:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const questionCount = quiz.questions?.length || 0;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="default" size="default" aria-label="Publish this quiz">
          Publish Quiz
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish Quiz?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>You are about to publish &quot;{quiz.title}&quot; and make it publicly accessible.</p>
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium text-foreground mb-2">Quiz Summary:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>
                  • {questionCount} {questionCount === 1 ? "question" : "questions"}
                </li>
                <li>
                  • Status will change to: <span className="font-medium text-foreground">Public</span>
                </li>
                <li>• Anyone will be able to view and take this quiz</li>
                <li>• You&apos;ll need to unpublish before editing</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              Once published, you won&apos;t be able to edit the quiz until you unpublish it.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPublishing}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? "Publishing..." : "Publish Quiz"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
