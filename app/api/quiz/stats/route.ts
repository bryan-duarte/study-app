/**
 * Study Stats API Route
 *
 * One aggregate endpoint powering the Mastery summary, Readiness/Insights
 * dashboard, the exhaustion indicator, and the "due today" badge.
 *
 * Computed from data we already track — no per-feature endpoints needed.
 */
import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { resolveUserId } from "@/lib/user";
import { isDue } from "@/lib/srs";
import type {
  StatsResponse,
  DomainStat,
  TopicStat,
  TrendPoint,
} from "@/types/quiz";

/** Consecutive-day streak ending today (or yesterday if today is idle yet). */
function computeStreak(dateStrings: string[]): number {
  const days = new Set(
    dateStrings.filter(Boolean).map((d) => new Date(d).toISOString().slice(0, 10)),
  );
  if (days.size === 0) return 0;
  const DAY = 86400000;
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterdayKey = new Date(today.getTime() - DAY).toISOString().slice(0, 10);

  let cursor: number;
  if (days.has(todayKey)) cursor = today.getTime();
  else if (days.has(yesterdayKey)) cursor = today.getTime() - DAY;
  else return 0;

  let streak = 0;
  while (days.has(new Date(cursor).toISOString().slice(0, 10))) {
    streak += 1;
    cursor -= DAY;
  }
  return streak;
}

export async function GET() {
  try {
    const userId = await resolveUserId();
    const supabase = createSupabaseClient();

    // All questions with their tags (312 rows) — the denominator for coverage.
    const { data: questions, error: qError } = await supabase
      .from("questions")
      .select("id, domain, topic");
    if (qError) throw qError;
    const totalQuestions = questions?.length ?? 0;

    // Per-question history for this user.
    const { data: history } = userId
      ? await supabase
          .from("user_question_history")
          .select("question_id, is_correct, times_answered, last_answered_at")
          .eq("user_id", userId)
      : { data: [] as never[] };

    const hist = history ?? [];
    const histById = new Map(hist.map((h) => [h.question_id, h]));

    const answered = hist.length;
    const mastered = hist.filter((h) => h.is_correct === true).length;
    const wrongCount = hist.filter((h) => h.is_correct === false).length;
    const dueCount = hist.filter((h) =>
      isDue({
        times_answered: h.times_answered,
        last_answered_at: h.last_answered_at,
        is_correct: h.is_correct,
      }),
    ).length;
    const accuracyOverall =
      answered > 0 ? Math.round((mastered / answered) * 100) : 0;

    // Aggregate by domain + topic.
    const domainAgg = new Map<string, { total: number; answered: number; correct: number }>();
    const topicAgg = new Map<string, { total: number; answered: number; correct: number }>();
    const bump = (
      map: Map<string, { total: number; answered: number; correct: number }>,
      key: string | null,
      answeredInc: boolean,
      correctInc: boolean,
    ) => {
      if (!key) return;
      const cur = map.get(key) ?? { total: 0, answered: 0, correct: 0 };
      cur.total += 1;
      if (answeredInc) cur.answered += 1;
      if (correctInc) cur.correct += 1;
      map.set(key, cur);
    };

    for (const q of questions ?? []) {
      const h = histById.get(q.id);
      const isAnswered = Boolean(h);
      const isCorrect = h?.is_correct === true;
      bump(domainAgg, q.domain, isAnswered, isCorrect);
      bump(topicAgg, q.topic, isAnswered, isCorrect);
    }

    const toStat = (key: string, v: { total: number; answered: number; correct: number }) => ({
      total: v.total,
      answered: v.answered,
      correct: v.correct,
      accuracy: v.answered > 0 ? Math.round((v.correct / v.answered) * 100) : 0,
    });

    const byDomain: DomainStat[] = Array.from(domainAgg.entries())
      .map(([domain, v]) => ({ domain, ...toStat(domain, v) }))
      .sort((a, b) => b.total - a.total);
    const byTopic: TopicStat[] = Array.from(topicAgg.entries())
      .map(([topic, v]) => ({ topic, ...toStat(topic, v) }))
      .sort((a, b) => a.accuracy - b.accuracy); // weakest first

    // Score trend from completed sessions.
    const { data: analytics } = userId
      ? await supabase
          .from("quiz_analytics")
          .select("completed_at, percentage")
          .eq("user_id", userId)
          .order("completed_at", { ascending: true })
          .limit(60)
      : { data: [] as never[] };
    const trend: TrendPoint[] = (analytics ?? []).map((a) => ({
      completedAt: a.completed_at ?? "",
      percentage: a.percentage,
    }));

    // Streak from session activity.
    const { data: sessions } = userId
      ? await supabase
          .from("quiz_sessions")
          .select("started_at")
          .eq("user_id", userId)
      : { data: [] as never[] };
    const streakDays = computeStreak((sessions ?? []).map((s) => s.started_at ?? ""));

    const stats: StatsResponse = {
      totalQuestions,
      answered,
      mastered,
      wrongCount,
      dueCount,
      accuracyOverall,
      isExhausted: totalQuestions > 0 && answered >= totalQuestions,
      streakDays,
      byDomain,
      byTopic,
      trend,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to compute stats:", error);
    return NextResponse.json(
      { error: "Failed to compute stats" },
      { status: 500 },
    );
  }
}
