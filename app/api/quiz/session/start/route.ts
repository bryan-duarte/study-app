/**
 * Session Start API Route
 *
 * Creates a quiz session and assigns questions according to the requested mode:
 *   - standard:  random unanswered questions (interleaved across all domains)
 *   - category:  restricted to selected domains/topics
 *   - mistakes:  questions previously answered incorrectly (Mistake Bank)
 *   - due:       spaced-repetition questions due for review today
 *
 * Identity is resolved server-side (logged-in user, else stable default user),
 * so per-question history is always recorded.
 */

import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { resolveUserId } from "@/lib/user";
import { isDue } from "@/lib/srs";
import { transformQuestion } from "@/lib/transformers/question";
import type {
  SessionStartResponse,
  SessionQuestion,
  SessionStartRequest,
} from "@/types/quiz";

const SESSION_QUESTIONS_COUNT = 25;

/** Fisher-Yates shuffle (non-mutating). */
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SessionStartRequest;
    const mode = body.mode ?? "standard";
    const requestedCount = body.question_count ?? SESSION_QUESTIONS_COUNT;
    const userId = body.user_id ?? (await resolveUserId());

    const supabase = createSupabaseClient();

    // ------------------------------------------------------------------
    // Step 1: Determine the candidate question IDs for this mode.
    // ------------------------------------------------------------------
    let candidateIds: string[] = [];

    if (mode === "mistakes") {
      if (userId) {
        const { data, error } = await supabase
          .from("user_question_history")
          .select("question_id")
          .eq("user_id", userId)
          .eq("is_correct", false);
        if (error) throw error;
        candidateIds = (data ?? []).map((r) => r.question_id);
      }
    } else if (mode === "due") {
      if (userId) {
        const { data, error } = await supabase
          .from("user_question_history")
          .select("question_id, times_answered, last_answered_at, is_correct")
          .eq("user_id", userId);
        if (error) throw error;
        candidateIds = (data ?? [])
          .filter((r) =>
            isDue({
              times_answered: r.times_answered,
              last_answered_at: r.last_answered_at,
              is_correct: r.is_correct,
            }),
          )
          .map((r) => r.question_id);
      }
    } else {
      // standard or category: pool of question IDs (optionally filtered),
      // minus the ones the user has already answered.
      let query = supabase.from("questions").select("id");
      if (mode === "category") {
        if (body.domains?.length) query = query.in("domain", body.domains);
        if (body.topics?.length) query = query.in("topic", body.topics);
      }
      const { data: pool, error: poolError } = await query;
      if (poolError) throw poolError;
      let poolIds = (pool ?? []).map((r) => r.id);

      let answeredIds = new Set<string>();
      if (userId) {
        const { data: history } = await supabase
          .from("user_question_history")
          .select("question_id")
          .eq("user_id", userId);
        answeredIds = new Set((history ?? []).map((h) => h.question_id));
      }

      const unanswered = poolIds.filter((id) => !answeredIds.has(id));
      // If a category is fully exhausted, fall back to including answered
      // questions so the user can still re-drill that category.
      candidateIds =
        unanswered.length === 0 && mode === "category" ? poolIds : unanswered;
    }

    const totalAvailableQuestions = candidateIds.length;

    // ------------------------------------------------------------------
    // Step 2: Pick a random subset and fetch the full question rows.
    // ------------------------------------------------------------------
    const chosenIds = shuffle(candidateIds).slice(0, requestedCount);

    let orderedRows: any[] = [];
    if (chosenIds.length > 0) {
      const { data: rows, error: rowsError } = await supabase
        .from("questions")
        .select("*")
        .in("id", chosenIds);
      if (rowsError) throw rowsError;
      const byId = new Map((rows ?? []).map((r) => [r.id, r]));
      orderedRows = chosenIds
        .map((id) => byId.get(id))
        .filter((r): r is NonNullable<typeof r> => Boolean(r));
    }

    // ------------------------------------------------------------------
    // Step 3: Create the session and link its questions (ordered).
    // ------------------------------------------------------------------
    const { data: session, error: sessionError } = await supabase
      .from("quiz_sessions")
      .insert({ user_id: userId ?? null, started_at: new Date().toISOString() })
      .select()
      .single();
    if (sessionError) throw sessionError;

    if (orderedRows.length > 0) {
      const links = orderedRows.map((q, i) => ({
        session_id: session.id,
        question_id: q.id,
        question_order: i,
      }));
      const { error: linkError } = await supabase
        .from("session_questions")
        .insert(links);
      if (linkError) {
        console.error("Failed to link questions to session:", linkError);
      }
    }

    // ------------------------------------------------------------------
    // Step 4: Shape and return the response.
    // ------------------------------------------------------------------
    const questions: SessionQuestion[] = orderedRows.map((q) => ({
      questionId: q.id,
      question: transformQuestion(q),
      selectedOptionId: undefined,
      isCorrect: undefined,
      answeredAt: undefined,
    }));

    const response: SessionStartResponse = {
      sessionId: session.id,
      questions,
      totalAvailableQuestions,
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
