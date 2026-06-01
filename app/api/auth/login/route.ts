/**
 * Login API Route
 * Handles user authentication with Supabase Auth
 */

import { type NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/auth";

export async function POST(request: NextRequest) {
	try {
		const { email, password } = await request.json();

		const hasMissingCredentials = !email || !password;
		if (hasMissingCredentials) {
			return NextResponse.json(
				{ error: "Email and password required" },
				{ status: 400 },
			);
		}

		const supabase = await createAuthClient();

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 401 });
		}

		return NextResponse.json({
			message: "Login successful",
			user: data.user,
			session: data.session,
		});
	} catch (error) {
		console.error("Login error:", error);
		return NextResponse.json({ error: "Login failed" }, { status: 500 });
	}
}
