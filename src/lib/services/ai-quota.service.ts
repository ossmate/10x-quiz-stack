import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types.ts";

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Represents a user's AI quiz generation quota information
 */
export interface UserQuota {
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
 * Service for managing AI quiz generation quotas
 *
 * This service tracks how many AI-generated quizzes a user has created
 * and enforces limits on generation to control costs and resource usage.
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

    // Count AI-generated quizzes by querying metadata JSONB column
    // Note: source is stored in metadata as: metadata->>'source' = 'ai_generated'
    const { count, error } = await supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .filter("metadata->>source", "eq", "ai_generated")
      .is("deleted_at", null); // Exclude soft-deleted quizzes

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
   * @returns The maximum number of AI quizzes a user can generate
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
