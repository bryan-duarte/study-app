-- Initial Schema for AWS Quiz Application
-- Creates tables for questions, user progress, and analytics

-- Questions table (primary storage)
-- Uses JSONB for options to simplify schema for 65 static questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('single-option', 'multi-option')),
  title TEXT NOT NULL,
  options JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- JSONB options structure example:
-- [
--   {
--     "id": "uuid-string",
--     "description": "Option text here",
--     "is_correct": false,
--     "reasoning": "Explanation text here"
--   }
-- ]

-- User Progress table (for progress sync)
-- Stores user quiz progress with JSONB arrays for answers
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]',
  confirmed_answers JSONB NOT NULL DEFAULT '[]',
  current_index INTEGER NOT NULL DEFAULT 0,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- JSONB arrays structure:
-- answers: [[questionIndex, optionIndex], ...]
-- confirmed_answers: [[questionIndex, optionIndex], ...]

-- Quiz Analytics table (for completion tracking)
CREATE TABLE IF NOT EXISTS quiz_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE SET NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON quiz_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON quiz_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_completed_at ON quiz_analytics(completed_at DESC);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to questions table
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply triggers to user_progress table
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
