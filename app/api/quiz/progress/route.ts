/**
 * Progress Sync API Route
 * Handles fetching and saving user quiz progress
 */

import { type NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase";
import type { Database } from "@/types/supabase-generated";

/**
 * GET: Fetch user's quiz progress
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

		const supabase = createSupabaseClient();

		const { data: progress, error } = await supabase
			.from("user_progress")
			.select("*")
			.eq("user_id" as any, user.id as any)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				// No progress found, return default
				return NextResponse.json({
					answers: [],
					confirmedAnswers: [],
					currentIndex: 0,
					isComplete: false,
				});
			}
			throw error;
		}

		return NextResponse.json({
			answers: (progress as any).answers,
			confirmedAnswers: (progress as any).confirmed_answers,
			currentIndex: (progress as any).current_index,
			isComplete: (progress as any).is_complete,
		});
	} catch (error) {
		console.error("Failed to fetch progress:", error);
		return NextResponse.json(
			{ error: "Failed to fetch progress" },
			{ status: 500 },
		);
	}
}

/**
 * POST: Save/update user's quiz progress
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

		const progressData = await request.json();

		// Validate progress data
		const isInvalidData =
			!Array.isArray(progressData.answers) ||
			!Array.isArray(progressData.confirmedAnswers) ||
			typeof progressData.currentIndex !== "number";

		if (isInvalidData) {
			return NextResponse.json(
				{ error: "Invalid progress data" },
				{ status: 400 },
			);
		}

		const supabase = createSupabaseClient();

		// Upsert progress (insert or update) - type assertion needed for Supabase compatibility
		const upsertData = {
			user_id: user.id,
			answers: progressData.answers,
			confirmed_answers: progressData.confirmedAnswers,
			current_index: progressData.currentIndex,
			is_complete: progressData.isComplete || false,
			completed_at: progressData.isComplete
				? new Date().toISOString()
				: undefined,
		} as any;

		const { data, error } = await supabase
			.from("user_progress")
			.upsert(upsertData)
			.select()
			.single();

		if (error) throw error;

		return NextResponse.json({
			success: true,
			progress: data,
		});
	} catch (error) {
		console.error("Failed to save progress:", error);
		return NextResponse.json(
			{ error: "Failed to sync progress" },
			{ status: 500 },
		);
	}
}
