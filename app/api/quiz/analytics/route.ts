/**
 * Analytics API Route
 * Handles recording and fetching quiz completion analytics
 * Updated to work with session-based quiz system
 */

import { type NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase";
import type { AnalyticsRequest, SessionAnalytics } from "@/types/quiz";

/**
 * POST: Record quiz completion analytics
 * Links analytics record to specific session
 * Records detailed session metrics
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseAuth = await createAuthClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const analyticsData = (await request.json()) as AnalyticsRequest;

    // Validate analytics data
    if (!analyticsData.sessionId) {
      return NextResponse.json(
        { error: "Invalid analytics data: sessionId required" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseClient();

    // Fetch session details to calculate analytics
    const { data: session, error: sessionError } = await supabase
      .from("quiz_sessions")
      .select(`
        id,
        started_at,
        completed_at,
        session_questions (
          is_correct,
          answered_at
        )
      `)
      .eq("id", analyticsData.sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found or access denied" },
        { status: 404 },
      );
    }

    // Calculate session metrics
    const questions = session.session_questions || [];
    const totalQuestions = questions.length;
    const correctCount = questions.filter((q: any) => q.is_correct).length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Calculate duration in seconds
    let duration = 0;
    if (session.completed_at && session.started_at) {
      duration = Math.floor(
        (new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 1000
      );
    }

    // Insert analytics record linked to session
    const { data, error } = await supabase
      .from("quiz_analytics")
      .insert({
        user_id: user.id,
        session_id: analyticsData.sessionId,
        score: percentage,
        total_questions: totalQuestions,
        correct_count: correctCount,
        percentage: percentage,
        completed_at: session.completed_at || new Date().toISOString(),
      } as any)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json<SessionAnalytics>({
      sessionId: session.id,
      score: percentage,
      totalQuestions,
      correctCount,
      percentage,
      duration,
      completedAt: session.completed_at || new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to record analytics:", error);
    return NextResponse.json(
      { error: "Failed to record analytics" },
      { status: 500 },
    );
  }
}

/**
 * GET: Fetch user's analytics history
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseAuth = await createAuthClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from("quiz_analytics")
      .select(`
        *,
        quiz_sessions (
          id,
          started_at,
          completed_at
        )
      `)
      .eq("user_id" as any, user.id as any)
      .order("completed_at" as any, { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      analytics: data,
      total: data.length,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
