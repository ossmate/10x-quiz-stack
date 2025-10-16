import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ScoreSummaryProps {
  score: number;
  totalQuestions: number;
  percentage: number;
  correctAnswers: number;
  className?: string;
}

/**
 * Displays quiz completion summary with score and percentage
 * Shows encouraging message based on performance
 */
export function ScoreSummary({ score, totalQuestions, percentage, className }: ScoreSummaryProps) {
  const getMessage = () => {
    if (percentage >= 90) return "Excellent work!";
    if (percentage >= 80) return "Great job!";
    if (percentage >= 70) return "Good effort!";
    if (percentage >= 60) return "Nice try!";
    return "Keep practicing!";
  };

  const getColorClass = () => {
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-blue-600 dark:text-blue-400";
    return "text-orange-600 dark:text-orange-400";
  };

  return (
    <Card className={cn("mb-8 p-8 text-center", className)}>
      <h2 className="text-2xl font-bold mb-6">Quiz Complete!</h2>

      <div className="space-y-4">
        {/* Score Display */}
        <div className={cn("text-6xl font-bold", getColorClass())}>
          {score} / {totalQuestions}
        </div>

        {/* Percentage */}
        <div className="text-xl text-muted-foreground">{percentage.toFixed(0)}%</div>

        {/* Progress Bar */}
        <div className="w-full max-w-md mx-auto bg-secondary rounded-full h-3 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", {
              "bg-green-500": percentage >= 80,
              "bg-blue-500": percentage >= 60 && percentage < 80,
              "bg-orange-500": percentage < 60,
            })}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Encouraging Message */}
        <p className="text-lg font-semibold mt-6">{getMessage()}</p>
      </div>
    </Card>
  );
}
