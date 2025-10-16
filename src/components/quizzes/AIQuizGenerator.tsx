import React from "react";
import { GenerationForm } from "./GenerationForm";
import { LoadingIndicator } from "./LoadingIndicator";
import { QuizPreview } from "./QuizPreview";
import { EditableQuizContent } from "./EditableQuizContent";
import { useAIQuizGeneration } from "../hooks/useAIQuizGeneration";
import { useEditableQuiz } from "../hooks/useEditableQuiz";
import type { QuizDetailDTO, AIQuizGenerationDTO, QuizUpdateDTO } from "../../types";

/**
 * AIQuizGenerator - Main component for the AI quiz generation workflow
 */
export function AIQuizGenerator() {
  // Use our custom hooks for state management
  const { state, generateQuiz, resetGeneration, toggleEdit, updateGeneratedQuiz, publishQuiz } = useAIQuizGeneration();

  // Create a dummy quiz for when we don't have a real quiz to edit
  // This ensures we always call the useEditableQuiz hook per React's rules
  const dummyQuiz: QuizDetailDTO = {
    id: "dummy-id",
    user_id: "dummy-user-id",
    title: "",
    description: "",
    visibility: "private",
    status: "draft",
    source: "ai_generated",
    ai_model: "",
    ai_prompt: "",
    ai_temperature: 0.7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Always call the hook, but use either the actual quiz or the dummy
  const editableQuizHook = useEditableQuiz(state.generatedQuiz && state.isEditing ? state.generatedQuiz : dummyQuiz);

  // Generate quiz handler
  const handleGenerateQuiz = async (data: AIQuizGenerationDTO) => {
    await generateQuiz(data);
  };

  // Reset generation handler
  const handleReset = () => {
    resetGeneration();
  };

  // Toggle edit mode handler
  const handleToggleEdit = () => {
    toggleEdit();
  };

  // Save edited quiz handler
  const handleSaveQuiz = async (updatedQuiz: QuizUpdateDTO) => {
    // Cast to QuizDetailDTO since our implementation requires these additional fields
    const fullQuiz = updatedQuiz as unknown as QuizDetailDTO;
    updateGeneratedQuiz(fullQuiz);

    // In a real implementation, this would publish the quiz
    try {
      const result = await publishQuiz(fullQuiz);
      if (result.success) {
        // Redirect to quiz detail page in production
        // window.location.href = `/quizzes/${result.quizId}`;
      }
    } catch {
      // Error is handled silently
    }
  };

  // Render different components based on state
  return (
    <div className="space-y-6">
      {/* Idle State - Show Generation Form */}
      {state.status === "idle" && (
        <GenerationForm onSubmit={handleGenerateQuiz} isLoading={false} error={state.error} />
      )}

      {/* Generating State - Show Loading Indicator */}
      {state.status === "generating" && (
        <div className="space-y-4">
          <LoadingIndicator isLoading={true} statusMessage="Generating your quiz using AI. This may take a moment..." />
          <div className="flex justify-center">
            <button onClick={handleReset} className="text-sm text-muted-foreground hover:text-foreground flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel Generation
            </button>
          </div>
        </div>
      )}

      {/* Error State - Show Error Message and Form */}
      {state.status === "error" && (
        <div className="space-y-4">
          <div className="p-4 border border-red-300 bg-red-50 rounded-md">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-600 mt-0.5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-700">{state.error || "An error occurred while generating the quiz"}</p>
            </div>
          </div>
          <GenerationForm
            onSubmit={handleGenerateQuiz}
            isLoading={false}
            error={state.error}
            initialValue={state.prompt}
          />
        </div>
      )}

      {/* Completed State (Preview Mode) - Show Quiz Preview with Actions */}
      {state.status === "completed" && !state.isEditing && state.generatedQuiz && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">Generated Quiz Preview</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/20 text-accent-foreground">
              AI Generated
            </span>
          </div>

          <QuizPreview
            quiz={state.generatedQuiz}
            showCorrectAnswers={true}
            actions={
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={handleToggleEdit}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  Edit Quiz
                </button>
                <button
                  onClick={() => state.generatedQuiz && handleSaveQuiz(state.generatedQuiz)}
                  className="px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Publish Quiz
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-accent/10 flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Generate Another
                </button>
              </div>
            }
          />
        </div>
      )}

      {/* Editing State - Show Editable Quiz Content */}
      {state.status === "completed" && state.isEditing && state.generatedQuiz && editableQuizHook && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">Edit Your Quiz</h2>
            <span className="text-sm text-muted-foreground">Make any changes before publishing</span>
          </div>

          <EditableQuizContent
            quiz={state.generatedQuiz}
            onSave={handleSaveQuiz}
            onCancel={() => handleToggleEdit()}
            saveButtonText="Save & Publish"
            cancelButtonText="Cancel Edits"
          />
        </div>
      )}
    </div>
  );
}
