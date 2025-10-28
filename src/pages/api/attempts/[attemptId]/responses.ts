import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../../db/supabase.client.ts";

export const prerender = false;

// Validation schemas
const responseSchema = z.object({
  question_id: z.string().uuid(),
  selected_options: z.array(z.string().uuid()).min(1),
});

const quizResponsesSchema = z.object({
  responses: z.array(responseSchema),
});

/**
 * POST /api/attempts/[attemptId]/responses
 * Submit quiz responses for an attempt
 */
export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    const { attemptId } = params;

    // Validate attempt ID
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = quizResponsesSchema.safeParse(body);

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

    const { responses } = validationResult.data;

    // Verify attempt exists and belongs to current user
    const { data: existingAttempt, error: fetchError } = await supabaseClient
      .from("quiz_attempts")
      .select("id, user_id, quiz_id")
      .eq("id", attemptId)
      .single();

    if (fetchError || !existingAttempt) {
      return new Response(JSON.stringify({ message: "Quiz attempt not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (existingAttempt.user_id !== currentUserId) {
      return new Response(
        JSON.stringify({ message: "You don't have permission to submit responses for this attempt" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Delete existing responses for this attempt (in case of retry/resubmission)
    await supabaseClient.from("attempt_answers").delete().eq("quiz_attempt_id", attemptId);

    // Insert new responses
    // Note: The database schema shows attempt_answers has selected_answer_id (singular),
    // but we're receiving selected_options (array). We'll insert one record per selected option.
    const attemptAnswersToInsert = responses.flatMap((response) =>
      response.selected_options.map((optionId) => ({
        quiz_attempt_id: attemptId,
        question_id: response.question_id,
        selected_answer_id: optionId,
      }))
    );

    if (attemptAnswersToInsert.length > 0) {
      const { error: insertError } = await supabaseClient.from("attempt_answers").insert(attemptAnswersToInsert);

      if (insertError) {
        // eslint-disable-next-line no-console
        console.error("Failed to insert attempt answers:", insertError);
        return new Response(JSON.stringify({ message: "Failed to save quiz responses" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Responses saved successfully",
        count: attemptAnswersToInsert.length,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in POST /api/attempts/[attemptId]/responses:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
