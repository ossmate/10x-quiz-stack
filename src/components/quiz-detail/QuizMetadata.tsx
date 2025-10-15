import type { QuizDTO } from "../../types.ts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuizMetadataProps {
  quiz: QuizDTO;
  className?: string;
}

/**
 * Formats a date string to relative time (e.g., "2 days ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return "just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  }
  if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  }
  if (diffMonths < 12) {
    return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
  }
  return `${diffYears} ${diffYears === 1 ? "year" : "years"} ago`;
}

/**
 * Metadata component displaying quiz badges and creation date
 * Shows visibility, source, AI model info, and status badges
 */
export function QuizMetadata({ quiz, className }: QuizMetadataProps) {
  const isAIGenerated = quiz.source === "ai_generated";
  // Show status badge for draft or archived quizzes
  const showStatusBadge = quiz.status === "draft" || quiz.status === "archived";

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      {/* Visibility Badge */}
      <Badge variant={quiz.visibility === "public" ? "default" : "secondary"}>
        {quiz.visibility === "public" ? "Public" : "Private"}
      </Badge>

      {/* Source Badge */}
      {isAIGenerated && <Badge variant="outline">AI Generated</Badge>}

      {/* AI Model Badge */}
      {isAIGenerated && quiz.ai_model && <Badge variant="secondary">{quiz.ai_model}</Badge>}

      {/* Status Badge (show for draft or archived) */}
      {showStatusBadge && (
        <Badge variant={quiz.status === "archived" ? "destructive" : "secondary"}>
          {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
        </Badge>
      )}

      {/* Creation Date */}
      <span className="text-sm text-gray-500 ml-2">Created {formatRelativeTime(quiz.created_at)}</span>
    </div>
  );
}
