/**
 * Bulk Question Tag API Route
 *
 *   POST /api/questions/tags/bulk { questionIds, tagId? | name? }
 *
 * Applies ONE tag to many questions in a single request (rate-limit friendly).
 * Auto-creates the tag when `name` is new. Idempotent per question via the
 * UNIQUE(question_id, tag_id) constraint.
 */
import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { resolveUserId } from "@/lib/user";
import { toSlug } from "@/lib/tags";
import type { Tag } from "@/types/quiz";

export async function POST(request: Request) {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as
      | { questionIds?: unknown; tagId?: unknown; name?: unknown }
      | null;

    const questionIds = Array.isArray(body?.questionIds)
      ? (body!.questionIds as unknown[]).filter(
          (id): id is string => typeof id === "string",
        )
      : [];
    const tagId = typeof body?.tagId === "string" ? body.tagId : null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (questionIds.length === 0) {
      return NextResponse.json(
        { error: "questionIds must be a non-empty array" },
        { status: 400 },
      );
    }
    if (!tagId && !name) {
      return NextResponse.json(
        { error: "Provide tagId or name" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseClient();
    let tag: Tag | null = null;

    if (tagId) {
      const { data: owned, error } = await supabase
        .from("tags")
        .select("id, name, slug")
        .eq("id", tagId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (!owned) {
        return NextResponse.json({ error: "Tag not found" }, { status: 404 });
      }
      tag = owned as Tag;
    } else {
      const slug = toSlug(name);
      const { data: existing } = await supabase
        .from("tags")
        .select("id, name, slug")
        .eq("user_id", userId)
        .eq("slug", slug)
        .maybeSingle();
      if (existing) {
        tag = existing as Tag;
      } else {
        const { data: created, error } = await supabase
          .from("tags")
          .insert({ user_id: userId, name, slug })
          .select("id, name, slug")
          .single();
        if (error) throw error;
        tag = created as Tag;
      }
    }

    const rows = questionIds.map((question_id) => ({
      question_id,
      tag_id: tag!.id,
    }));
    const { error: assignError } = await supabase
      .from("question_tags")
      .upsert(rows, { onConflict: "question_id,tag_id", ignoreDuplicates: true });
    if (assignError) throw assignError;

    return NextResponse.json({ tag, assigned: questionIds.length });
  } catch (error) {
    console.error("Failed to bulk-assign tag:", error);
    return NextResponse.json(
      { error: "Failed to bulk-assign tag" },
      { status: 500 },
    );
  }
}
