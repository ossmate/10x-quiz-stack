import React, { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Info, AlertTriangle } from "lucide-react";

/**
 * Represents a user's AI quiz generation quota information
 */
interface UserQuota {
  /** Number of AI quizzes the user has generated */
  used: number;
  /** Maximum number of AI quizzes the user can generate */
  limit: number;
  /** Number of remaining generations */
  remaining: number;
  /** Whether the user has reached their generation limit */
  hasReachedLimit: boolean;
}

/**
 * AIQuotaDisplay - Shows user's AI quiz generation quota status
 *
 * Displays:
 * - Number of remaining generations
 * - Progress bar showing usage
 * - Warning when limit is reached
 *
 * @param props.onQuotaLoaded - Optional callback when quota is loaded
 */
export function AIQuotaDisplay({ onQuotaLoaded }: { onQuotaLoaded?: (quota: UserQuota) => void }) {
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuota();
  }, []);

  const fetchQuota = async () => {
    try {
      const response = await fetch("/api/user/ai-quota");

      if (!response.ok) {
        throw new Error("Failed to fetch quota information");
      }

      const data = await response.json();
      setQuota(data);

      // Call callback if provided
      if (onQuotaLoaded) {
        onQuotaLoaded(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load quota information";
      setError(errorMessage);
      console.error("Failed to fetch quota:", err);
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything while loading
  if (loading) {
    return null;
  }

  // Show error state
  if (error || !quota) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Unable to Load Quota</AlertTitle>
        <AlertDescription>
          <p>{error || "Could not retrieve your AI generation quota."}</p>
        </AlertDescription>
      </Alert>
    );
  }

  const percentage = quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0;

  return (
    <Alert variant={quota.hasReachedLimit ? "destructive" : "default"}>
      {quota.hasReachedLimit ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
      <AlertTitle>AI Quiz Generation Limit</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">
            {quota.used} / {quota.limit} AI quiz generation{quota.limit !== 1 ? "s" : ""} used
          </p>
          <Progress value={percentage} className="h-2" />
          {quota.hasReachedLimit ? (
            <p className="text-sm">
              You&apos;ve reached your generation limit. To generate more quizzes, you can delete existing AI-generated
              quizzes or check back later for more quota.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              You have {quota.remaining} generation{quota.remaining !== 1 ? "s" : ""} remaining.
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
