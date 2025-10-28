import { useState, useEffect } from "react";
import type { AIQuizGenerationDTO } from "../../types";

interface GenerationFormProps {
  onSubmit: (data: AIQuizGenerationDTO) => void;
  isLoading: boolean;
  error?: string | null;
  initialValue?: string;
  isDisabled?: boolean;
  quotaMessage?: string;
}

/**
 * GenerationForm - Interactive form component for capturing user input prompt
 * and initiating AI quiz generation with validation feedback
 */
export function GenerationForm({
  onSubmit,
  isLoading,
  error = null,
  initialValue = "",
  isDisabled = false,
  quotaMessage,
}: GenerationFormProps) {
  // State for form inputs and validation
  const [prompt, setPrompt] = useState(initialValue);
  const [isValid, setIsValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  // Character limit constants
  const MIN_CHARS = 1;
  const MAX_CHARS = 1000;

  // Validate prompt on change
  useEffect(() => {
    const trimmedPrompt = prompt.trim();

    if (trimmedPrompt.length < MIN_CHARS) {
      setIsValid(false);
      setValidationMessage("Please enter a prompt");
    } else if (trimmedPrompt.length > MAX_CHARS) {
      setIsValid(false);
      setValidationMessage(`Prompt is too long. Maximum ${MAX_CHARS} characters allowed`);
    } else {
      setIsValid(true);
      setValidationMessage("");
    }
  }, [prompt]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isValid && !isLoading && !isDisabled) {
      onSubmit({ prompt: prompt.trim() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 border border-destructive bg-destructive/10 rounded-md">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="prompt" className="block text-sm font-medium text-foreground">
          Describe your quiz topic and content
        </label>

        <textarea
          id="prompt"
          name="prompt"
          rows={5}
          className={`block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary ${
            !isValid && prompt.trim().length > 0 ? "border-destructive" : ""
          } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          placeholder={
            isDisabled
              ? "Quiz generation is currently unavailable"
              : "E.g., Create a quiz about the solar system with questions about planets, moons, and space exploration..."
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading || isDisabled}
        />

        <div className="flex justify-between text-sm">
          <span className={!isValid ? "text-destructive" : "text-muted-foreground"}>
            {validationMessage || "Be specific about the topic and difficulty level"}
          </span>
          <span className={prompt.length > MAX_CHARS ? "text-destructive" : "text-muted-foreground"}>
            {prompt.length}/{MAX_CHARS}
          </span>
        </div>
      </div>

      {isDisabled && quotaMessage ? (
        <div className="bg-destructive/10 border border-destructive p-4 rounded-md">
          <h3 className="text-sm font-medium text-destructive">Generation Limit Reached</h3>
          <p className="mt-2 text-sm text-destructive/90">{quotaMessage}</p>
        </div>
      ) : (
        <div className="bg-muted p-4 rounded-md">
          <h3 className="text-sm font-medium text-foreground">Tips for great prompts:</h3>
          <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Be specific about the quiz topic and target audience</li>
            <li>Mention the difficulty level you want (e.g., beginner, intermediate, expert)</li>
            <li>Specify the number of questions if you have a preference</li>
            <li>Include example questions or formats if you have specific requirements</li>
          </ul>
        </div>
      )}

      <div>
        <button
          type="submit"
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium ${
            isValid && !isLoading && !isDisabled
              ? "bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
              : "bg-primary/40 text-primary-foreground/60 cursor-not-allowed"
          }`}
          disabled={!isValid || isLoading || isDisabled}
        >
          {isLoading ? "Generating..." : isDisabled ? "Generation Unavailable" : "Generate Quiz"}
        </button>
      </div>
    </form>
  );
}
