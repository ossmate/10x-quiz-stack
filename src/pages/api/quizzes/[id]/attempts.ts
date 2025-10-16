import type { APIRoute } from "astro";
import { z } from "zod";
import type { QuizAttemptDTO } from "@/types";

export const prerender = false;

/**
 * POST /api/quizzes/[id]/attempts
 * Create a new quiz attempt
 */
export const POST: APIRoute = async ({ params, locals }) => {
  try {
    const quizId = params.id;

    // Validate quiz ID
    if (!quizId || !z.string().uuid().safeParse(quizId).success) {
      return new Response(JSON.stringify({ message: "Invalid quiz ID format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use Supabase client from locals (middleware provides service role client for API routes)
    const supabaseClient = locals.supabase;

    // Get current user ID (from environment for now, will use session later)
    const currentUserId = import.meta.env.DEFAULT_USER_ID;
    if (!currentUserId) {
      return new Response(JSON.stringify({ message: "User not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify quiz exists
    const { data: quiz, error: quizError } = await supabaseClient
      .from("quizzes")
      .select("id")
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
      console.error("Failed to create quiz attempt:", attemptError);
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
    console.error("Error in POST /api/quizzes/[id]/attempts:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
