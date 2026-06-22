/**
 * Shared tag helpers (isomorphic — used by API routes and the client).
 */

/**
 * Normalize a user-entered tag name into a stable slug.
 *
 * The slug is the case-insensitive uniqueness key (DB unique index on
 * (user_id, slug)) and the /history?tags= URL param. "Networking-Tricky"
 * and "networking tricky" collapse to the same slug.
 */
export function toSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
