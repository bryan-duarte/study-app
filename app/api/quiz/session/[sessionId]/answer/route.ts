/**
 * Session Answer API Route
 * Handles recording answers for questions in a quiz session
 */

import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

/**
 * POST: Record an answer for a question in the session
 *
 * Request body: { questionId: string, selectedOptionId: string }
 * Returns: { isCorrect: boolean, sessionComplete: boolean }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { questionId, selectedOptionId } = await request.json();

    // Validate required fields
    if (!questionId || !selectedOptionId) {
      return NextResponse.json(
        { error: "Missing required fields: questionId and selectedOptionId" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Step 1: Fetch the question to check if answer is correct
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("options")
      .eq("id", questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Step 2: Find the selected option and check if it's correct
    const options = question.options as any[];
    const selectedOption = options.find((opt: any) => opt.id === selectedOptionId);

    if (!selectedOption) {
      return NextResponse.json(
        { error: "Invalid option ID" },
        { status: 400 }
      );
    }

    const isCorrect = selectedOption.is_correct || false;

    // Step 3: Get session to check user_id
    const { data: session, error: sessionError } = await supabase
      .from("quiz_sessions")
      .select("user_id")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Step 4: Update session_questions with the answer
    const { error: updateError } = await supabase
      .from("session_questions")
      .update({
        selected_option_id: selectedOptionId,
        is_correct: isCorrect,
        answered_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId)
      .eq("question_id", questionId);

    if (updateError) {
      console.error("Failed to update session question:", updateError);
      // Continue anyway - we'll still record in history
    }

    // Step 5: Record in user_question_history (for adaptive learning)
    if (session.user_id) {
      const { error: historyError } = await supabase.rpc(
        "record_user_question_answer",
        {
          p_user_id: session.user_id,
          p_question_id: questionId,
          p_selected_option_id: selectedOptionId,
          p_is_correct: isCorrect,
        }
      );

      if (historyError) {
        console.error("Failed to record user question history:", historyError);
        // Don't fail the request for this
      }
    }

    // Step 6: Check if all questions in session are answered
    const { data: sessionQuestions, error: countError } = await supabase
      .from("session_questions")
      .select("answered_at, is_correct")
      .eq("session_id", sessionId);

    if (countError) {
      console.error("Failed to check session completion:", countError);
    }

    const answeredCount = sessionQuestions?.filter((sq) => sq.answered_at).length || 0;
    const correctCount = sessionQuestions?.filter((sq) => sq.is_correct).length || 0;
    const totalQuestions = sessionQuestions?.length || 0;
    const sessionComplete = answeredCount >= totalQuestions && totalQuestions > 0;

    // Step 7: If session is complete, mark it and record analytics (once).
    // The analytics row powers the score-trend chart on the Insights dashboard.
    if (sessionComplete) {
      await supabase
        .from("quiz_sessions")
        .update({
          is_complete: true,
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (session.user_id) {
        const { data: existing } = await supabase
          .from("quiz_analytics")
          .select("id")
          .eq("session_id", sessionId)
          .maybeSingle();

        if (!existing) {
          const percentage =
            totalQuestions > 0
              ? Math.round((correctCount / totalQuestions) * 100)
              : 0;
          const { error: analyticsError } = await supabase
            .from("quiz_analytics")
            .insert({
              user_id: session.user_id,
              session_id: sessionId,
              score: percentage,
              total_questions: totalQuestions,
              correct_count: correctCount,
              percentage,
              completed_at: new Date().toISOString(),
            });
          if (analyticsError) {
            console.error("Failed to record analytics:", analyticsError);
          }
        }
      }
    }

    return NextResponse.json({
      isCorrect,
      sessionComplete,
      answeredCount,
      totalQuestions,
    });
  } catch (error) {
    console.error("Failed to record answer:", error);

    return NextResponse.json(
      {
        error: "Failed to record answer",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
