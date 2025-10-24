import { QueryProvider } from "../providers/QueryProvider.tsx";
import { DashboardContainer } from "./DashboardContainer.tsx";
import type { QuizListResponse } from "../../types.ts";

interface DashboardWithProviderProps {
  initialMyQuizzes?: QuizListResponse | null;
}

/**
 * Wrapper component that combines QueryProvider and DashboardContainer
 * This ensures they're in the same React tree when hydrated by Astro
 */
export function DashboardWithProvider({ initialMyQuizzes }: DashboardWithProviderProps) {
  return (
    <QueryProvider>
      <DashboardContainer initialMyQuizzes={initialMyQuizzes || undefined} />
    </QueryProvider>
  );
}
