-- Certifications: a first-class table so additional certifications become a
-- data insert, not a code change. Questions link to exactly one certification
-- via a nullable FK (one-to-many); all existing rows are backfilled to SAA-C03.
--
-- Convention follows 20260622000000_add_tags.sql:
--   UUID PK gen_random_uuid(), TIMESTAMPTZ DEFAULT NOW(), idx_/uq_ naming,
--   shared update_updated_at_column() trigger, no RLS (app-level authz).
-- Every statement is idempotent — this DB has drifted before
-- (see 20260621000001_restore_history_correctness.sql).

CREATE TABLE IF NOT EXISTS certifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  exam_code   TEXT,
  provider    TEXT,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Slug is the stable, human-readable identity + idempotent-seed conflict key.
CREATE UNIQUE INDEX IF NOT EXISTS uq_certifications_slug ON certifications(slug);

-- Listing order for the selector (is_active filter + sort_order ASC).
CREATE INDEX IF NOT EXISTS idx_certifications_active_sort
  ON certifications(is_active, sort_order);

-- Keep updated_at fresh on edit (reuses the shared trigger fn from the
-- initial schema migration).
DROP TRIGGER IF EXISTS update_certifications_updated_at ON certifications;
CREATE TRIGGER update_certifications_updated_at
  BEFORE UPDATE ON certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed the only certification we have today (idempotent on slug).
INSERT INTO certifications (name, slug, exam_code, provider, description, sort_order)
VALUES (
  'AWS Solutions Architect – Associate',
  'aws-solutions-architect-associate',
  'SAA-C03',
  'AWS',
  'Design secure, resilient, high-performing, cost-optimized architectures on AWS.',
  0
)
ON CONFLICT (slug) DO NOTHING;

-- Link questions to a certification (one-to-many). Nullable + ON DELETE SET NULL
-- so deleting a certification can never orphan-cascade its questions away.
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS certification_id UUID REFERENCES certifications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_questions_certification_id ON questions(certification_id);

-- Backfill every existing question to SAA-C03.
UPDATE questions
SET certification_id = (
  SELECT id FROM certifications WHERE slug = 'aws-solutions-architect-associate'
)
WHERE certification_id IS NULL;

-- Fail fast if the backfill left any question unlinked (e.g. seed missing).
-- A clean apply leaves zero NULLs; this turns silent drift into a loud error.
DO $$
DECLARE
  unlinked_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unlinked_count FROM questions WHERE certification_id IS NULL;
  IF unlinked_count > 0 THEN
    RAISE EXCEPTION 'Backfill incomplete: % question(s) still have a NULL certification_id', unlinked_count;
  END IF;
END $$;

COMMENT ON TABLE certifications IS 'Certifications a question can belong to (one-to-many). Adding a cert is a data insert, not a code change.';
COMMENT ON COLUMN certifications.slug IS 'Stable human-readable identity; unique; idempotent-seed conflict key.';
COMMENT ON COLUMN certifications.exam_code IS 'Vendor exam code, e.g. SAA-C03.';
COMMENT ON COLUMN certifications.is_active IS 'Whether the cert appears in the selector list.';
COMMENT ON COLUMN certifications.sort_order IS 'Ascending display order in the selector.';
COMMENT ON COLUMN questions.certification_id IS 'Owning certification (one-to-many). Nullable; ON DELETE SET NULL avoids orphan cascade.';

-- Refresh PostgREST schema cache so the new table/column are queryable
-- immediately (avoids PGRST205 stale-cache errors).
NOTIFY pgrst, 'reload schema';
