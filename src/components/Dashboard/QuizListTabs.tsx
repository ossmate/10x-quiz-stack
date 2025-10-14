import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TabType } from "../../types/dashboard.types.ts";

/**
 * Props for QuizListTabs component
 */
interface QuizListTabsProps {
  onTabChange: (tab: TabType) => void;
}

/**
 * Tab navigation component for switching between My Quizzes and Public Quizzes
 *
 * @param props - Component props
 * @returns QuizListTabs component
 */
export function QuizListTabs({ onTabChange }: QuizListTabsProps) {
  return (
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="my-quizzes" onClick={() => onTabChange("my-quizzes")}>
        My Quizzes
      </TabsTrigger>
      <TabsTrigger value="public-quizzes" onClick={() => onTabChange("public-quizzes")}>
        Public Quizzes
      </TabsTrigger>
    </TabsList>
  );
}
