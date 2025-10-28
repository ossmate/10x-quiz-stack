import { Table, TableBody } from "../ui/table";
import { AttemptRow } from "./AttemptRow";
import { AttemptCard } from "./AttemptCard";
import type { QuizAttemptSummary } from "../../types/quiz-attempts.types";

interface AttemptsTableProps {
  attempts: QuizAttemptSummary[];
  quizId: string;
}

export function AttemptsTable({ attempts, quizId }: AttemptsTableProps) {
  return (
    <>
      {/* Desktop Scoreboard View */}
      <div className="hidden md:block">
        <Table>
          <TableBody>
            {attempts.map((attempt, index) => (
              <AttemptRow key={attempt.id} attempt={attempt} attemptNumber={attempts.length - index} quizId={quizId} />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {attempts.map((attempt, index) => (
          <AttemptCard key={attempt.id} attempt={attempt} attemptNumber={attempts.length - index} quizId={quizId} />
        ))}
      </div>
    </>
  );
}
