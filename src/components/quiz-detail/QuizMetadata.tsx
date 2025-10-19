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

  // Get status badge variant based on status
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "draft":
        return "secondary";
      case "public":
        return "default";
      case "private":
        return "outline";
      case "archived":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      {/* Status Badge - Always show */}
      <Badge variant={getStatusVariant(quiz.status)}>
        {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
      </Badge>

      {/* Source Badge */}
      {isAIGenerated && <Badge variant="outline">AI Generated</Badge>}

      {/* AI Model Badge */}
      {isAIGenerated && quiz.ai_model && <Badge variant="secondary">{quiz.ai_model}</Badge>}

      {/* Creation Date */}
      <span className="text-sm text-muted-foreground ml-2">Created {formatRelativeTime(quiz.created_at)}</span>
    </div>
  );
}
