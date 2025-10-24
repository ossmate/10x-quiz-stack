import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { navigate } from "astro:transitions/client";
import type { QuizDetailDTO, QuizUpdateDTO } from "../../types";
import { EditableQuizContent } from "./EditableQuizContent";
import type { QuizCreateInput } from "../../lib/validation/quiz-create.schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface QuizCreatorProps {
  userId: string;
}

/**
 * Transform the EditableQuizContent data to API request format
 * Strips temporary client-side IDs and removes database-only fields
 */
function transformToCreateInput(quizData: QuizUpdateDTO & { questions?: QuizDetailDTO["questions"] }): QuizCreateInput {
  if (!quizData.questions || quizData.questions.length === 0) {
    throw new Error("Quiz must have at least one question");
  }

  return {
    title: quizData.title,
    description: quizData.description || "",
    source: "manual",
    questions: quizData.questions.map((question, index) => ({
      content: question.content,
      explanation: question.explanation,
      position: index + 1,
      options: (question.options || []).map((option, optIndex) => ({
        content: option.content,
        is_correct: option.is_correct,
        position: optIndex + 1,
      })),
    })),
  };
}

/**
 * QuizCreator - Lightweight wrapper component that initializes an empty quiz
 * and manages the quiz creation lifecycle using EditableQuizContent
 */
export function QuizCreator({ userId }: QuizCreatorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [shouldPreventUnload, setShouldPreventUnload] = useState(true);

  // Initialize empty quiz structure with one default question
  const initialQuiz = useMemo<QuizDetailDTO>(() => {
    const quizId = `new-quiz-${crypto.randomUUID()}`;
    const questionId = `new-question-${crypto.randomUUID()}`;

    return {
      id: quizId,
      user_id: userId,
      title: "",
      description: "",
      status: "draft",
      source: "manual",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      questions: [
        {
          id: questionId,
          quiz_id: quizId,
          content: "",
          position: 1,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          options: [
            {
              id: `new-option-${crypto.randomUUID()}`,
              question_id: questionId,
              content: "",
              is_correct: true,
              position: 1,
              created_at: new Date().toISOString(),
            },
            {
              id: `new-option-${crypto.randomUUID()}`,
              question_id: questionId,
              content: "",
              is_correct: false,
              position: 2,
              created_at: new Date().toISOString(),
            },
          ],
        },
      ],
    };
  }, [userId]);

  // Create quiz via API
  const createQuiz = async (quizData: QuizUpdateDTO) => {
    setIsCreating(true);

    try {
      // Transform to API format
      const createInput = transformToCreateInput(
        quizData as QuizUpdateDTO & { questions?: QuizDetailDTO["questions"] }
      );

      // Call API
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createInput),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to create quiz" }));
        throw new Error(errorData.message || "Failed to create quiz");
      }

      const createdQuiz = await response.json();

      // Show success toast
      toast.success("Quiz created successfully!");

      // Disable beforeunload warning before navigation
      setShouldPreventUnload(false);

      // Navigate to quiz detail page using Astro's client-side navigation
      setTimeout(() => {
        navigate(`/quizzes/${createdQuiz.id}`);
      }, 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create quiz. Please try again.";
      toast.error(errorMessage);
      setIsCreating(false);
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  // Confirm cancellation and navigate to dashboard
  const confirmCancel = () => {
    // Disable beforeunload warning before navigation
    setShouldPreventUnload(false);

    // Navigate after disabling the warning
    setTimeout(() => {
      navigate("/dashboard");
    }, 100);
  };

  // Add navigation guard for unsaved changes (only for browser close/refresh)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Don't show warning if we've explicitly disabled it (e.g., after successful save or cancel)
      if (!shouldPreventUnload) {
        return;
      }

      // Only show warning if form is dirty (has changes)
      // We'll check if there's any content that would be lost
      if (initialQuiz.questions && initialQuiz.questions.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [initialQuiz.questions, shouldPreventUnload]);

  return (
    <>
      <EditableQuizContent
        quiz={initialQuiz}
        onSave={createQuiz}
        onCancel={handleCancel}
        saveButtonText="Create Quiz"
        cancelButtonText="Cancel"
        isPublishing={isCreating}
      />

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel quiz creation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel? Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>Yes, cancel</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
