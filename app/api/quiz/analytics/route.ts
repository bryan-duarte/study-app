/**
 * Analytics API Route
 * Handles recording and fetching quiz completion analytics
 */

import { type NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase";
import type { Database } from "@/types/supabase-generated";

/**
 * POST: Record quiz completion analytics
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

		const analyticsData = await request.json();

		// Validate analytics data
		const isInvalidData =
			typeof analyticsData.score !== "number" ||
			typeof analyticsData.totalQuestions !== "number" ||
			typeof analyticsData.correctCount !== "number" ||
			typeof analyticsData.percentage !== "number";

		if (isInvalidData) {
			return NextResponse.json(
				{ error: "Invalid analytics data" },
				{ status: 400 },
			);
		}

		const supabase = createSupabaseClient();

		// Insert with type assertion - Supabase types are incompatible with their own Insert type
		// Runtime validation ensures data integrity
		const { data, error } = await supabase
			.from("quiz_analytics")
			.insert({
				user_id: user.id,
				score: analyticsData.score,
				total_questions: analyticsData.totalQuestions,
				correct_count: analyticsData.correctCount,
				percentage: analyticsData.percentage,
			} as any)
			.select()
			.single();

		if (error) throw error;

		return NextResponse.json({
			success: true,
			analytics: data,
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
			.select("*")
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
