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
 * Question-selection modes for starting a session.
 * - standard:  random unanswered questions (interleaved across all domains)
 * - category:  restricted to selected domains/topics
 * - mistakes:  drill questions previously answered incorrectly
 * - due:       spaced-repetition questions due for review today
 */
export type SessionMode = "standard" | "category" | "mistakes" | "due";

/**
 * Request body for POST /api/quiz/session/start
 */
export interface SessionStartRequest {
  /** Explicit user override (rare); otherwise resolved server-side. */
  user_id?: string;
  /** How many questions to assign. */
  question_count?: number;
  /** Selection mode (defaults to "standard"). */
  mode?: SessionMode;
  /** Category mode: restrict to these SAA-C03 domains. */
  domains?: string[];
  /** Category mode: restrict to these topics. */
  topics?: string[];
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
// Tags
// ============================================================================

/** A user-defined study tag (camelCase mirror of the tags table). */
export interface Tag {
  id: string;
  /** Display name (user-editable; rename recomputes the slug). */
  name: string;
  /** Lowercased/trimmed/dashed name; uniqueness key + /history?tags= param. */
  slug: string;
}

/** Tag with the number of questions carrying it (management page + bulk UI). */
export interface TagWithCount extends Tag {
  questionCount: number;
}

// ============================================================================
// History / Explorer / Stats Types
// ============================================================================

/** A previously answered question with full detail (Explorer + Markdown export). */
export interface HistoryItem {
  questionId: string;
  title: string;
  type: "single-option" | "multi-option";
  domain: string | null;
  topic: string | null;
  difficulty: string | null;
  options: {
    id: string;
    description: string;
    isCorrect: boolean;
    reasoning: string;
  }[];
  selectedOptionId: string | null;
  isCorrect: boolean | null;
  timesAnswered: number;
  firstAnsweredAt: string | null;
  lastAnsweredAt: string | null;
  /** Tags assigned by the user (populated by GET /api/quiz/history). Optional so older/cached responses stay valid. */
  tags?: Tag[];
}

/** Summary of a past session (for the replay list). */
export interface SessionSummary {
  sessionId: string;
  startedAt: string | null;
  completedAt: string | null;
  isComplete: boolean;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  percentage: number;
}

export interface DomainStat {
  domain: string;
  total: number;
  answered: number;
  correct: number;
  accuracy: number;
}

export interface TopicStat {
  topic: string;
  total: number;
  answered: number;
  correct: number;
  accuracy: number;
}

export interface TrendPoint {
  completedAt: string;
  percentage: number;
}

/** Aggregate study stats powering Mastery, Insights, Exhaustion + due badge. */
export interface StatsResponse {
  totalQuestions: number;
  answered: number;
  mastered: number;
  wrongCount: number;
  dueCount: number;
  accuracyOverall: number;
  isExhausted: boolean;
  streakDays: number;
  byDomain: DomainStat[];
  byTopic: TopicStat[];
  trend: TrendPoint[];
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
