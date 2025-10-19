import type { QuizDetailDTO } from "../../types";
import { LoadingSpinner } from "../Dashboard/LoadingSpinner";
import { ErrorAlert } from "../Dashboard/ErrorAlert";

interface ContentAreaProps {
  activeTab: string;
  quiz: QuizDetailDTO | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

/**
 * ContentArea component that dynamically renders content based on active tab
 * Handles loading states, errors, and different view modes
 */
export function ContentArea({ activeTab, quiz, isLoading, error, onRetry }: ContentAreaProps) {
  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="py-8">
        <ErrorAlert message={error} onRetry={onRetry} />
      </div>
    );
  }

  // Handle no quiz data
  if (!quiz) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No quiz data available</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // Render content based on active tab
  switch (activeTab) {
    case "details":
      return <DetailsTabContent quiz={quiz} />;
    case "edit":
      return <EditTabContent quiz={quiz} />;
    case "statistics":
      return <StatisticsTabContent quiz={quiz} />;
    default:
      return (
        <div className="py-12 text-center">
          <p className="text-gray-500">Unknown tab: {activeTab}</p>
        </div>
      );
  }
}

/**
 * Details tab - shows quiz information and questions
 */
function DetailsTabContent({ quiz }: { quiz: QuizDetailDTO }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">{quiz.title}</h2>
        <p className="text-gray-700">{quiz.description}</p>

        <div className="mt-4 flex flex-wrap gap-4">
          <div className="text-sm">
            <span className="font-semibold text-gray-700">Status:</span>
            <span className="ml-2 text-gray-600">{quiz.status}</span>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-gray-700">Source:</span>
            <span className="ml-2 text-gray-600">{quiz.source}</span>
          </div>
          {quiz.questions && (
            <div className="text-sm">
              <span className="font-semibold text-gray-700">Questions:</span>
              <span className="ml-2 text-gray-600">{quiz.questions.length}</span>
            </div>
          )}
        </div>
      </div>

      {quiz.questions && quiz.questions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Questions</h3>
          {quiz.questions.map((question, index) => (
            <div key={question.id} className="rounded-lg bg-white p-6 shadow">
              <h4 className="mb-3 font-semibold text-gray-900">
                {index + 1}. {question.content}
              </h4>
              {question.options && question.options.length > 0 && (
                <ul className="space-y-2">
                  {question.options.map((option) => (
                    <li
                      key={option.id}
                      className={`rounded-md px-3 py-2 ${
                        option.is_correct ? "bg-green-50 text-green-800" : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      {option.content}
                      {option.is_correct && <span className="ml-2 text-xs font-semibold">(Correct)</span>}
                    </li>
                  ))}
                </ul>
              )}
              {question.explanation && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Explanation:</span> {question.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Edit tab - placeholder for edit functionality
 */
function EditTabContent({ quiz }: { quiz: QuizDetailDTO }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-2xl font-bold text-gray-900">Edit Quiz</h2>
      <p className="text-gray-600">Edit functionality for quiz: {quiz.title}</p>
      <div className="mt-6 text-center">
        <p className="text-gray-500">Edit form coming soon...</p>
      </div>
    </div>
  );
}

/**
 * Statistics tab - placeholder for statistics
 */
function StatisticsTabContent({ quiz }: { quiz: QuizDetailDTO }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-2xl font-bold text-gray-900">Quiz Statistics</h2>
      <p className="text-gray-600">Statistics for quiz: {quiz.title}</p>
      <div className="mt-6 text-center">
        <p className="text-gray-500">Statistics view coming soon...</p>
        <p className="mt-2 text-sm text-gray-400">This will show attempt counts, success rates, and other metrics</p>
      </div>
    </div>
  );
}
