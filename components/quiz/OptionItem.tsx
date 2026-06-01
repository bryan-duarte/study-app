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
		"w-full text-left p-4 rounded-buttons border-2 transition-all";

	const stateClasses = showResult
		? isCorrect
			? "border-emerald bg-emerald/40 shadow-[0_0_24px_rgba(34,197,94,0.5)]"
			: isSelected
				? "border-warning-red bg-warning-red/40 shadow-[0_0_24px_rgba(235,87,87,0.5)]"
				: "border-charcoal-grey bg-deep-slate opacity-40"
		: isSelected
			? "border-neon-lime bg-neon-lime/40"
			: "border-charcoal-grey bg-deep-slate hover:border-muted-ash hover:bg-gunmetal";

	const disabledClasses = disabled ? "cursor-not-allowed" : "cursor-pointer";

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
			<div className="flex gap-3 items-start">
				<span className="text-fog-grey font-mono flex-shrink-0">
					{optionLabel}.
				</span>
				<p className="text-option text-porcelain flex-1">{description}</p>

				{showResult && isCorrect && (
					<span
						className="text-emerald text-2xl font-black flex-shrink-0 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]"
						aria-label="Correct answer"
					>
						✓
					</span>
				)}
				{showResult && isSelected && !isCorrect && (
					<span
						className="text-warning-red text-2xl font-black flex-shrink-0 drop-shadow-[0_0_8px_rgba(235,87,87,0.6)]"
						aria-label="Incorrect answer"
					>
						✗
					</span>
				)}
			</div>
		</button>
	);
}
