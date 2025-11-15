import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types.ts";

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Represents a user's AI quiz generation quota information
 */
export interface UserQuota {
  /** Number of AI generation attempts the user has made */
  used: number;
  /** Maximum number of AI generation attempts the user can make */
  limit: number;
  /** Number of remaining generation attempts */
  remaining: number;
  /** Whether the user has reached their generation limit */
  hasReachedLimit: boolean;
}

/**
 * Service for managing AI quiz generation quotas
 *
 * This service tracks how many AI generation attempts a user has made
 * (regardless of whether they saved the quiz) and enforces limits on
 * generation to control costs and resource usage.
 */
export class AIQuotaService {
  /**
   * Get user's current AI quiz generation quota
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user to check quota for
   * @returns Promise resolving to the user's quota information
   * @throws Error if database query fails
   */
  async getUserQuota(supabase: SupabaseClientType, userId: string): Promise<UserQuota> {
    const limit = this.getQuotaLimit();

    // Count AI generation attempts by querying ai_usage_logs table
    // This counts actual generation attempts, not just saved quizzes
    // This prevents users from generating unlimited quizzes without saving them
    const { count, error } = await supabase
      .from("ai_usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to fetch user quota: ${error.message}`);
    }

    const used = count ?? 0;
    const remaining = Math.max(0, limit - used);
    const hasReachedLimit = used >= limit;

    return { used, limit, remaining, hasReachedLimit };
  }

  /**
   * Check if user can generate more AI quizzes
   *
   * @param supabase - Supabase client instance
   * @param userId - ID of the user to check
   * @returns Promise resolving to true if user can generate, false otherwise
   * @throws Error if database query fails
   */
  async canGenerateQuiz(supabase: SupabaseClientType, userId: string): Promise<boolean> {
    const quota = await this.getUserQuota(supabase, userId);
    return !quota.hasReachedLimit;
  }

  /**
   * Get quota limit from environment variable or use default
   *
   * @returns The maximum number of AI generation attempts a user can make
   * @private
   */
  private getQuotaLimit(): number {
    const envLimit = import.meta.env.AI_QUIZ_GENERATION_LIMIT_DEFAULT;

    // Try to parse environment variable, fall back to default of 2
    if (envLimit !== undefined && envLimit !== null) {
      const parsed = parseInt(String(envLimit), 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return 2; // Default limit
  }
}
