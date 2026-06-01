"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  progress: number;
}

export default function ProgressBar({ current, total, progress }: ProgressBarProps) {
  const progressLabel = `Question ${current} of ${total}`;
  const percentageLabel = `${Math.round(progress)}% complete`;

  return (
    <div className="w-full" role="region" aria-label="Quiz progress">
      <div className="flex items-center justify-between mb-2">
        <span className="text-caption font-w510 text-storm-cloud">
          {progressLabel}
        </span>
        <span className="text-caption font-regular text-fog-grey" aria-hidden="true">
          {percentageLabel}
        </span>
      </div>

      <div
        className="w-full h-2 bg-deep-slate rounded-full overflow-hidden border border-charcoal-grey"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={percentageLabel}
      >
        <div
          className="h-full bg-neon-lime transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
