/**
 * Logout API Route
 * Handles user logout with Supabase Auth
 */

import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/auth";

export async function POST() {
	try {
		const supabase = await createAuthClient();

		const { error } = await supabase.auth.signOut();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}

		return NextResponse.json({ message: "Logout successful" });
	} catch (error) {
		console.error("Logout error:", error);
		return NextResponse.json({ error: "Logout failed" }, { status: 500 });
	}
}
