import { ClipboardList } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface EmptyStateProps {
  quizId: string;
}

export function EmptyState({ quizId }: EmptyStateProps) {
  return (
    <Card className="p-12 text-center bg-muted/30">
      <ClipboardList className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">No Attempts Yet</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Take this quiz to track your progress and see your improvement over time. Your scores will appear here as a
        scoreboard.
      </p>
      <Button asChild>
        <a href={`/quizzes/${quizId}/take`}>Take Your First Quiz</a>
      </Button>
    </Card>
  );
}
