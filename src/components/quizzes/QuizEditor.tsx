import { useState } from "react";
import { toast } from "sonner";
import { navigate } from "astro:transitions/client";
import { EditableQuizContent } from "./EditableQuizContent";
import type { QuizDetailDTO, QuizUpdateDTO } from "../../types";
import type { QuizCreateInput } from "../../lib/validation/quiz-create.schema";

interface QuizEditorProps {
  quiz: QuizDetailDTO;
}

/**
 * QuizEditor - Wrapper component for editing existing quizzes
 * Handles the complete editing workflow including saving to API and redirecting
 */
export function QuizEditor({ quiz }: QuizEditorProps) {
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Handle cancel - navigate back to quiz detail page
   */
  const handleCancel = () => {
    navigate(`/quizzes/${quiz.id}`);
  };

  /**
   * Handle save - convert quiz data and send to API
   * The EditableQuizContent component now provides the full quiz data
   * (cast as QuizUpdateDTO but includes questions)
   */
  const handleSave = async (updatedData: QuizUpdateDTO) => {
    setIsSaving(true);

    try {
      // Cast to QuizDetailDTO to access questions
      // EditableQuizContent now passes the full quiz data including questions
      const fullQuiz = updatedData as unknown as QuizDetailDTO;

      // Convert QuizDetailDTO to QuizCreateInput format required by API
      const quizInput: QuizCreateInput = {
        title: fullQuiz.title,
        description: fullQuiz.description || "",
        source: fullQuiz.source,
        ai_model: fullQuiz.ai_model,
        ai_prompt: fullQuiz.ai_prompt,
        ai_temperature: fullQuiz.ai_temperature,
        questions:
          fullQuiz.questions?.map((question) => ({
            content: question.content,
            explanation: question.explanation,
            position: question.position,
            options:
              question.options?.map((option) => ({
                content: option.content,
                is_correct: option.is_correct,
                position: option.position,
              })) || [],
          })) || [],
      };

      // Send PUT request to API
      const response = await fetch(`/api/quizzes/${quiz.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quizInput),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save quiz");
      }

      const savedQuiz = await response.json();

      // Show success notification
      toast.success("Quiz saved successfully!", {
        description: "Your changes have been saved",
        duration: 3000,
      });

      // Redirect to quiz detail page
      setTimeout(() => {
        navigate(`/quizzes/${savedQuiz.id}`);
      }, 1000);
    } catch (error) {
      // Show error notification
      const errorMessage = error instanceof Error ? error.message : "Failed to save quiz";
      toast.error("Failed to save quiz", {
        description: errorMessage,
      });

      setIsSaving(false);
    }
  };

  return (
    <div>
      <EditableQuizContent
        quiz={quiz}
        onSave={handleSave}
        onCancel={handleCancel}
        saveButtonText="Save Changes"
        cancelButtonText="Cancel"
        isPublishing={isSaving}
      />
    </div>
  );
}
