-- Add SAA-C03 categorization columns to questions
-- Enables "quiz by category", per-domain insights, and difficulty-aware features.
-- All columns are nullable until populated by scripts/apply-categories.mjs.

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS domain TEXT,
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS difficulty TEXT;

-- Constrain domain + difficulty to the known taxonomy (NULL allowed until populated).
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_domain_check;
ALTER TABLE questions
  ADD CONSTRAINT questions_domain_check
  CHECK (domain IS NULL OR domain IN ('secure', 'resilient', 'performant', 'cost'));

ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_difficulty_check;
ALTER TABLE questions
  ADD CONSTRAINT questions_difficulty_check
  CHECK (difficulty IS NULL OR difficulty IN ('easy', 'medium', 'hard'));

-- Topic stays free-text (controlled vocabulary enforced in the app) but indexed for filtering.
CREATE INDEX IF NOT EXISTS idx_questions_domain ON questions(domain);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);

COMMENT ON COLUMN questions.domain IS 'SAA-C03 domain: secure | resilient | performant | cost';
COMMENT ON COLUMN questions.topic IS 'Primary AWS service/area (controlled vocabulary)';
COMMENT ON COLUMN questions.difficulty IS 'Estimated difficulty: easy | medium | hard';
