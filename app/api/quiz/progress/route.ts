/**
 * Progress Sync API Route
 * Handles saving user quiz progress for a session
 * Updated to work with session-based quiz system
 */

import { type NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase";
import type { ProgressRequest } from "@/types/quiz";

/**
 * POST: Save/update user's quiz progress for a session
 * Records each answer in session_questions table
 * Updates user_question_history table
 * Triggers analytics completion when all questions answered
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseAuth = await createAuthClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progressData = (await request.json()) as ProgressRequest;

    // Validate progress data
    if (!progressData.sessionId || !Array.isArray(progressData.answers)) {
      return NextResponse.json(
        { error: "Invalid progress data: sessionId and answers array required" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseClient();

    // Verify session exists and belongs to user
    const { data: session, error: sessionError } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("id", progressData.sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found or access denied" },
        { status: 404 },
      );
    }

    // Get all questions in this session to check if correct answers
    const { data: sessionQuestions, error: questionsError } = await supabase
      .from("session_questions")
      .select("question_id, questions(options)")
      .eq("session_id", progressData.sessionId);

    if (questionsError) {
      console.error("Failed to fetch session questions:", questionsError);
      throw questionsError;
    }

    // Create a map of question_id to correct option_id
    const questionOptionsMap = new Map(
      (sessionQuestions || []).map((sq: any) => [
        sq.question_id,
        sq.questions.options,
      ])
    );

    let correctCount = 0;

    // Process each answer and update session_questions
    for (const answer of progressData.answers) {
      const options = questionOptionsMap.get(answer.questionId);
      if (!options) continue;

      const selectedOption = options.find((opt: any) => opt.id === answer.selectedOptionId);
      const isCorrect = selectedOption?.is_correct || false;

      if (isCorrect) correctCount++;

      // Update session_questions with answer
      const { error: updateError } = await supabase
        .from("session_questions")
        .update({
          selected_option_id: answer.selectedOptionId,
          is_correct: isCorrect,
          answered_at: new Date().toISOString(),
        })
        .eq("session_id", progressData.sessionId)
        .eq("question_id", answer.questionId);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to save answer", detail: updateError.message },
          { status: 500 }
        );
      }
    }

    // Check if all questions in session are answered
    const { data: allSessionQuestions } = await supabase
      .from("session_questions")
      .select("answered_at")
      .eq("session_id", progressData.sessionId);

    const answeredCount = allSessionQuestions?.filter((sq) => sq.answered_at).length || 0;
    const totalQuestions = allSessionQuestions?.length || 0;

    // If all questions answered, update session and create analytics
    if (answeredCount === totalQuestions && totalQuestions > 0) {
      const percentage = Math.round((correctCount / totalQuestions) * 100);

      // Update session as complete
      await supabase
        .from("quiz_sessions")
        .update({
          is_complete: true,
          completed_at: new Date().toISOString(),
        })
        .eq("id", progressData.sessionId);

      // Create analytics record
      await supabase
        .from("quiz_analytics")
        .insert({
          user_id: user.id,
          session_id: progressData.sessionId,
          score: percentage,
          total_questions: totalQuestions,
          correct_count: correctCount,
          percentage: percentage,
        } as any);
    }

    return NextResponse.json({
      success: true,
      answeredCount,
      totalQuestions,
      correctCount,
      isComplete: answeredCount === totalQuestions,
    });
  } catch (error) {
    console.error("Failed to save progress:", error);
    return NextResponse.json(
      { error: "Failed to sync progress" },
      { status: 500 },
    );
  }
}

/**
 * GET: Fetch user's quiz progress from session-based architecture
 * Returns progress from active session or most recent completed session
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseAuth = await createAuthClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseClient();

    // Get user's active session or most recent completed session
    const { data: session, error: sessionError } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError || !session) {
      // No session found, return default empty progress
      return NextResponse.json({
        answers: [],
        confirmedAnswers: [],
        currentIndex: 0,
        isComplete: false,
        answeredQuestionIds: [],
      });
    }

    // Get all questions for this session with their answer state
    const { data: sessionQuestions, error: questionsError } = await supabase
      .from("session_questions")
      .select("question_id, selected_option_id, is_correct, answered_at")
      .eq("session_id", session.id);

    if (questionsError) {
      throw questionsError;
    }

    // Build progress data from session questions
    const answers: Array<{ questionId: string; selectedOptionId: string; isCorrect: boolean }> = [];
    const confirmedAnswers: Array<{ questionId: string; selectedOptionId: string; isCorrect: boolean }> = [];
    const answeredQuestionIds: string[] = [];

    for (const sq of sessionQuestions || []) {
      if (sq.answered_at && sq.selected_option_id) {
        const answerData = {
          questionId: sq.question_id,
          selectedOptionId: sq.selected_option_id,
          isCorrect: sq.is_correct || false,
        };
        answers.push(answerData);
        confirmedAnswers.push(answerData);
        answeredQuestionIds.push(sq.question_id);
      }
    }

    // Calculate current index based on answered questions
    const answeredCount = answeredQuestionIds.length;
    const currentIndex = session.is_complete ? answeredCount : answeredCount;

    return NextResponse.json({
      answers,
      confirmedAnswers,
      currentIndex,
      isComplete: session.is_complete,
      answeredQuestionIds,
    });
  } catch (error) {
    console.error("Failed to fetch progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 },
    );
  }
}
