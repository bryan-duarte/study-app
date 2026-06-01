/**
 * Authentication Utilities
 * Provides Supabase auth client and helper functions
 */

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase-generated";
import { env } from "./env";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 1 week in seconds

/**
 * Creates a Supabase client for server-side auth operations
 * Uses cookie storage for session persistence
 */
export async function createAuthClient() {
	const cookieStore = await cookies();

	return createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
		auth: {
			storage: {
				getItem: (key: string) => {
					return cookieStore.get(key)?.value ?? null;
				},
				setItem: (key: string, value: string) => {
					cookieStore.set({
						name: key,
						value,
						maxAge: COOKIE_MAX_AGE,
						path: "/",
						secure: true,
						httpOnly: true,
						sameSite: "strict" as const,
					});
				},
				removeItem: (key: string) => {
					cookieStore.delete({ name: key });
				},
			},
		},
	});
}

/**
 * Gets the current authenticated user from session
 */
export async function getUser() {
	const supabase = await createAuthClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		return null;
	}

	return user;
}

/**
 * Checks if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
	const user = await getUser();
	return user !== null;
}
