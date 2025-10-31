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
        showCorrectIndicator ? "bg-accent/50 border-accent" : "bg-card border-border"
      )}
    >
      {/* Option Letter */}
      <span
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm flex-shrink-0",
          showCorrectIndicator ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
        aria-label={`Option ${optionLetter}`}
      >
        {optionLetter}
      </span>

      {/* Option Content */}
      <p className="flex-1 text-foreground text-base pt-1">{option.content}</p>

      {/* Correct Answer Indicator */}
      {showCorrectIndicator && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <CheckIcon className="text-primary" />
          <span className="text-sm font-medium text-primary" aria-label="Correct answer">
            Correct
          </span>
        </div>
      )}
    </li>
  );
}
