/**
 * Ensures a single stable "local study" user exists in auth.users so that
 * user_question_history / analytics always have a user_id to attach to,
 * even when no one is explicitly logged in.
 *
 * Prints `DEFAULT_USER_ID=<uuid>` on success. Idempotent.
 *
 * Run: node scripts/ensure-default-user.mjs
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = "default-user@awsprep.app";

if (!URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function findByEmail() {
  const res = await fetch(`${URL}/auth/v1/admin/users?per_page=200`, { headers });
  if (!res.ok) return null;
  const body = await res.json();
  const users = body.users ?? body;
  return users.find?.((u) => u.email === EMAIL) ?? null;
}

async function main() {
  // Try create first (deterministic), fall back to lookup if it already exists.
  const createRes = await fetch(`${URL}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: EMAIL,
      password: "awsprep-local-" + Math.random().toString(36).slice(2),
      email_confirm: true,
    }),
  });

  let user = null;
  if (createRes.ok) {
    user = await createRes.json();
  } else {
    user = await findByEmail();
  }

  if (!user?.id) {
    const detail = await createRes.text().catch(() => "");
    console.error("Could not create or find default user.", detail);
    process.exit(1);
  }

  console.log(`DEFAULT_USER_ID=${user.id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
