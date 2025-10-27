import { format } from "date-fns";
import { Badge } from "../ui/badge";
import { TableCell, TableRow } from "../ui/table";
import { Clock, Calendar } from "lucide-react";
import type { QuizAttemptSummary } from "../../types/quiz-attempts.types";

interface AttemptRowProps {
  attempt: QuizAttemptSummary;
  attemptNumber: number;
  quizId: string;
}

export function AttemptRow({ attempt, attemptNumber, quizId }: AttemptRowProps) {
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
    <TableRow className="hover:bg-muted/30 cursor-pointer transition-colors">
      <TableCell>
        <a href={`/quizzes/${quizId}/results?attemptId=${attempt.id}`} className="flex items-center gap-4 py-2">
          {/* Attempt Number */}
          <div className="min-w-[80px]">
            <span className="text-sm font-semibold text-muted-foreground">ATTEMPT</span>
            <div className="text-2xl font-bold text-foreground">#{attemptNumber}</div>
          </div>

          {/* Score - Prominent */}
          <div className="min-w-[100px]">
            <Badge className={`text-2xl font-bold px-4 py-2 ${getScoreColor(attempt.score)}`}>{attempt.score}%</Badge>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 min-w-[140px]">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium text-foreground">
                {format(new Date(attempt.completed_at), "MMM d, yyyy")}
              </div>
              <div className="text-xs text-muted-foreground">{format(new Date(attempt.completed_at), "h:mm a")}</div>
            </div>
          </div>

          {/* Time Taken */}
          <div className="flex items-center gap-2 min-w-[100px]">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{formatTimeTaken(attempt.time_spent)}</span>
          </div>

          {/* Correct Answers */}
          <div className="text-right min-w-[100px]">
            <div className="text-sm text-muted-foreground">Correct</div>
            <div className="text-lg font-semibold text-foreground">
              {((attempt.score / 100) * attempt.total_questions).toFixed(0)}/{attempt.total_questions}
            </div>
          </div>
        </a>
      </TableCell>
    </TableRow>
  );
}
