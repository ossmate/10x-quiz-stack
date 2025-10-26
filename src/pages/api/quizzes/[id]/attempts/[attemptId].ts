import type { APIRoute } from "astro";
import { z } from "zod";
import type { QuizAttemptDTO, QuizAttemptStatus } from "@/types";
import { createSupabaseServerInstance } from "../../../../../db/supabase.client.ts";

export const prerender = false;

// Validation schemas
const quizAttemptUpdateSchema = z.object({
  status: z.enum(["in_progress", "completed", "abandoned"]),
  score: z.number().int().min(0),
  completed_at: z.string().datetime(),
});

/**
 * PUT /api/quizzes/[id]/attempts/[attemptId]
 * Update a quiz attempt with final score and completion status
 */
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    const { id: quizId, attemptId } = params;

    // Validate IDs
    if (!quizId || !z.string().uuid().safeParse(quizId).success) {
      return new Response(JSON.stringify({ message: "Invalid quiz ID format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!attemptId || !z.string().uuid().safeParse(attemptId).success) {
      return new Response(JSON.stringify({ message: "Invalid attempt ID format" }), {
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
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (!session) {
      return new Response(JSON.stringify({ message: "User not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const currentUserId = session.user.id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = quizAttemptUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          message: "Invalid request body",
          errors: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { status, score, completed_at } = validationResult.data;

    // Verify attempt exists and belongs to current user
    const { data: existingAttempt, error: fetchError } = await supabaseClient
      .from("quiz_attempts")
      .select("id, user_id, quiz_id")
      .eq("id", attemptId)
      .eq("quiz_id", quizId)
      .single();

    if (fetchError || !existingAttempt) {
      return new Response(JSON.stringify({ message: "Quiz attempt not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (existingAttempt.user_id !== currentUserId) {
      return new Response(JSON.stringify({ message: "You don't have permission to update this attempt" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update the attempt
    const { data: updatedAttempt, error: updateError } = await supabaseClient
      .from("quiz_attempts")
      .update({
        score,
        completed_at,
      })
      .eq("id", attemptId)
      .select()
      .single();

    if (updateError || !updatedAttempt) {
      // eslint-disable-next-line no-console
      console.error("Failed to update quiz attempt:", updateError);
      return new Response(JSON.stringify({ message: "Failed to update quiz attempt" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Map to DTO
    const attemptDTO: QuizAttemptDTO = {
      id: updatedAttempt.id,
      user_id: updatedAttempt.user_id,
      quiz_id: updatedAttempt.quiz_id,
      status: status as QuizAttemptStatus,
      score: updatedAttempt.score,
      total_questions: updatedAttempt.total_questions,
      started_at: updatedAttempt.created_at,
      completed_at: updatedAttempt.completed_at,
    };

    return new Response(JSON.stringify(attemptDTO), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in PUT /api/quizzes/[id]/attempts/[attemptId]:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
