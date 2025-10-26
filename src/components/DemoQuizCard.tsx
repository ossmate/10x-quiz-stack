import type { DemoQuiz } from "../data/demoQuizzes";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";

interface DemoQuizCardProps {
  quiz: DemoQuiz;
  showDemoBadge?: boolean;
}

export function DemoQuizCard({ quiz, showDemoBadge = true }: DemoQuizCardProps) {
  const difficultyColors = {
    beginner: "bg-success text-success-foreground",
    intermediate: "bg-warning text-warning-foreground",
    advanced: "bg-destructive text-destructive-foreground",
  };

  return (
    <Card className="flex flex-col h-full transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <CardTitle className="text-xl">{quiz.title}</CardTitle>
          {showDemoBadge && (
            <Badge variant="secondary" className="shrink-0">
              Demo
            </Badge>
          )}
        </div>
        <CardDescription className="line-clamp-2">{quiz.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={difficultyColors[quiz.difficulty]}>
            {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
          </Badge>
          <Badge variant="outline">{quiz.category}</Badge>
          <Badge variant="outline">{quiz.estimatedTime}</Badge>
          <Badge variant="outline">{quiz.questions.length} questions</Badge>
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full">
          <a href={`/quizzes/${quiz.id}/take`}>Start Quiz</a>
        </Button>
      </CardFooter>
    </Card>
  );
}
