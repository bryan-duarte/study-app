/**
 * Supabase Client Factory
 * Creates typed Supabase clients for server and client-side use
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase-generated";
import { env } from "./env";

/**
 * Creates a Supabase client for server-side use
 * Uses service role key for admin operations (bypasses RLS)
 * WARNING: Never use this in client-side code
 */
export function createSupabaseClient() {
	return createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey);
}

/**
 * Creates a Supabase client with anon key
 * Safe for client-side use (subject to RLS policies)
 * Used in API routes for public data access
 */
export function createSupabaseAnonClient() {
	return createClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
