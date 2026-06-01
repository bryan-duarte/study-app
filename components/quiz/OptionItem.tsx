"use client";

interface OptionItemProps {
  index: number;
  description: string;
  isSelected: boolean;
  showResult: boolean;
  isCorrect: boolean;
  onSelect: () => void;
  disabled: boolean;
}

export default function OptionItem({
  index,
  description,
  isSelected,
  showResult,
  isCorrect,
  onSelect,
  disabled,
}: OptionItemProps) {
  const optionLabel = String.fromCharCode(65 + index);

  const baseClasses =
    "w-full text-left p-4 rounded-buttons border transition-colors";

  const stateClasses = showResult
    ? isCorrect
      ? "border-emerald bg-emerald/10"
      : isSelected
        ? "border-warning-red bg-warning-red/10"
        : "border-charcoal-grey bg-deep-slate"
    : isSelected
      ? "border-neon-lime bg-neon-lime/10"
      : "border-charcoal-grey bg-deep-slate hover:border-muted-ash hover:bg-gunmetal";

  const disabledClasses = disabled ? "cursor-not-allowed opacity-70" : "";

  const ariaSelected = !disabled && isSelected;

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`${baseClasses} ${stateClasses} ${disabledClasses}`}
      role="radio"
      aria-checked={showResult ? isCorrect : ariaSelected}
      aria-disabled={disabled}
      aria-label={`Option ${optionLabel}: ${description}`}
    >
      <div className="flex gap-3">
        <span className="text-fog-grey font-mono flex-shrink-0">
          {optionLabel}.
        </span>
        <p className="text-porcelain flex-1">{description}</p>

        {showResult && isCorrect && (
          <span className="text-emerald" aria-label="Correct answer">
            ✓
          </span>
        )}
        {showResult && isSelected && !isCorrect && (
          <span className="text-warning-red" aria-label="Incorrect answer">
            ✗
          </span>
        )}
      </div>
    </button>
  );
}
