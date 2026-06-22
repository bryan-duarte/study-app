/**
 * Server-side user resolution.
 *
 * The quiz can be played logged-in or not. To make per-question history,
 * spaced repetition, mastery and insights work without forcing a login wall,
 * we fall back to a single stable "default" user when nobody is authenticated.
 */
import { getUser } from "@/lib/auth";
import { env } from "@/lib/env";

/** Stable fallback user id (server-only). Empty string if not configured. */
export const DEFAULT_USER_ID = env.defaultUserId;

/**
 * Resolves the effective user id for server-side data operations:
 * the authenticated user if present, otherwise the stable default user.
 * Returns null only when neither is available.
 */
export async function resolveUserId(): Promise<string | null> {
  try {
    const user = await getUser();
    if (user?.id) return user.id;
  } catch {
    // getUser reads cookies and can throw outside a request scope; fall back.
  }
  return DEFAULT_USER_ID || null;
}
