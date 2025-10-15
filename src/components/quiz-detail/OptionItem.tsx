import type { OptionDTO } from "../../types.ts";
import { cn } from "@/lib/utils";

interface OptionItemProps {
  option: OptionDTO;
  optionLetter: string;
  showCorrectAnswers: boolean;
}

/**
 * CheckIcon component for correct answer indicator
 */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-5 h-5", className)}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Displays a single answer option with letter label and optional correct indicator
 */
export function OptionItem({ option, optionLetter, showCorrectAnswers }: OptionItemProps) {
  const isCorrect = option.is_correct;
  const showCorrectIndicator = showCorrectAnswers && isCorrect;

  return (
    <li
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border transition-colors",
        showCorrectIndicator ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-200"
      )}
    >
      {/* Option Letter */}
      <span
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm flex-shrink-0",
          showCorrectIndicator ? "bg-green-600 text-white" : "bg-gray-300 text-gray-700"
        )}
        aria-label={`Option ${optionLetter}`}
      >
        {optionLetter}
      </span>

      {/* Option Content */}
      <p className="flex-1 text-gray-900 text-base pt-1">{option.content}</p>

      {/* Correct Answer Indicator */}
      {showCorrectIndicator && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <CheckIcon className="text-green-600" />
          <span className="text-sm font-medium text-green-700" aria-label="Correct answer">
            Correct
          </span>
        </div>
      )}
    </li>
  );
}
