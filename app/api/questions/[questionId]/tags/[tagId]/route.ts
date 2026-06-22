/**
 * Question Tag removal API Route
 *
 *   DELETE /api/questions/:questionId/tags/:tagId — unassign a tag from a question
 *
 * Verifies the tag belongs to the resolved user before deleting the junction row.
 */
import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { resolveUserId } from "@/lib/user";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ questionId: string; tagId: string }> },
) {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { questionId, tagId } = await params;

    const supabase = createSupabaseClient();

    // Ownership: the tag must belong to this user.
    const { data: owned } = await supabase
      .from("tags")
      .select("id")
      .eq("id", tagId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!owned) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("question_tags")
      .delete()
      .eq("question_id", questionId)
      .eq("tag_id", tagId);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to remove tag:", error);
    return NextResponse.json(
      { error: "Failed to remove tag" },
      { status: 500 },
    );
  }
}
