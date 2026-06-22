/**
 * Question History API Route
 *
 * Returns the user's previously answered questions with full detail
 * (selected option, correctness, reasoning, tags). Powers the Explorer
 * screen, its Markdown export, and mistake review.
 *
 * Query params:
 *   - wrongOnly=true : only questions whose latest answer was incorrect
 */
import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { resolveUserId } from "@/lib/user";
import type { HistoryItem } from "@/types/quiz";

interface JsonbOption {
  id: string;
  description: string;
  is_correct: boolean;
  reasoning: string;
}

export async function GET(request: Request) {
  try {
    const wrongOnly =
      new URL(request.url).searchParams.get("wrongOnly") === "true";
    const userId = await resolveUserId();
    if (!userId) return NextResponse.json({ items: [] });

    const supabase = createSupabaseClient();

    let historyQuery = supabase
      .from("user_question_history")
      .select(
        "question_id, selected_option_id, is_correct, times_answered, first_answered_at, last_answered_at",
      )
      .eq("user_id", userId)
      .order("last_answered_at", { ascending: false });

    if (wrongOnly) historyQuery = historyQuery.eq("is_correct", false);

    const { data: history, error: historyError } = await historyQuery;
    if (historyError) throw historyError;
    if (!history || history.length === 0)
      return NextResponse.json({ items: [] });

    const questionIds = history.map((h) => h.question_id);
    const { data: questions, error: qError } = await supabase
      .from("questions")
      .select("id, type, title, options, domain, topic, difficulty")
      .in("id", questionIds);
    if (qError) throw qError;

    const byId = new Map((questions ?? []).map((q) => [q.id, q]));

    const items: HistoryItem[] = [];
    for (const h of history) {
      const q = byId.get(h.question_id);
      if (!q) continue;
      const options = (Array.isArray(q.options) ? q.options : []).map((o: unknown) => {
        const opt = o as JsonbOption;
        return {
          id: opt.id,
          description: opt.description,
          isCorrect: opt.is_correct,
          reasoning: opt.reasoning,
        };
      });
      items.push({
        questionId: h.question_id,
        title: q.title,
        type: q.type as HistoryItem["type"],
        domain: q.domain,
        topic: q.topic,
        difficulty: q.difficulty,
        options,
        selectedOptionId: h.selected_option_id,
        isCorrect: h.is_correct,
        timesAnswered: h.times_answered,
        firstAnsweredAt: h.first_answered_at,
        lastAnsweredAt: h.last_answered_at,
      });
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 },
    );
  }
}
