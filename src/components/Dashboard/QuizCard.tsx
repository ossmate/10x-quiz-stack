import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/utils/date";
import type { QuizDTO } from "../../types.ts";

/**
 * Props for QuizCard component
 */
interface QuizCardProps {
  quiz: QuizDTO;
  questionCount?: number;
  onClick?: (quizId: string) => void;
  showOwnership?: boolean;
  className?: string;
}

/**
 * Individual quiz card component displaying summary information
 *
 * @param props - Component props
 * @returns QuizCard component
 */
export function QuizCard({ quiz, questionCount, onClick, showOwnership = false, className }: QuizCardProps) {
  const formattedDate = formatDistanceToNow(new Date(quiz.created_at));

  const handleClick = () => {
    if (onClick) {
      onClick(quiz.id);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View quiz: ${quiz.title}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 flex-1">{quiz.title}</CardTitle>
          {quiz.status !== "active" && (
            <Badge variant="outline" className="shrink-0">
              {quiz.status}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant={quiz.status === "public" ? "default" : quiz.status === "private" ? "outline" : "secondary"}>
            {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
          </Badge>
          {quiz.source === "ai_generated" && (
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
            >
              AI Generated
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">{quiz.description || "No description provided"}</p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <span>Created {formattedDate}</span>
          {questionCount !== undefined && (
            <span>
              {questionCount} {questionCount === 1 ? "question" : "questions"}
            </span>
          )}
        </div>
        {showOwnership && (quiz.user_email || quiz.user_id) && (
          <span className="text-xs text-muted-foreground">
            By: {quiz.user_email || `User ${quiz.user_id.slice(0, 8)}`}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
