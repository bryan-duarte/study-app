-- Restore per-question correctness on user_question_history.
-- The deployed table drifted from migration 20240601000000 (these columns were
-- dropped at some point). They power Mistake Bank (is_correct=false), Insights
-- per-domain accuracy, and the history/Markdown export. Activity tables are
-- empty at apply time, so no backfill is required.

ALTER TABLE user_question_history
  ADD COLUMN IF NOT EXISTS selected_option_id UUID,
  ADD COLUMN IF NOT EXISTS is_correct BOOLEAN,
  ADD COLUMN IF NOT EXISTS first_answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_user_question_history_is_correct
  ON user_question_history(user_id, is_correct);

-- Redefine the upsert so future answers maintain correctness + most-recent option.
CREATE OR REPLACE FUNCTION record_user_question_answer(
  p_user_id UUID,
  p_question_id UUID,
  p_selected_option_id UUID,
  p_is_correct BOOLEAN
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_question_history (
    user_id, question_id, selected_option_id, is_correct,
    first_answered_at, last_answered_at, times_answered
  )
  VALUES (
    p_user_id, p_question_id, p_selected_option_id, p_is_correct,
    NOW(), NOW(), 1
  )
  ON CONFLICT (user_id, question_id)
  DO UPDATE SET
    selected_option_id = EXCLUDED.selected_option_id,
    is_correct = EXCLUDED.is_correct,
    last_answered_at = EXCLUDED.last_answered_at,
    times_answered = user_question_history.times_answered + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
