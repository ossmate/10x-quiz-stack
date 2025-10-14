import { QuizCard } from "./QuizCard.tsx";
import { PaginationControls } from "./PaginationControls.tsx";
import type { QuizDTO } from "../../types.ts";
import type { PaginationMetadata } from "../../types/dashboard.types.ts";

/**
 * Props for QuizList component
 */
interface QuizListProps {
  quizzes: QuizDTO[];
  pagination: PaginationMetadata;
  onPageChange: (page: number) => void;
  onQuizClick?: (quizId: string) => void;
  showOwnership?: boolean;
  isLoading?: boolean;
}

/**
 * Container component that renders a grid of quiz cards and pagination controls
 *
 * @param props - Component props
 * @returns QuizList component
 */
export function QuizList({
  quizzes,
  pagination,
  onPageChange,
  onQuizClick,
  showOwnership = false,
  isLoading = false,
}: QuizListProps) {
  // Handle quiz card click
  const handleQuizClick = (quizId: string) => {
    if (onQuizClick) {
      onQuizClick(quizId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quiz Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.map((quiz) => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            onClick={handleQuizClick}
            showOwnership={showOwnership}
            className={isLoading ? "pointer-events-none opacity-50" : ""}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        onPageChange={onPageChange}
        disabled={isLoading}
      />
    </div>
  );
}
