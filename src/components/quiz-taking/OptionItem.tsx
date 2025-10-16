import { cn } from "@/lib/utils";
import type { OptionDTO } from "../../types";

interface OptionItemProps {
  option: OptionDTO;
  optionLetter: string; // A, B, C, D...
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

/**
 * Individual selectable answer option
 * Displays with letter label, content, and selection indicator
 * Fully keyboard accessible with proper ARIA attributes
 */
export function OptionItem({ option, optionLetter, isSelected, onSelect, disabled = false }: OptionItemProps) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={`Option ${optionLetter}: ${option.content}`}
      className={cn(
        "w-full text-left p-4 rounded-lg border-2 transition-all",
        "hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        isSelected ? "border-primary bg-primary/10 shadow-sm" : "border-border hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed hover:border-border"
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("font-semibold text-lg shrink-0", isSelected ? "text-primary" : "text-muted-foreground")}>
          {optionLetter}.
        </span>
        <span className="flex-1">{option.content}</span>
        {isSelected && (
          <svg
            className="h-5 w-5 text-primary shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </button>
  );
}
