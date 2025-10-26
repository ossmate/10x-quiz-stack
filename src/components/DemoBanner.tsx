import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { X } from "lucide-react";

const BANNER_STORAGE_KEY = "demo-banner-dismissed";

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem(BANNER_STORAGE_KEY);
    if (dismissed === "true") {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem(BANNER_STORAGE_KEY, "true");
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="relative bg-primary/10 border-b border-primary/20 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 text-sm md:text-base">
          <p className="font-medium text-foreground">
            You&apos;re taking a demo quiz.{" "}
            <span className="text-muted-foreground">Sign up to save your progress and create your own quizzes!</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="default">
            <a href="/auth/register">Sign Up</a>
          </Button>

          <button
            onClick={handleDismiss}
            className="rounded-md p-1 hover:bg-muted transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
