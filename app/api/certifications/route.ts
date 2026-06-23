/**
 * Certifications API Route
 *
 * Lists the active certifications (ordered for the selector). The active
 * certification drives question filtering for quiz/history/stats/export, so a
 * second certification later is a pure data insert — no code change.
 */
import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { transformCertification } from "@/lib/transformers/certification";

export async function GET() {
	try {
		const supabase = createSupabaseClient();
		const { data, error } = await supabase
			.from("certifications")
			.select("*")
			.eq("is_active", true)
			.order("sort_order", { ascending: true });
		if (error) throw error;

		const certifications = (data ?? []).map(transformCertification);
		return NextResponse.json({ certifications });
	} catch (error) {
		console.error("Failed to fetch certifications:", error);
		return NextResponse.json(
			{ error: "Failed to fetch certifications" },
			{ status: 500 },
		);
	}
}
