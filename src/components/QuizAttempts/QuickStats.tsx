import { Trophy, TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import { Card } from "../ui/card";
import type { QuickStatsData } from "../../types/quiz-attempts.types";

interface QuickStatsProps {
  stats: QuickStatsData;
}

export function QuickStats({ stats }: QuickStatsProps) {
  const getTrendIcon = () => {
    if (stats.trend === "improving") return <TrendingUp className="h-4 w-4 text-success" />;
    if (stats.trend === "declining") return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendText = () => {
    if (stats.trend === "improving") return `+${stats.trendValue}%`;
    if (stats.trend === "declining") return `${stats.trendValue}%`;
    return "Stable";
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {/* Best Score - Highlighted */}
      <Card className="p-4 border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 mb-1">
          {stats.bestScore === 100 && <Trophy className="h-4 w-4 text-yellow-500" />}
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Best Score</span>
        </div>
        <div className="text-3xl font-bold text-primary">{stats.bestScore}%</div>
      </Card>

      {/* Average Score */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Average</span>
        </div>
        <div className="text-3xl font-bold text-foreground">{stats.averageScore}%</div>
      </Card>

      {/* Total Attempts */}
      <Card className="p-4">
        <div className="mb-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Attempts</span>
        </div>
        <div className="text-3xl font-bold text-foreground">{stats.totalAttempts}</div>
      </Card>

      {/* Trend */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-1">
          {getTrendIcon()}
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trend</span>
        </div>
        <div className="text-2xl font-bold text-foreground">{getTrendText()}</div>
      </Card>
    </div>
  );
}
