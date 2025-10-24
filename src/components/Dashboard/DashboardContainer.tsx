import { useDashboard } from "../../hooks/useDashboard.ts";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "./PageHeader.tsx";
import { QuizListTabs } from "./QuizListTabs.tsx";
import { LoadingSpinner } from "./LoadingSpinner.tsx";
import { ErrorAlert } from "./ErrorAlert.tsx";
import { EmptyState } from "./EmptyState.tsx";
import { QuizList } from "./QuizList.tsx";
import { navigate } from "astro:transitions/client";
import type { QuizListResponse } from "../../types.ts";

interface DashboardContainerProps {
  initialMyQuizzes?: QuizListResponse;
}

/**
 * Main dashboard container component that orchestrates the entire dashboard functionality
 * Manages tab state, data fetching, and renders appropriate child components
 *
 * @param props - Component props including optional SSR initial data
 * @returns DashboardContainer component
 */
export function DashboardContainer(props: DashboardContainerProps = {}) {
  const { initialMyQuizzes } = props;
  const { activeTab, myQuizzes, publicQuizzes, setActiveTab, goToPage, refetchMyQuizzes, refetchPublicQuizzes } =
    useDashboard({ initialMyQuizzes });

  // Get current tab data
  const currentData = activeTab === "my-quizzes" ? myQuizzes : publicQuizzes;
  const refetch = activeTab === "my-quizzes" ? refetchMyQuizzes : refetchPublicQuizzes;

  /**
   * Handle quiz card click - navigate to quiz detail page using Astro's client-side navigation
   */
  const handleQuizClick = (quizId: string) => {
    navigate(`/quizzes/${quizId}`);
  };

  /**
   * Handle empty state action - navigate to create quiz or refresh
   */
  const handleEmptyStateAction = () => {
    if (activeTab === "my-quizzes") {
      // Navigate to quiz creation page using Astro's client-side navigation
      navigate("/quizzes/ai/generate");
    } else {
      // Refresh public quizzes
      refetchPublicQuizzes();
    }
  };

  /**
   * Render content based on current state
   */
  const renderTabContent = () => {
    // Loading state
    if (currentData.isLoading) {
      return <LoadingSpinner message="Loading quizzes..." />;
    }

    // Error state
    if (currentData.error) {
      const errorMessage = currentData.error instanceof Error ? currentData.error.message : String(currentData.error);
      return <ErrorAlert title="Failed to Load Quizzes" message={errorMessage} onRetry={refetch} />;
    }

    // Empty state
    if (!currentData.data || currentData.data.quizzes.length === 0) {
      return <EmptyState type={activeTab} onAction={handleEmptyStateAction} />;
    }

    // Data state - show quiz list
    return (
      <QuizList
        quizzes={currentData.data.quizzes}
        pagination={currentData.data.pagination}
        onPageChange={goToPage}
        onQuizClick={handleQuizClick}
        showOwnership={activeTab === "public-quizzes"}
        isLoading={currentData.isLoading}
      />
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Dashboard"
        description="View and manage your quizzes, or explore public quizzes from the community."
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "my-quizzes" | "public-quizzes")}>
        <QuizListTabs onTabChange={setActiveTab} />

        <TabsContent value="my-quizzes" className="mt-6">
          {renderTabContent()}
        </TabsContent>

        <TabsContent value="public-quizzes" className="mt-6">
          {renderTabContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
