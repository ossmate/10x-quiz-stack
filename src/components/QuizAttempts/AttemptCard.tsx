import { format } from "date-fns";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Clock, Calendar } from "lucide-react";
import type { QuizAttemptSummary } from "../../types/quiz-attempts.types";

interface AttemptCardProps {
  attempt: QuizAttemptSummary;
  attemptNumber: number;
  quizId: string;
}

export function AttemptCard({ attempt, attemptNumber, quizId }: AttemptCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-success/10 text-success border-success/20";
    if (score >= 60) return "bg-primary/10 text-primary border-primary/20";
    return "bg-destructive/10 text-destructive border-destructive/20";
  };

  const formatTimeTaken = (timeSpent: number | null) => {
    if (!timeSpent) return "N/A";

    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;

    if (minutes === 0) return `${seconds}s`;
    if (seconds === 0) return `${minutes}m`;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <a href={`/quizzes/${quizId}/results?attemptId=${attempt.id}`}>
      <Card className="p-4 hover:shadow-md transition-all hover:border-primary/40 cursor-pointer">
        {/* Header: Attempt number and score */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-muted-foreground">ATTEMPT #{attemptNumber}</span>
          <Badge className={`text-2xl font-bold px-4 py-1 ${getScoreColor(attempt.score)}`}>{attempt.score}%</Badge>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(attempt.completed_at), "MMM d, yyyy")}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatTimeTaken(attempt.time_spent)}</span>
          </div>

          <div className="text-sm text-muted-foreground pt-2 border-t">
            <span className="font-medium text-foreground">
              {((attempt.score / 100) * attempt.total_questions).toFixed(0)}
            </span>
            /{attempt.total_questions} correct
          </div>
        </div>
      </Card>
    </a>
  );
}
