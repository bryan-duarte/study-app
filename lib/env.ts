/**
 * Environment Configuration
 * Validates all required environment variables at build time
 * Fails fast if configuration is missing
 */

const MISSING_VARS: string[] = [];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Optional: stable fallback user so history/analytics attach to a user when
// no one is logged in. Not required for the build to succeed.
const defaultUserId = process.env.DEFAULT_USER_ID ?? "";

if (!supabaseUrl) {
	MISSING_VARS.push("NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
	MISSING_VARS.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
if (!supabaseServiceRoleKey) {
	MISSING_VARS.push("SUPABASE_SERVICE_ROLE_KEY");
}

if (MISSING_VARS.length > 0) {
	throw new Error(
		`Missing required environment variables: ${MISSING_VARS.join(", ")}\n` +
			"Please set these in your .env.local file. See .env.local.example for reference.",
	);
}

// Type assertion: values are guaranteed to be defined after validation
const env = {
	supabaseUrl: supabaseUrl!,
	supabaseAnonKey: supabaseAnonKey!,
	supabaseServiceRoleKey: supabaseServiceRoleKey!,
	defaultUserId,
} as const;

export { env };
