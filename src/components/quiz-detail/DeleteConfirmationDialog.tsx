import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  quizTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  error: string | null;
}

/**
 * Modal dialog for confirming quiz deletion
 * Implements proper accessibility with focus management and keyboard support
 */
export function DeleteConfirmationDialog({
  isOpen,
  quizTitle,
  onClose,
  onConfirm,
  isDeleting,
  error,
}: DeleteConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard event handler
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isDeleting, onClose]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleOverlayClick(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        className={cn("bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6", "transform transition-all")}
      >
        {/* Dialog Header */}
        <div className="mb-4">
          <h2 id="dialog-title" className="text-xl font-bold text-gray-900">
            Delete Quiz?
          </h2>
        </div>

        {/* Dialog Content */}
        <div className="mb-6">
          <p id="dialog-description" className="text-gray-600 mb-2">
            Are you sure you want to delete the quiz:
          </p>
          <p className="font-semibold text-gray-900 mb-4">&ldquo;{quizTitle}&rdquo;</p>
          <p className="text-sm text-red-600">
            This action cannot be undone. All questions and data associated with this quiz will be permanently deleted.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Dialog Actions */}
        <div className="flex justify-end gap-3">
          <Button
            ref={closeButtonRef}
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Cancel deletion"
          >
            Cancel
          </Button>

          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} aria-label="Confirm deletion">
            {isDeleting ? "Deleting..." : "Delete Quiz"}
          </Button>
        </div>
      </div>
    </div>
  );
}
