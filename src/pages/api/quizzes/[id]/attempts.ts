import type { APIRoute } from "astro";
import { z } from "zod";
import type { QuizAttemptDTO } from "@/types";
import type { QuizAttemptsListResponse } from "@/types/quiz-attempts.types";
import { createSupabaseServerInstance } from "../../../../db/supabase.client.ts";

export const prerender = false;

/**
 * GET /api/quizzes/[id]/attempts
 * Fetch all completed attempts for the authenticated user for a specific quiz
 */
export const GET: APIRoute = async ({ params, request, cookies }) => {
  const quizId = params.id;

  if (!quizId) {
    return new Response(JSON.stringify({ error: "Quiz ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create Supabase client with session
  const supabaseClient = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const currentUserId = user.id;

  try {
    // Validate quiz exists and user has access to it
    // Query includes status and user_id to check access
    const { data: quiz, error: quizError } = await supabaseClient
      .from("quizzes")
      .select("id, status, user_id")
      .eq("id", quizId)
      .is("deleted_at", null)
      .single();

    if (quizError) {
      console.error("Quiz lookup error:", { quizId, quizError });
      return new Response(JSON.stringify({ error: "Quiz not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!quiz) {
      return new Response(JSON.stringify({ error: "Quiz not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has access to this quiz's attempts
    // Only the quiz creator can see attempts for draft quizzes
    if (quiz.status === "draft" && quiz.user_id !== currentUserId) {
      return new Response(JSON.stringify({ error: "Quiz not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch all completed attempts by this user
    const { data: attempts, error: attemptsError } = await supabaseClient
      .from("quiz_attempts")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("user_id", currentUserId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });

    if (attemptsError) {
      console.error("Error fetching quiz attempts:", attemptsError);
      throw attemptsError;
    }

    // Transform attempts to ensure score is a percentage and time_spent is calculated
    // Legacy attempts may have raw counts instead of percentages and missing time_spent
    const transformedAttempts = (attempts || []).map((attempt) => {
      const transformedAttempt = { ...attempt };

      // If score is less than or equal to total_questions, it's likely a raw count
      // Convert it to percentage
      if (attempt.total_questions > 0 && attempt.score <= attempt.total_questions) {
        transformedAttempt.score = Math.round((attempt.score / attempt.total_questions) * 100);
      }

      // If time_spent is null but we have both created_at and completed_at, calculate it
      if (transformedAttempt.time_spent === null && transformedAttempt.completed_at) {
        const startTime = new Date(transformedAttempt.created_at).getTime();
        const endTime = new Date(transformedAttempt.completed_at).getTime();
        transformedAttempt.time_spent = Math.round((endTime - startTime) / 1000);
      }

      return transformedAttempt;
    });

    // Compute stats from transformed scores
    const scores = transformedAttempts.map((a) => a.score);
    const stats = {
      best_score: scores.length > 0 ? Math.max(...scores) : 0,
      average_score: scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : 0,
      total_attempts: transformedAttempts.length,
    };

    const response: QuizAttemptsListResponse = {
      attempts: transformedAttempts,
      stats,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching quiz attempts:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/quizzes/[id]/attempts
 * Create a new quiz attempt
 */
export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    const quizId = params.id;

    // Check if this is a demo quiz - demo quizzes cannot have attempts saved
    if (quizId?.startsWith("demo-")) {
      return new Response(JSON.stringify({ message: "Cannot create attempts for demo quizzes" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate quiz ID
    if (!quizId || !z.string().uuid().safeParse(quizId).success) {
      return new Response(JSON.stringify({ message: "Invalid quiz ID format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create SSR-compatible client for authentication
    const supabaseClient = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Check authentication using SSR client
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ message: "User not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const currentUserId = user.id;

    // Verify quiz exists and user has access (owner OR quiz is public)
    const { data: quiz, error: quizError } = await supabaseClient
      .from("quizzes")
      .select("id, user_id, status")
      .eq("id", quizId)
      .is("deleted_at", null)
      .single();

    if (quizError || !quiz) {
      // eslint-disable-next-line no-console
      console.error("Quiz verification failed:", quizError);
      return new Response(JSON.stringify({ message: "Quiz not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check access permission: user is owner OR quiz is public
    const hasAccess = quiz.user_id === currentUserId || quiz.status === "public";
    if (!hasAccess) {
      return new Response(JSON.stringify({ message: "You don't have access to this quiz" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get question count separately
    const { count: questionCount, error: countError } = await supabaseClient
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("quiz_id", quizId)
      .is("deleted_at", null);

    if (countError) {
      // eslint-disable-next-line no-console
      console.error("Question count error:", countError);
    }

    const totalQuestions = questionCount || 0;

    if (totalQuestions === 0) {
      return new Response(JSON.stringify({ message: "Quiz has no questions" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create quiz attempt
    const { data: attempt, error: attemptError } = await supabaseClient
      .from("quiz_attempts")
      .insert({
        quiz_id: quizId,
        user_id: currentUserId,
        score: 0,
        total_questions: totalQuestions,
        // completed_at is omitted - will default to null and be set when quiz is submitted
      })
      .select()
      .single();

    if (attemptError || !attempt) {
      // eslint-disable-next-line no-console
      console.error("Failed to create quiz attempt:", {
        error: attemptError,
        message: attemptError?.message,
        details: attemptError?.details,
        hint: attemptError?.hint,
        code: attemptError?.code,
      });
      return new Response(JSON.stringify({ message: "Failed to create quiz attempt" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Map to DTO
    const attemptDTO: QuizAttemptDTO = {
      id: attempt.id,
      user_id: attempt.user_id,
      quiz_id: attempt.quiz_id,
      status: "in_progress", // Derived from null completed_at
      score: attempt.score,
      total_questions: attempt.total_questions,
      started_at: attempt.created_at,
      completed_at: null, // Not completed yet
    };

    return new Response(JSON.stringify(attemptDTO), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in POST /api/quizzes/[id]/attempts:", {
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error ? error.cause : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
