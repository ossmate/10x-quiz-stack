import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { CheckCircle2, TrendingUp, Sparkles, BarChart3 } from "lucide-react";

interface DemoCompletionModalProps {
  isOpen: boolean;
  score: number;
  totalQuestions: number;
  onClose: () => void;
}

export function DemoCompletionModal({ isOpen, score, totalQuestions, onClose }: DemoCompletionModalProps) {
  const percentage = Math.round((score / totalQuestions) * 100);

  const features = [
    {
      icon: <BarChart3 className="h-5 w-5 text-primary" />,
      title: "Track Your Progress",
      description: "View detailed analytics and track improvement over time",
    },
    {
      icon: <Sparkles className="h-5 w-5 text-primary" />,
      title: "AI Quiz Generation",
      description: "Create custom quizzes instantly with AI assistance",
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      title: "Save Quiz History",
      description: "Access all your quiz attempts and results anytime",
    },
  ];

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-success" />
          </div>
          <AlertDialogTitle className="text-center text-2xl">Great job!</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-lg pt-2">
            You scored{" "}
            <span className="font-bold text-foreground">
              {score} out of {totalQuestions}
            </span>{" "}
            ({percentage}%)
          </AlertDialogDescription>
          <AlertDialogDescription className="text-center text-sm pt-3 text-muted-foreground">
            Note: Demo quiz results are not saved. Sign up to track your progress!
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-6">
          <h3 className="font-semibold text-lg mb-4 text-center">Unlock more features with a free account:</h3>
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="shrink-0 mt-0.5">{feature.icon}</div>
                <div>
                  <h4 className="font-medium text-foreground">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          <Button asChild size="lg" className="w-full">
            <a href="/auth/register">Sign Up for Free</a>
          </Button>
          <div className="flex gap-2 w-full">
            <Button asChild variant="outline" size="lg" className="flex-1">
              <a href="/">Browse Demos</a>
            </Button>
            <Button variant="ghost" size="lg" onClick={onClose} className="flex-1">
              View Results
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
