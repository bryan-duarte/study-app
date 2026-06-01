/**
 * Questions API Route
 * Handles fetching quiz questions with pagination
 */

import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { transformQuestion } from "@/lib/transformers/question";
import { handleApiError } from "@/lib/api-error";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const MIN_LIMIT = 1;

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);

		// Parse pagination parameters
		const page = parseInt(searchParams.get("page") || String(DEFAULT_PAGE));
		const limit = parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT));

		// Validate pagination parameters
		const isInvalidPage = isNaN(page) || page < 1;
		if (isInvalidPage) {
			return NextResponse.json({ error: "Page must be >= 1" }, { status: 400 });
		}

		const isInvalidLimit = limit < MIN_LIMIT || limit > MAX_LIMIT;
		if (isInvalidLimit) {
			return NextResponse.json(
				{ error: `Limit must be between ${MIN_LIMIT} and ${MAX_LIMIT}` },
				{ status: 400 },
			);
		}

		const supabase = createSupabaseClient();

		// Calculate offset for pagination
		const offset = (page - 1) * limit;

		// Fetch questions with pagination
		const { data: questions, error } = await supabase
			.from("questions")
			.select("*")
			.order("created_at", { ascending: true })
			.range(offset, offset + limit - 1);

		if (error) {
			console.error("Supabase query error:", error);
			throw error;
		}

		// Get total count for pagination metadata
		const { count: total, error: countError } = await supabase
			.from("questions")
			.select("*", { count: "exact", head: true });

		if (countError) {
			console.error("Count query error:", countError);
			throw countError;
		}

		// Transform questions to camelCase
		const transformedQuestions = questions.map(transformQuestion);

		// Calculate pagination metadata
		const totalPages = Math.ceil((total || 0) / limit);

		return NextResponse.json({
			questions: transformedQuestions,
			pagination: {
				page,
				limit,
				total: total || 0,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
		});
	} catch (error) {
		const apiError = handleApiError(error, "questions");
		return NextResponse.json(apiError, { status: 500 });
	}
}
