import { useState } from "react";
import type { QuestionWithOptionsDTO } from "../../types.ts";
import { AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { OptionsList } from "./OptionsList.tsx";

interface QuestionCardProps {
  question: QuestionWithOptionsDTO;
  questionNumber: number;
  isOwner: boolean;
}

/**
 * Displays a single question in an accordion format
 * Supports per-question answer visibility toggle for owners
 * Each question manages its own showCorrectAnswers state independently
 */
export function QuestionCard({ question, questionNumber, isOwner }: QuestionCardProps) {
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const hasExplanation =
    question.explanation !== undefined && question.explanation !== null && question.explanation.trim() !== "";

  // Defensive check for options
  if (!question.options || question.options.length === 0) {
    return (
      <>
        <AccordionTrigger className="question-header">
          <div className="flex items-start gap-3 text-left w-full">
            <span className="text-primary font-bold shrink-0">Q{questionNumber}</span>
            <span className="text-foreground">{question.content}</span>
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-6 py-4">
          <p className="text-destructive text-sm">⚠️ This question has no answer options.</p>
        </AccordionContent>
      </>
    );
  }

  return (
    <>
      <AccordionTrigger className="question-header py-4 px-6 hover:bg-muted/50">
        <div className="flex items-start gap-3 text-left w-full">
          <span className="text-primary font-bold shrink-0">Q{questionNumber}</span>
          <span className="text-foreground">{question.content}</span>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-6 py-4 bg-muted/30">
        {/* Toggle Button for Answer Visibility (Owner Only) */}
        {isOwner && (
          <div className="answer-toggle-container mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
              aria-label={showCorrectAnswers ? "Hide correct answer" : "Show correct answer"}
            >
              {showCorrectAnswers ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Answer
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Answer
                </>
              )}
            </Button>
          </div>
        )}

        {/* Answer Options */}
        <OptionsList options={question.options} showCorrectAnswers={showCorrectAnswers} />

        {/* Explanation Section */}
        {hasExplanation && (
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-2">Explanation</h4>
            <p className="text-sm text-muted-foreground">{question.explanation}</p>
          </div>
        )}
      </AccordionContent>
    </>
  );
}
