import { useState } from "react";
import type { QuestionWithOptionsDTO } from "../../types.ts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OptionsList } from "./OptionsList.tsx";

interface QuestionCardProps {
  question: QuestionWithOptionsDTO;
  questionNumber: number;
  showCorrectAnswers: boolean;
  className?: string;
}

/**
 * Displays a single question with its content, options, and optional explanation
 * Uses Card component for consistent styling
 */
export function QuestionCard({ question, questionNumber, showCorrectAnswers, className }: QuestionCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const hasExplanation =
    question.explanation !== undefined && question.explanation !== null && question.explanation.trim() !== "";

  // Defensive check for options
  if (!question.options || question.options.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Question {questionNumber}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-900 mb-4">{question.content}</p>
          <p className="text-yellow-600 text-sm">⚠️ This question has no answer options.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="flex-1">
            <span className="text-blue-600 font-bold">Question {questionNumber}</span>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        {/* Question Content */}
        <p className="text-gray-900 text-base mb-6">{question.content}</p>

        {/* Answer Options */}
        <OptionsList options={question.options} showCorrectAnswers={showCorrectAnswers} />

        {/* Explanation Section (collapsible) */}
        {hasExplanation && (
          <div className="mt-6 pt-6 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExplanation(!showExplanation)}
              aria-expanded={showExplanation}
              aria-controls={`explanation-${question.id}`}
              className="mb-2"
            >
              {showExplanation ? "Hide" : "Show"} Explanation
            </Button>

            {showExplanation && (
              <div
                id={`explanation-${question.id}`}
                className="bg-blue-50 border border-blue-200 rounded-md p-4"
                aria-hidden={!showExplanation}
              >
                <p className="text-sm text-gray-700">{question.explanation}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
