import type { QuizDetailDTO, ProgressInfo } from "../../types";
import { ProgressIndicator } from "./ProgressIndicator";

interface QuizTakingHeaderProps {
  quiz: QuizDetailDTO;
  progressInfo: ProgressInfo;
}

/**
 * Header component for quiz-taking view
 * Displays quiz title and progress indicator
 */
export function QuizTakingHeader({ quiz, progressInfo }: QuizTakingHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold mb-4">{quiz.title}</h1>
      {quiz.description && <p className="text-muted-foreground mb-4">{quiz.description}</p>}
      <ProgressIndicator
        current={progressInfo.current}
        total={progressInfo.total}
        answered={progressInfo.answered}
        percentage={progressInfo.percentage}
      />
    </header>
  );
}
