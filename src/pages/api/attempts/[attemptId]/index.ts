import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../../db/supabase.client.ts";

export const prerender = false;

/**
 * GET /api/attempts/[attemptId]
 * Fetch detailed attempt data including user answers for results page
 */
export const GET: APIRoute = async ({ params, request, cookies }) => {
  const { attemptId } = params;

  // eslint-disable-next-line no-console
  console.log("GET /api/attempts/[attemptId] - Received attemptId:", attemptId);

  // Validate attempt ID
  if (!attemptId || !z.string().uuid().safeParse(attemptId).success) {
    // eslint-disable-next-line no-console
    console.error("Invalid attempt ID format:", attemptId);
    return new Response(JSON.stringify({ error: "Invalid attempt ID format" }), {
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
    // Fetch attempt
    const { data: attempt, error: attemptError } = await supabaseClient
      .from("quiz_attempts")
      .select("*")
      .eq("id", attemptId)
      .single();

    if (attemptError || !attempt) {
      // eslint-disable-next-line no-console
      console.error("Attempt lookup error:", {
        attemptId,
        error: attemptError,
        message: attemptError?.message,
        details: attemptError?.details,
        hint: attemptError?.hint,
        code: attemptError?.code,
      });
      return new Response(JSON.stringify({ error: "Attempt not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify user owns this attempt
    if (attempt.user_id !== currentUserId) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch quiz with questions and answers
    const { data: quiz, error: quizError } = await supabaseClient
      .from("quizzes")
      .select(
        `
        id,
        title,
        user_id,
        status,
        created_at,
        updated_at,
        questions:questions(
          id,
          quiz_id,
          content,
          order_index,
          created_at,
          updated_at,
          answers:answers(
            id,
            question_id,
            content,
            is_correct,
            order_index,
            created_at
          )
        )
      `
      )
      .eq("id", attempt.quiz_id)
      .is("deleted_at", null)
      .single();

    if (quizError || !quiz) {
      console.error("Quiz lookup error:", { quizId: attempt.quiz_id, quizError });
      return new Response(JSON.stringify({ error: "Quiz not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch user's answers for this attempt
    const { data: answers, error: answersError } = await supabaseClient
      .from("attempt_answers")
      .select("question_id, selected_answer_id")
      .eq("quiz_attempt_id", attemptId);

    if (answersError) {
      console.error("Answers lookup error:", { attemptId, answersError });
      // Continue without answers rather than failing completely
    }

    // Transform answers into a map: question_id -> selected_option_ids[]
    const userAnswers: Record<string, string[]> = {};
    (answers || []).forEach((answer) => {
      if (!userAnswers[answer.question_id]) {
        userAnswers[answer.question_id] = [];
      }
      userAnswers[answer.question_id].push(answer.selected_answer_id);
    });

    // Calculate time_spent if missing
    let timeSpent = attempt.time_spent;
    if (timeSpent === null && attempt.completed_at) {
      const startTime = new Date(attempt.created_at).getTime();
      const endTime = new Date(attempt.completed_at).getTime();
      timeSpent = Math.round((endTime - startTime) / 1000);
    }

    // Transform score to percentage if needed
    let score = attempt.score;
    if (attempt.total_questions > 0 && score <= attempt.total_questions) {
      score = Math.round((score / attempt.total_questions) * 100);
    }

    // Build response
    const response = {
      attempt: {
        id: attempt.id,
        quiz_id: attempt.quiz_id,
        user_id: attempt.user_id,
        score,
        total_questions: attempt.total_questions,
        time_spent: timeSpent,
        created_at: attempt.created_at,
        completed_at: attempt.completed_at,
      },
      quiz: {
        id: quiz.id,
        title: quiz.title,
        user_id: quiz.user_id,
        status: quiz.status,
        created_at: quiz.created_at,
        updated_at: quiz.updated_at,
        questions: (quiz.questions || [])
          .sort((a, b) => a.order_index - b.order_index)
          .map((q) => ({
            id: q.id,
            quiz_id: q.quiz_id,
            content: q.content,
            position: q.order_index,
            status: "active", // Default status for compatibility
            created_at: q.created_at,
            updated_at: q.updated_at,
            options: (q.answers || [])
              .sort((a, b) => a.order_index - b.order_index)
              .map((ans) => ({
                id: ans.id,
                question_id: ans.question_id,
                content: ans.content,
                is_correct: ans.is_correct,
                position: ans.order_index,
                created_at: ans.created_at,
              })),
          })),
      },
      userAnswers,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching attempt details:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
