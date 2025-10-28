import { QuickStats } from "./QuickStats";
import type { QuickStatsData } from "../../types/quiz-attempts.types";

interface AttemptHistoryHeaderProps {
  quickStats: QuickStatsData;
}

export function AttemptHistoryHeader({ quickStats }: AttemptHistoryHeaderProps) {
  return (
    <div className="mb-4">
      <QuickStats stats={quickStats} />
    </div>
  );
}
