/**
 * Sessions List API Route
 *
 * Returns the user's past sessions with per-session summary stats, for the
 * Session Replay / Review list. Detail for a single session is served by
 * /api/quiz/session/[sessionId].
 */
import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { resolveUserId } from "@/lib/user";
import type { SessionSummary } from "@/types/quiz";

export async function GET() {
  try {
    const userId = await resolveUserId();
    if (!userId) return NextResponse.json({ sessions: [] });

    const supabase = createSupabaseClient();

    const { data: sessions, error: sessionsError } = await supabase
      .from("quiz_sessions")
      .select("id, started_at, completed_at, is_complete")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(100);
    if (sessionsError) throw sessionsError;
    if (!sessions || sessions.length === 0)
      return NextResponse.json({ sessions: [] });

    const sessionIds = sessions.map((s) => s.id);
    const { data: links, error: linksError } = await supabase
      .from("session_questions")
      .select("session_id, is_correct, answered_at")
      .in("session_id", sessionIds);
    if (linksError) throw linksError;

    // Aggregate per session in JS (avoids N+1 queries).
    const agg = new Map<
      string,
      { total: number; answered: number; correct: number }
    >();
    for (const id of sessionIds) agg.set(id, { total: 0, answered: 0, correct: 0 });
    for (const link of links ?? []) {
      const a = agg.get(link.session_id);
      if (!a) continue;
      a.total += 1;
      if (link.answered_at) a.answered += 1;
      if (link.is_correct) a.correct += 1;
    }

    const summaries: SessionSummary[] = sessions.map((s) => {
      const a = agg.get(s.id)!;
      return {
        sessionId: s.id,
        startedAt: s.started_at,
        completedAt: s.completed_at,
        isComplete: s.is_complete,
        totalQuestions: a.total,
        answeredCount: a.answered,
        correctCount: a.correct,
        percentage: a.answered > 0 ? Math.round((a.correct / a.answered) * 100) : 0,
      };
    });

    // Only surface sessions that actually have questions answered.
    return NextResponse.json({
      sessions: summaries.filter((s) => s.answeredCount > 0),
    });
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 },
    );
  }
}
