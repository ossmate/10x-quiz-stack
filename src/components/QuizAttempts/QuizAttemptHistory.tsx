import { useState, useMemo } from "react";
import { useQuizAttemptHistory } from "../../hooks/useQuizAttemptHistory";
import { AttemptHistoryHeader } from "./AttemptHistoryHeader";
import { AttemptsTable } from "./AttemptsTable";
import { EmptyState } from "./EmptyState";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

interface QuizAttemptHistoryProps {
  quizId: string;
  userId?: string;
}

const INITIAL_DISPLAY_LIMIT = 10;

export function QuizAttemptHistory({ quizId, userId }: QuizAttemptHistoryProps) {
  const { attempts, quickStats, isLoading, error, refetch } = useQuizAttemptHistory({ quizId, userId });
  const [isOpen, setIsOpen] = useState(true); // Start expanded by default
  const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT);

  // Limit the number of displayed attempts
  const displayedAttempts = useMemo(() => attempts.slice(0, displayLimit), [attempts, displayLimit]);
  const hasMore = attempts.length > displayLimit;

  // Don't render for unauthenticated users
  if (!userId) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <section className="mt-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading your scoreboard...</span>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Your Scoreboard</h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to Load Scoreboard</AlertTitle>
          <AlertDescription>
            <p className="mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  // Empty state
  if (attempts.length === 0) {
    return (
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Your Scoreboard</h2>
        <EmptyState quizId={quizId} />
      </section>
    );
  }

  // Success state with attempts
  // Note: quickStats should always be defined when there are attempts
  if (!quickStats) {
    return null;
  }

  const handleShowMore = () => {
    setDisplayLimit((prev) => prev + INITIAL_DISPLAY_LIMIT);
  };

  const handleShowAll = () => {
    setDisplayLimit(attempts.length);
  };

  return (
    <section className="mt-8">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Your Scoreboard</h2>
            {attempts.length > INITIAL_DISPLAY_LIMIT && (
              <span className="text-sm text-muted-foreground">
                Showing {displayedAttempts.length} of {attempts.length} attempts
              </span>
            )}
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              {isOpen ? (
                <>
                  <span>Hide</span>
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Show Stats</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="space-y-4">
          <AttemptHistoryHeader quickStats={quickStats} />
          <AttemptsTable attempts={displayedAttempts} quizId={quizId} />

          {/* Show More / Show All buttons */}
          {hasMore && (
            <div className="flex justify-center gap-3 pt-4">
              <Button variant="outline" size="sm" onClick={handleShowMore}>
                Show More ({Math.min(INITIAL_DISPLAY_LIMIT, attempts.length - displayLimit)} more)
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShowAll}>
                Show All ({attempts.length})
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
