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
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-primary/40 rounded-full animate-ping opacity-30"></div>
      </div>

      {/* Status message */}
      <div className="text-center">
        <p className="text-foreground font-medium">{statusMessage}</p>
        <p className="text-muted-foreground text-sm mt-2">This usually takes 10-20 seconds</p>
      </div>

      {/* Processing steps */}
      <div className="w-full max-w-md mt-4">
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-primary mr-3"></div>
            <span className="text-sm text-foreground">Analyzing your prompt</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-primary/60 mr-3"></div>
            <span className="text-sm text-foreground">Generating quiz structure</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-muted-foreground/40 mr-3"></div>
            <span className="text-sm text-foreground">Creating questions and answers</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-muted-foreground/40 mr-3"></div>
            <span className="text-sm text-foreground">Finalizing quiz content</span>
          </div>
        </div>
      </div>
    </div>
  );
}
