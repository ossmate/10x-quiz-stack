import type { OptionDTO } from "../../types.ts";
import { OptionItem } from "./OptionItem.tsx";

interface OptionsListProps {
  options: OptionDTO[];
  showCorrectAnswers: boolean;
}

/**
 * Helper function to convert option position to letter (1=A, 2=B, etc.)
 */
function getOptionLetter(position: number): string {
  // Handle positions beyond Z by using AA, AB, etc.
  if (position <= 26) {
    return String.fromCharCode(64 + position); // A-Z
  }

  const firstLetter = String.fromCharCode(64 + Math.floor((position - 1) / 26));
  const secondLetter = String.fromCharCode(64 + ((position - 1) % 26) + 1);
  return firstLetter + secondLetter;
}

/**
 * Renders the list of answer options for a question
 * Uses semantic list markup with option letters (A, B, C, etc.)
 */
export function OptionsList({ options, showCorrectAnswers }: OptionsListProps) {
  // Sort options by position to ensure correct ordering
  const sortedOptions = [...options].sort((a, b) => a.position - b.position);

  return (
    <ul className="space-y-3">
      {sortedOptions.map((option) => (
        <OptionItem
          key={option.id}
          option={option}
          optionLetter={getOptionLetter(option.position)}
          showCorrectAnswers={showCorrectAnswers}
        />
      ))}
    </ul>
  );
}
