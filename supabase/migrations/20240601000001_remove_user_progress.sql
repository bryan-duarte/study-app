-- Remove deprecated user_progress table
-- This table was replaced by the session-based architecture (quiz_sessions + session_questions)
-- No foreign keys or views depend on this table
-- Migration timestamp: 2024-06-01T00:00:01Z

DROP TABLE IF EXISTS user_progress CASCADE;
