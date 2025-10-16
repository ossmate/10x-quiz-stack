import { Badge } from "@/components/ui/badge";
import type { QuestionWithOptionsDTO } from "../../types";
import { OptionsList } from "./OptionsList";

interface QuestionDisplayProps {
  question: QuestionWithOptionsDTO;
  questionNumber: number; // 1-indexed for display
  selectedOptionIds: string[];
  onSelectOption: (optionId: string) => void;
  disabled?: boolean;
}

/**
 * Displays a single question with its options
 * Shows question number badge, content, and selectable options
 */
export function QuestionDisplay({
  question,
  questionNumber,
  selectedOptionIds,
  onSelectOption,
  disabled = false,
}: QuestionDisplayProps) {
  return (
    <div className="my-8">
      <div className="flex items-start gap-4 mb-6">
        <Badge className="text-lg px-3 py-1 shrink-0">Q{questionNumber}</Badge>
        <p className="text-xl flex-1">{question.content}</p>
      </div>

      <OptionsList
        options={question.options}
        selectedOptionIds={selectedOptionIds}
        onSelectOption={onSelectOption}
        disabled={disabled}
      />

      {question.explanation && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Hint:</span> {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
