import React from "react";
import { toast } from "sonner";
import { GenerationForm } from "./GenerationForm";
import { LoadingIndicator } from "./LoadingIndicator";
import { QuizPreview } from "./QuizPreview";
import { EditableQuizContent } from "./EditableQuizContent";
import { useAIQuizGeneration } from "../hooks/useAIQuizGeneration";
import { useEditableQuiz } from "../hooks/useEditableQuiz";
import { useStickyFooter } from "../hooks/ui/useStickyFooter";
import type { QuizDetailDTO, AIQuizGenerationDTO, QuizUpdateDTO } from "../../types";

/**
 * AIQuizGenerator - Main component for the AI quiz generation workflow
 */
export function AIQuizGenerator() {
  // Use our custom hooks for state management
  const { state, generateQuiz, resetGeneration, toggleEdit, updateGeneratedQuiz, publishQuiz } = useAIQuizGeneration();

  // Sticky footer behavior using IntersectionObserver
  const { isSticky: isFooterSticky, sentinelRef } = useStickyFooter({
    dependencies: [state.status, state.isEditing],
  });

  // Create a dummy quiz for when we don't have a real quiz to edit
  // This ensures we always call the useEditableQuiz hook per React's rules
  const dummyQuiz: QuizDetailDTO = {
    id: "dummy-id",
    user_id: "dummy-user-id",
    title: "",
    description: "",
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

    // Publish the quiz and handle redirect
    try {
      const result = await publishQuiz(fullQuiz);
      if (result.success && result.redirectUrl) {
        // Show success notification
        toast.success("Quiz saved successfully!", {
          description: "Redirecting to your quiz...",
          duration: 3000,
        });

        // Redirect to quiz detail page after database commit delay
        // Wait 2.5 seconds to ensure database transaction is fully committed
        setTimeout(() => {
          window.location.href = result.redirectUrl;
        }, 2500);
      }
    } catch (error) {
      // Show error notification
      const errorMessage = error instanceof Error ? error.message : "Failed to save the quiz";
      toast.error("Failed to save quiz", {
        description: errorMessage,
      });
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
            <button
              onClick={handleReset}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center"
            >
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
        <>
          <div className={`space-y-6 ${isFooterSticky ? "pb-24" : ""}`}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h2 className="text-lg font-medium text-foreground">Generated Quiz Preview</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/20 text-accent-foreground">
                AI Generated
              </span>
            </div>

            <QuizPreview quiz={state.generatedQuiz} showCorrectAnswers={true} />

            {/* Sentinel element to detect bottom of content */}
            <div ref={sentinelRef} className="h-1" />
          </div>

          {/* Footer with Actions - sticky when scrolling, static at bottom */}
          <div
            className={`${
              isFooterSticky ? "fixed bottom-0 left-0 right-0 shadow-lg" : "relative"
            } bg-card border-t border-border z-10 transition-all duration-200`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  onClick={handleReset}
                  disabled={state.isPublishing}
                  className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-accent/10 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
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
                <button
                  onClick={handleToggleEdit}
                  disabled={state.isPublishing}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={state.isPublishing}
                  className="px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {state.isPublishing ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-1 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Quiz
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Editing State - Show Editable Quiz Content */}
      {state.status === "completed" && state.isEditing && state.generatedQuiz && editableQuizHook && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">Edit Your Quiz</h2>
            <span className="text-sm text-muted-foreground">Make any changes before saving</span>
          </div>

          <EditableQuizContent
            quiz={state.generatedQuiz}
            onSave={handleSaveQuiz}
            onCancel={() => handleToggleEdit()}
            saveButtonText="Save Quiz"
            cancelButtonText="Cancel Edits"
            isPublishing={state.isPublishing}
          />
        </div>
      )}
    </div>
  );
}
