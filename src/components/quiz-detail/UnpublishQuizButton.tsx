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

interface UnpublishQuizButtonProps {
  quiz: QuizDetailDTO;
  onUnpublish: () => Promise<void>;
}

/**
 * Button to unpublish a quiz with confirmation dialog
 * Warns user about losing public visibility
 */
export function UnpublishQuizButton({ quiz, onUnpublish }: UnpublishQuizButtonProps) {
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [open, setOpen] = useState(false);

  // Only show for published quizzes (public or private status)
  if (quiz.status !== "public" && quiz.status !== "private") {
    return null;
  }

  const handleUnpublish = async () => {
    setIsUnpublishing(true);
    try {
      await onUnpublish();
      setOpen(false);
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Unpublish failed:", error);
    } finally {
      setIsUnpublishing(false);
    }
  };

  const currentVisibility = quiz.status === "public" ? "publicly visible" : "published but private";

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="default" aria-label="Unpublish this quiz">
          Unpublish Quiz
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unpublish Quiz?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>You are about to unpublish &quot;{quiz.title}&quot;.</p>
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium text-foreground mb-2">What will happen:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>
                  • Quiz will return to <span className="font-medium text-foreground">Draft</span> status
                </li>
                <li>• Currently {currentVisibility}</li>
                <li>• Will no longer be accessible to others</li>
                <li>• You&apos;ll be able to edit it again</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">You can republish the quiz anytime after making changes.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUnpublishing}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleUnpublish} disabled={isUnpublishing}>
            {isUnpublishing ? "Unpublishing..." : "Unpublish Quiz"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
