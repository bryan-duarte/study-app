/**
 * Session Start API Route
 * Handles creating a new quiz session and fetching assigned questions
 */

import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { transformQuestion } from "@/lib/transformers/question";
import type { SessionStartResponse, SessionQuestion } from "@/types/quiz";

const SESSION_QUESTIONS_COUNT = 25;

/**
 * POST: Create a new quiz session and return assigned questions
 *
 * Request body: { user_id?: string }
 * Returns: SessionStartResponse with sessionId, questions array, and totalAvailable
 */
export async function POST(request: Request) {
  try {
    const { user_id } = await request.json();

    const supabase = createSupabaseClient();

    // Step 1: Get user's answered question IDs (if user_id provided)
    let answeredQuestionIds: Set<string> = new Set();

    if (user_id) {
      const { data: history, error: historyError } = await supabase
        .from("user_question_history")
        .select("question_id")
        .eq("user_id", user_id);

      if (!historyError && history) {
        answeredQuestionIds = new Set(history.map((h) => h.question_id));
      }
    }

    // Step 2: Get total available questions (excluding answered ones)
    const { count: totalAvailable, error: countError } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .not("id", "in", `(${Array.from(answeredQuestionIds).join(",")})`);

    if (countError) {
      console.error("Failed to count available questions:", countError);
      throw countError;
    }

    // Step 3: Fetch available questions (excluding answered ones)
    const availableCount = Math.min(totalAvailable || 0, SESSION_QUESTIONS_COUNT);

    let questionsData: any[] = [];

    if (availableCount > 0) {
      // Get random questions excluding answered ones
      const { data: availableQuestions, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .not("id", "in", `(${Array.from(answeredQuestionIds).join(",")})`)
        .limit(availableCount);

      if (questionsError) {
        console.error("Failed to fetch questions:", questionsError);
        throw questionsError;
      }

      questionsData = availableQuestions || [];
    }

    // Step 4: Shuffle the questions (Fisher-Yates algorithm)
    const shuffledQuestions = [...questionsData];
    for (let i = shuffledQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
    }

    // Step 5: Create the quiz session
    const { data: session, error: sessionError } = await supabase
      .from("quiz_sessions")
      .insert({
        user_id: user_id || null,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Failed to create session:", sessionError);
      throw sessionError;
    }

    // Step 6: Link questions to the session
    if (shuffledQuestions.length > 0) {
      const sessionQuestions = shuffledQuestions.map((q) => ({
        session_id: session.id,
        question_id: q.id,
      }));

      const { error: linkError } = await supabase
        .from("session_questions")
        .insert(sessionQuestions);

      if (linkError) {
        console.error("Failed to link questions to session:", linkError);
        // Don't throw - session is still usable
      }
    }

    // Step 7: Transform questions to SessionQuestion format
    const sessionQuestions: SessionQuestion[] = shuffledQuestions.map((q) => ({
      questionId: q.id,
      question: transformQuestion(q),
      selectedOptionId: undefined,
      isCorrect: undefined,
      answeredAt: undefined,
    }));

    // Step 8: Return the session start response
    const response: SessionStartResponse = {
      sessionId: session.id,
      questions: sessionQuestions,
      totalAvailableQuestions: totalAvailable || 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to start session:", error);

    return NextResponse.json(
      {
        error: "Failed to start session",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
