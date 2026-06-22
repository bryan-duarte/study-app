/**
 * Question History API Route
 *
 * Returns the user's previously answered questions with full detail
 * (selected option, correctness, reasoning, tags). Powers the Explorer
 * screen, its Markdown export, and mistake review.
 *
 * Query params:
 *   - wrongOnly=true       : only questions whose latest answer was incorrect
 *   - tags=slug1,slug2     : only questions carrying these tags
 *   - tagMode=and|or       : how multiple tags combine (default "or")
 */
import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { resolveUserId } from "@/lib/user";
import type { HistoryItem, Tag } from "@/types/quiz";

interface JsonbOption {
  id: string;
  description: string;
  is_correct: boolean;
  reasoning: string;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const wrongOnly = url.searchParams.get("wrongOnly") === "true";
    const tagSlugs = (url.searchParams.get("tags") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const tagMode = url.searchParams.get("tagMode") === "and" ? "and" : "or";

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

    // Tag filter: resolve the requested slugs to this user's tag ids, then
    // compute the set of question ids that satisfy the AND/OR predicate.
    let allowedByTag: Set<string> | null = null;
    if (tagSlugs.length > 0) {
      const { data: tagRows } = await supabase
        .from("tags")
        .select("id")
        .eq("user_id", userId)
        .in("slug", tagSlugs);
      const tagIds = (tagRows ?? []).map((t) => t.id);

      if (tagIds.length === 0) {
        // No known tags match -> AND/OR both yield nothing.
        return NextResponse.json({ items: [] });
      }

      const { data: qtRows } = await supabase
        .from("question_tags")
        .select("question_id, tag_id")
        .in("tag_id", tagIds);

      const perQuestion = new Map<string, Set<string>>();
      for (const r of qtRows ?? []) {
        const set = perQuestion.get(r.question_id) ?? new Set<string>();
        set.add(r.tag_id);
        perQuestion.set(r.question_id, set);
      }

      allowedByTag = new Set<string>();
      for (const [questionId, matched] of perQuestion) {
        if (tagMode === "and") {
          if (matched.size === tagIds.length) allowedByTag.add(questionId);
        } else if (matched.size > 0) {
          allowedByTag.add(questionId);
        }
      }
    }

    const questionIds = history
      .filter((h) => allowedByTag === null || allowedByTag.has(h.question_id))
      .map((h) => h.question_id);
    if (questionIds.length === 0) return NextResponse.json({ items: [] });

    const { data: questions, error: qError } = await supabase
      .from("questions")
      .select("id, type, title, options, domain, topic, difficulty")
      .in("id", questionIds);
    if (qError) throw qError;

    const byId = new Map((questions ?? []).map((q) => [q.id, q]));

    // One query for tags across the whole result set, grouped by question.
    const tagsByQuestion = new Map<string, Tag[]>();
    if (questionIds.length > 0) {
      const { data: qtRows } = await supabase
        .from("question_tags")
        .select("question_id, tags!inner(id, name, slug)")
        .in("question_id", questionIds)
        .eq("tags.user_id", userId);
      for (const r of qtRows ?? []) {
        const t = r.tags as Tag | null;
        if (!t) continue;
        const arr = tagsByQuestion.get(r.question_id) ?? [];
        arr.push(t);
        tagsByQuestion.set(r.question_id, arr);
      }
    }

    const items: HistoryItem[] = [];
    for (const h of history) {
      // Respect the tag filter when iterating history (keeps the date order).
      if (allowedByTag !== null && !allowedByTag.has(h.question_id)) continue;
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
        tags: tagsByQuestion.get(h.question_id) ?? [],
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

