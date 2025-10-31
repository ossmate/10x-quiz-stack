import type { QuestionWithOptionsDTO } from "../../types.ts";
import { QuestionCard } from "./QuestionCard.tsx";
import { Accordion, AccordionItem } from "@/components/ui/accordion";

interface QuizQuestionsProps {
  questions: QuestionWithOptionsDTO[];
  isOwner: boolean;
  className?: string;
}

/**
 * Container component that renders the list of questions in an accordion
 * Questions are collapsed by default and can be expanded individually
 * Each question manages its own answer visibility state independently
 */
export function QuizQuestions({ questions, isOwner, className }: QuizQuestionsProps) {
  // Sort questions by position to ensure correct ordering
  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position);

  return (
    <div className={className}>
      <h2 className="text-2xl font-bold text-foreground mb-6">Questions</h2>

      <Accordion type="multiple" className="space-y-0">
        {sortedQuestions.map((question, index) => (
          <AccordionItem key={question.id} value={question.id}>
            <QuestionCard question={question} questionNumber={index + 1} isOwner={isOwner} />
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
