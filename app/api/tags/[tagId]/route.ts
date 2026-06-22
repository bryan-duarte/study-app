/**
 * Tag detail API Route
 *
 *   PATCH  /api/tags/:tagId { name } — rename (recomputes slug)
 *   DELETE /api/tags/:tagId          — delete (cascades question_tags)
 *
 * Both verify the tag belongs to the resolved user before mutating.
 */
import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { resolveUserId } from "@/lib/user";
import { toSlug } from "@/lib/tags";
import type { Tag } from "@/types/quiz";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tagId: string }> },
) {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { tagId } = await params;

    const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
    }
    const slug = toSlug(name);
    if (!slug) {
      return NextResponse.json({ error: "Invalid tag name" }, { status: 400 });
    }

    const supabase = createSupabaseClient();

    // Ownership check.
    const { data: owned } = await supabase
      .from("tags")
      .select("id")
      .eq("id", tagId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!owned) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Reject rename onto another existing tag's slug for this user.
    const { data: clash } = await supabase
      .from("tags")
      .select("id")
      .eq("user_id", userId)
      .eq("slug", slug)
      .neq("id", tagId)
      .maybeSingle();
    if (clash) {
      return NextResponse.json(
        { error: "A tag with that name already exists" },
        { status: 409 },
      );
    }

    const { data, error } = await supabase
      .from("tags")
      .update({ name, slug })
      .eq("id", tagId)
      .select("id, name, slug")
      .single();
    if (error) throw error;

    return NextResponse.json({ tag: data as Tag });
  } catch (error) {
    console.error("Failed to rename tag:", error);
    return NextResponse.json(
      { error: "Failed to rename tag" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tagId: string }> },
) {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { tagId } = await params;

    const supabase = createSupabaseClient();

    // Delete only if owned (cascade clears question_tags via FK).
    const { error, count } = await supabase
      .from("tags")
      .delete({ count: "exact" })
      .eq("id", tagId)
      .eq("user_id", userId);

    if (error) throw error;
    if (!count) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete tag:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 },
    );
  }
}
