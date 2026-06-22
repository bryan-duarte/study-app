/**
 * Lightweight spaced-repetition scheduling.
 *
 * Built entirely from data we already track — times_answered, last_answered_at
 * and is_correct — so it needs no schema change. Leitner-style: each correct
 * answer pushes the next review further out; a most-recent *incorrect* answer
 * makes the question due immediately (drill it again soon).
 */
export const SRS_INTERVALS_DAYS = [1, 3, 7, 16, 35, 90] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface SrsInput {
  times_answered: number;
  last_answered_at: string | null;
  is_correct: boolean | null;
}

/** Days until the next review given how many times the question was answered. */
export function intervalDays(timesAnswered: number): number {
  const i = Math.min(
    Math.max(timesAnswered - 1, 0),
    SRS_INTERVALS_DAYS.length - 1,
  );
  return SRS_INTERVALS_DAYS[i];
}

/** Epoch-ms timestamp when this question next becomes due for review. */
export function dueAt(input: SrsInput): number {
  const last = input.last_answered_at
    ? new Date(input.last_answered_at).getTime()
    : 0;
  if (input.is_correct === false) return last; // wrong → due now
  return last + intervalDays(input.times_answered) * DAY_MS;
}

export function isDue(input: SrsInput, now: number = Date.now()): boolean {
  return dueAt(input) <= now;
}
