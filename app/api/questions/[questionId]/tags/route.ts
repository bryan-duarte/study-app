/**
 * Question Tags API Route
 *
 *   GET  /api/questions/:questionId/tags — tags currently on this question (this user)
 *   POST /api/questions/:questionId/tags — assign a tag by { tagId } or { name }
 *                                          (auto-creates the tag when `name` is new)
 *
 * Returns the question's full tag set after the operation so the caller can
 * replace its local state in one round-trip.
 */
import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { resolveUserId } from "@/lib/user";
import { toSlug } from "@/lib/tags";
import type { Tag } from "@/types/quiz";

/** Current tags on a question for a user (inner-join enforces ownership). */
async function fetchQuestionTags(
  supabase: ReturnType<typeof createSupabaseClient>,
  userId: string,
  questionId: string,
): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("question_tags")
    .select("tags!inner(id, name, slug)")
    .eq("question_id", questionId)
    .eq("tags.user_id", userId);
  if (error) throw error;
  return (data ?? [])
    .map((row) => row.tags as Tag)
    .filter((t): t is Tag => Boolean(t));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  try {
    const userId = await resolveUserId();
    if (!userId) return NextResponse.json({ tags: [] });
    const { questionId } = await params;

    const supabase = createSupabaseClient();
    const tags = await fetchQuestionTags(supabase, userId, questionId);
    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Failed to fetch question tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch question tags" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { questionId } = await params;

    const body = (await request.json().catch(() => null)) as
      | { tagId?: unknown; name?: unknown }
      | null;
    const tagId = typeof body?.tagId === "string" ? body.tagId : null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!tagId && !name) {
      return NextResponse.json(
        { error: "Provide tagId or name" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseClient();
    let resolvedTagId = tagId;

    // Auto-create path: caller passed a name (possibly new).
    if (!resolvedTagId && name) {
      const slug = toSlug(name);
      const { data: existing } = await supabase
        .from("tags")
        .select("id")
        .eq("user_id", userId)
        .eq("slug", slug)
        .maybeSingle();

      if (existing) {
        resolvedTagId = existing.id;
      } else {
        const { data: created, error } = await supabase
          .from("tags")
          .insert({ user_id: userId, name, slug })
          .select("id")
          .single();
        if (error) throw error;
        resolvedTagId = created.id;
      }
    }

    // Guaranteed non-null: the early return above rejects when both are absent,
    // and the auto-create branch above resolved it when only `name` was given.
    if (!resolvedTagId) {
      return NextResponse.json(
        { error: "Provide tagId or name" },
        { status: 400 },
      );
    }

    // Idempotent assign via the UNIQUE(question_id, tag_id) constraint.
    const { error: assignError } = await supabase
      .from("question_tags")
      .upsert(
        { question_id: questionId, tag_id: resolvedTagId },
        { onConflict: "question_id,tag_id", ignoreDuplicates: true },
      );
    if (assignError) throw assignError;

    const tags = await fetchQuestionTags(supabase, userId, questionId);
    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Failed to assign tag:", error);
    return NextResponse.json(
      { error: "Failed to assign tag" },
      { status: 500 },
    );
  }
}
