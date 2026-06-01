/**
 * Quiz Application Type Definitions
 *
 * This file contains all shared types for the quiz session system,
 * API requests/responses, and data structures.
 */

import type { QuizQuestion } from "@/lib/transformers/question";

// ============================================================================
// Session Types
// ============================================================================

/**
 * A question within a session with answer state
 */
export interface SessionQuestion {
  /** Unique identifier for this session-question relationship */
  questionId: string;
  /** The full question data with options */
  question: QuizQuestion;
  /** ID of the selected option (if answered) */
  selectedOptionId?: string;
  /** Whether the answer was correct (if answered) */
  isCorrect?: boolean;
  /** ISO timestamp when the question was answered */
  answeredAt?: string;
}

/**
 * Response from starting a new quiz session
 */
export interface SessionStartResponse {
  /** Unique session identifier */
  sessionId: string;
  /** Questions assigned to this session (shuffled) */
  questions: SessionQuestion[];
  /** Total number of questions available (excluding answered) */
  totalAvailableQuestions: number;
}

/**
 * Request body for recording quiz progress
 */
export interface ProgressRequest {
  /** Session identifier */
  sessionId: string;
  /** Array of answers to record */
  answers: ProgressAnswer[];
}

/**
 * Individual answer in progress sync
 */
export interface ProgressAnswer {
  /** Question ID */
  questionId: string;
  /** Selected option ID */
  selectedOptionId: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

/**
 * Request body for recording analytics
 */
export interface AnalyticsRequest {
  /** Session identifier */
  sessionId: string;
}

/**
 * Response from recording session analytics
 */
export interface SessionAnalytics {
  /** Session identifier */
  sessionId: string;
  /** Final score (percentage) */
  score: number;
  /** Total questions in session */
  totalQuestions: number;
  /** Number of correct answers */
  correctCount: number;
  /** Score as percentage */
  percentage: number;
  /** Time taken to complete session (seconds) */
  duration: number;
  /** ISO timestamp of completion */
  completedAt: string;
}

// ============================================================================
// Session Metrics Types
// ============================================================================

/**
 * Session completion metrics
 */
export interface SessionMetrics {
  /** Session identifier */
  sessionId: string;
  /** Number of questions answered */
  questionsAnswered: number;
  /** Number of correct answers */
  correctCount: number;
  /** Total unique questions answered across all sessions */
  totalUniqueQuestionsAnswered: number;
  /** Session start timestamp (milliseconds) */
  startTime: number;
  /** Session end timestamp (milliseconds) */
  endTime?: number;
  /** Whether session is marked complete */
  isComplete: boolean;
}

// ============================================================================
// Database Types (Supabase tables)
// ============================================================================

/**
 * Quiz session record from quiz_sessions table
 */
export interface QuizSession {
  id: string;
  user_id: string | null;
  started_at: string;
  completed_at: string | null;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Session question record from session_questions table
 */
export interface SessionQuestionRecord {
  id: string;
  session_id: string;
  question_id: string;
  selected_option_id: string | null;
  is_correct: boolean | null;
  answered_at: string | null;
  created_at: string;
}

/**
 * User question history record from user_question_history table
 */
export interface UserQuestionHistory {
  id: string;
  user_id: string;
  question_id: string;
  selected_option_id: string;
  is_correct: boolean;
  first_answered_at: string;
  last_answered_at: string;
  times_answered: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Legacy Types (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use SessionQuestion instead
 */
export interface LegacySessionQuestion {
  id: string;
  session_id: string;
  question_id: string;
  selected_option_id?: string;
  is_correct?: boolean;
  answered_at?: string;
}
