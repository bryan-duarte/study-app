-- User Tags: arbitrary study labels per user (single accent color, per-user).
-- Lets the user tag questions for later filtering/export (e.g. "right but
-- don't understand why") on every review surface.
--
-- Convention follows 20240601000000_add_session_tables.sql:
--   UUID PK gen_random_uuid(), TIMESTAMPTZ DEFAULT NOW(), idx_ naming,
--   auth.users(id) FK for ownership, ON DELETE CASCADE everywhere.

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Lowercased/trimmed/spaces->"-". Doubles as the case-insensitive
  -- uniqueness key (uq_tags_user_slug) and the /history?tags= slug param.
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive uniqueness per user (the app lowercases into `slug`).
CREATE UNIQUE INDEX IF NOT EXISTS uq_tags_user_slug ON tags(user_id, slug);

-- Friendly index for listing a user's tags.
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

-- Junction: many-to-many question<->tag. No user_id here — it is implied
-- through the tag FK, and the UNIQUE(question_id, tag_id) keeps assigns
-- idempotent for .upsert(..., { onConflict: "question_id,tag_id" }).
CREATE TABLE IF NOT EXISTS question_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(question_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_question_tags_question_id ON question_tags(question_id);
CREATE INDEX IF NOT EXISTS idx_question_tags_tag_id ON question_tags(tag_id);

-- Keep tags.updated_at fresh on rename (reuses the shared trigger fn from
-- the initial schema migration).
DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE tags IS 'User-defined study tags (single accent color, per-user).';
COMMENT ON COLUMN tags.slug IS 'Lowercased/trimmed/dashed name; enforces case-insensitive uniqueness per user and is used in /history?tags=slug.';
COMMENT ON COLUMN question_tags.created_at IS 'When the tag was assigned (no updates — re-assign is idempotent via UNIQUE).';
