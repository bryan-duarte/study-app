/**
 * Session Details API Route
 * Handles fetching quiz session details with all questions and answers
 */

import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import type { SessionQuestion } from "@/types/quiz";
import { transformQuestion } from "@/lib/transformers/question";

/**
 * GET: Fetch session details with all questions and their answer states
 *
 * Returns: { sessionId, answeredCount, questions: SessionQuestion[], isComplete }
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = createSupabaseClient();

    // Step 1: Fetch the session
    const { data: session, error: sessionError } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Step 2: Fetch all session questions with question data
    const { data: sessionQuestions, error: questionsError } = await supabase
      .from("session_questions")
      .select(`
        id,
        session_id,
        question_id,
        selected_option_id,
        is_correct,
        answered_at,
        questions (
          id,
          type,
          title,
          options
        )
      `)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (questionsError) {
      console.error("Failed to fetch session questions:", questionsError);
      throw questionsError;
    }

    // Step 3: Transform to SessionQuestion format
    const questions: SessionQuestion[] = (sessionQuestions || []).map((sq: any) => ({
      questionId: sq.question_id,
      question: transformQuestion(sq.questions || {}),
      selectedOptionId: sq.selected_option_id || undefined,
      isCorrect: sq.is_correct !== null ? sq.is_correct : undefined,
      answeredAt: sq.answered_at || undefined,
    }));

    // Step 4: Calculate completion status
    const answeredCount = questions.filter((q) => q.answeredAt).length;
    const totalQuestions = questions.length;
    const isComplete = session.is_complete || answeredCount >= totalQuestions;

    return NextResponse.json({
      sessionId: session.id,
      userId: session.user_id,
      startedAt: session.started_at,
      completedAt: session.completed_at,
      isComplete: session.is_complete,
      answeredCount,
      totalQuestions,
      questions,
    });
  } catch (error) {
    console.error("Failed to fetch session:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch session",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
