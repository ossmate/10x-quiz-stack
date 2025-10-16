import type { OptionDTO } from "../../types";
import { OptionItem } from "./OptionItem";

interface OptionsListProps {
  options: OptionDTO[];
  selectedOptionIds: string[];
  onSelectOption: (optionId: string) => void;
  disabled?: boolean;
}

/**
 * Renders a list of selectable answer options
 * Options are sorted by position and labeled with letters (A, B, C, etc.)
 */
export function OptionsList({ options, selectedOptionIds, onSelectOption, disabled = false }: OptionsListProps) {
  const sortedOptions = [...options].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-3" role="radiogroup" aria-label="Answer options">
      {sortedOptions.map((option, index) => {
        const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...
        const isSelected = selectedOptionIds.includes(option.id);

        return (
          <OptionItem
            key={option.id}
            option={option}
            optionLetter={optionLetter}
            isSelected={isSelected}
            onSelect={() => onSelectOption(option.id)}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}
