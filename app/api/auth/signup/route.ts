/**
 * Signup API Route
 * Handles user registration with Supabase Auth
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

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
			},
		});

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}

		return NextResponse.json({
			message: "Signup successful",
			user: data.user,
		});
	} catch (error) {
		console.error("Signup error:", error);
		return NextResponse.json({ error: "Signup failed" }, { status: 500 });
	}
}
