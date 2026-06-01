-- Session Tables Migration
-- Adds tables for session-based quiz system
-- This migration creates the quiz_sessions, session_questions, and user_question_history tables

-- ============================================================================
-- Quiz Sessions Table
-- Stores individual quiz sessions with start/end times
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for session queries
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_started_at ON quiz_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_is_complete ON quiz_sessions(is_complete);

-- ============================================================================
-- Session Questions Table
-- Links questions to sessions with answer state
-- ============================================================================
CREATE TABLE IF NOT EXISTS session_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id UUID,
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, question_id)
);

-- Indexes for session questions queries
CREATE INDEX IF NOT EXISTS idx_session_questions_session_id ON session_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_session_questions_question_id ON session_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_session_questions_answered_at ON session_questions(answered_at);

-- ============================================================================
-- User Question History Table
-- Tracks all answers across all sessions for adaptive learning
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_question_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id UUID NOT NULL,
  is_correct BOOLEAN NOT NULL,
  first_answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  times_answered INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Indexes for user question history queries
CREATE INDEX IF NOT EXISTS idx_user_question_history_user_id ON user_question_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_question_history_question_id ON user_question_history(question_id);
CREATE INDEX IF NOT EXISTS idx_user_question_history_last_answered_at ON user_question_history(last_answered_at DESC);

-- ============================================================================
-- Trigger Functions
-- ============================================================================

-- Update updated_at timestamp for quiz_sessions
CREATE TRIGGER update_quiz_sessions_updated_at
  BEFORE UPDATE ON quiz_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at timestamp for user_question_history
CREATE TRIGGER update_user_question_history_updated_at
  BEFORE UPDATE ON user_question_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Upsert Function for User Question History
-- Updates or creates a record when a user answers a question
-- ============================================================================
CREATE OR REPLACE FUNCTION record_user_question_answer(
  p_user_id UUID,
  p_question_id UUID,
  p_selected_option_id UUID,
  p_is_correct BOOLEAN
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_question_history (
    user_id,
    question_id,
    selected_option_id,
    is_correct,
    first_answered_at,
    last_answered_at,
    times_answered
  )
  VALUES (
    p_user_id,
    p_question_id,
    p_selected_option_id,
    p_is_correct,
    NOW(),
    NOW(),
    1
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

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE quiz_sessions IS 'Stores individual quiz sessions with timing and completion status';
COMMENT ON TABLE session_questions IS 'Links questions to sessions with answer tracking';
COMMENT ON TABLE user_question_history IS 'Tracks all user answers for adaptive learning and question exhaustion';

COMMENT ON COLUMN session_questions.selected_option_id IS 'UUID of the selected option (references options in questions.options JSONB)';
COMMENT ON COLUMN user_question_history.selected_option_id IS 'UUID of the most recently selected option';
COMMENT ON COLUMN user_question_history.times_answered IS 'Count of how many times the user has answered this question';
