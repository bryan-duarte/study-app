"use client";

/** Accuracy color rule shared across Insights bars: emerald >=80, lime >=60, red <60. */
export function accuracyTone(accuracy: number): { bar: string; text: string } {
  if (accuracy >= 80) return { bar: "bg-emerald", text: "text-emerald" };
  if (accuracy >= 60) return { bar: "bg-neon-lime", text: "text-neon-lime" };
  return { bar: "bg-warning-red", text: "text-warning-red" };
}

interface AccuracyBarProps {
  label: string;
  correct: number;
  answered: number;
  accuracy: number;
  /** When true, render a muted "untouched" row with no progress fill. */
  untouched?: boolean;
  delayMs?: number;
}

/**
 * A single horizontal accuracy bar (used for both domains and weak topics).
 * Bar width tracks accuracy%; color follows the shared accuracyTone rule.
 */
export default function AccuracyBar({
  label,
  correct,
  answered,
  accuracy,
  untouched = false,
  delayMs = 0,
}: AccuracyBarProps) {
  if (untouched) {
    return (
      <div className="flex items-center justify-between gap-3 py-1">
        <span className="min-w-0 flex-1 truncate text-body text-storm-cloud">{label}</span>
        <span className="text-caption font-w510 text-fog-grey">untouched</span>
      </div>
    );
  }

  const tone = accuracyTone(accuracy);

  return (
    <div className="py-1">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="min-w-0 flex-1 truncate text-body font-w510 text-porcelain">
          {label}
        </span>
        <span className="flex flex-shrink-0 items-baseline gap-2">
          <span className="text-caption font-regular text-fog-grey">
            {correct}/{answered}
          </span>
          <span className={`text-body font-w590 ${tone.text}`}>{accuracy}%</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-pill bg-deep-slate">
        <div
          className={`h-full rounded-pill ${tone.bar} transition-all duration-700`}
          style={{ width: `${Math.max(2, Math.min(100, accuracy))}%`, transitionDelay: `${delayMs}ms` }}
        />
      </div>
    </div>
  );
}
