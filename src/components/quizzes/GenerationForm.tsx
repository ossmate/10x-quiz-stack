import { useState, useEffect } from "react";
import type { AIQuizGenerationDTO } from "../../types";

interface GenerationFormProps {
  onSubmit: (data: AIQuizGenerationDTO) => void;
  isLoading: boolean;
  error?: string | null;
  initialValue?: string;
}

/**
 * GenerationForm - Interactive form component for capturing user input prompt
 * and initiating AI quiz generation with validation feedback
 */
export function GenerationForm({ onSubmit, isLoading, error = null, initialValue = "" }: GenerationFormProps) {
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

    if (isValid && !isLoading) {
      onSubmit({ prompt: prompt.trim() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
          Describe your quiz topic and content
        </label>

        <textarea
          id="prompt"
          name="prompt"
          rows={5}
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
            !isValid && prompt.trim().length > 0 ? "border-red-300" : ""
          }`}
          placeholder="E.g., Create a quiz about the solar system with questions about planets, moons, and space exploration..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
        />

        <div className="flex justify-between text-sm">
          <span className={!isValid ? "text-red-600" : "text-gray-500"}>
            {validationMessage || "Be specific about the topic and difficulty level"}
          </span>
          <span className={prompt.length > MAX_CHARS ? "text-red-600" : "text-gray-500"}>
            {prompt.length}/{MAX_CHARS}
          </span>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-sm font-medium text-gray-900">Tips for great prompts:</h3>
        <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
          <li>Be specific about the quiz topic and target audience</li>
          <li>Mention the difficulty level you want (e.g., beginner, intermediate, expert)</li>
          <li>Specify the number of questions if you have a preference</li>
          <li>Include example questions or formats if you have specific requirements</li>
        </ul>
      </div>

      <div>
        <button
          type="submit"
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isValid && !isLoading
              ? "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              : "bg-blue-400 cursor-not-allowed"
          }`}
          disabled={!isValid || isLoading}
        >
          {isLoading ? "Generating..." : "Generate Quiz"}
        </button>
      </div>
    </form>
  );
}
