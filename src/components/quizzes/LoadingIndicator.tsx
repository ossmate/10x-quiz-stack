/**
 * LoadingIndicator - Visual feedback component displaying AI generation progress
 * with animated indicators and descriptive text
 */
export function LoadingIndicator({
  isLoading,
  statusMessage = "Loading...",
}: {
  isLoading: boolean;
  statusMessage?: string;
}) {
  if (!isLoading) return null;

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      {/* Spinner animation */}
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-blue-400 rounded-full animate-ping opacity-30"></div>
      </div>

      {/* Status message */}
      <div className="text-center">
        <p className="text-gray-700 font-medium">{statusMessage}</p>
        <p className="text-gray-500 text-sm mt-2">This usually takes 10-20 seconds</p>
      </div>

      {/* Processing steps */}
      <div className="w-full max-w-md mt-4">
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-blue-500 mr-3"></div>
            <span className="text-sm text-gray-700">Analyzing your prompt</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-blue-300 mr-3"></div>
            <span className="text-sm text-gray-700">Generating quiz structure</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-gray-300 mr-3"></div>
            <span className="text-sm text-gray-700">Creating questions and answers</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-gray-300 mr-3"></div>
            <span className="text-sm text-gray-700">Finalizing quiz content</span>
          </div>
        </div>
      </div>
    </div>
  );
}
