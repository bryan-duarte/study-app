/**
 * Tags API Route
 *
 *   GET  /api/tags[?withCounts=true]  — list the current user's tags
 *   POST /api/tags { name }           — create a tag (idempotent: returns the
 *                                        existing tag with 409 on slug clash)
 *
 * Tags are per-user (resolveUserId). The slug is the case-insensitive
 * uniqueness key and the /history?tags= URL param.
 */
import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { resolveUserId } from "@/lib/user";
import { toSlug } from "@/lib/tags";
import type { Tag, TagWithCount } from "@/types/quiz";

export async function GET(request: Request) {
  try {
    const userId = await resolveUserId();
    if (!userId) return NextResponse.json({ tags: [] });

    const withCounts =
      new URL(request.url).searchParams.get("withCounts") === "true";
    const supabase = createSupabaseClient();

    if (withCounts) {
      const { data, error } = await supabase
        .from("tags")
        .select("id, name, slug, question_tags(question_id)")
        .eq("user_id", userId)
        .order("name", { ascending: true });
      if (error) throw error;

      const tags: TagWithCount[] = (data ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        questionCount: t.question_tags?.length ?? 0,
      }));
      return NextResponse.json({ tags });
    }

    const { data, error } = await supabase
      .from("tags")
      .select("id, name, slug")
      .eq("user_id", userId)
      .order("name", { ascending: true });
    if (error) throw error;

    const tags: Tag[] = (data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
    }));
    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Failed to list tags:", error);
    return NextResponse.json(
      { error: "Failed to list tags" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Idempotent: if a tag with the same slug already exists for this user,
    // return it with 409 so the client can treat "create" and "exists" alike.
    const { data: existing } = await supabase
      .from("tags")
      .select("id, name, slug")
      .eq("user_id", userId)
      .eq("slug", slug)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { tag: existing as Tag, error: "Tag already exists" },
        { status: 409 },
      );
    }

    const { data, error } = await supabase
      .from("tags")
      .insert({ user_id: userId, name, slug })
      .select("id, name, slug")
      .single();
    if (error) throw error;

    return NextResponse.json({ tag: data as Tag }, { status: 201 });
  } catch (error) {
    console.error("Failed to create tag:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 },
    );
  }
}
