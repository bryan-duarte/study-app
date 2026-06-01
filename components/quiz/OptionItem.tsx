"use client";

interface OptionItemProps {
	index: number;
	description: string;
	isSelected: boolean;
	showResult: boolean;
	isCorrect: boolean;
	shouldShowCorrect?: boolean;
	onSelect: () => void;
	disabled: boolean;
	isMultiSelect?: boolean;
}

export default function OptionItem({
	index,
	description,
	isSelected,
	showResult,
	isCorrect,
	shouldShowCorrect = false,
	onSelect,
	disabled,
	isMultiSelect = false,
}: OptionItemProps) {
	const optionLabel = String.fromCharCode(65 + index);

	const baseClasses =
		"w-full text-left p-4 rounded-cards border-2 transition-all relative";

	// Determine the visual state
	const stateClasses = showResult
		? isCorrect
			? "border-forest-green bg-forest-green/20"
			: isSelected
				? "border-warning-red bg-warning-red/20"
				: shouldShowCorrect
					? "border-emerald bg-emerald/10 border-dashed"
					: "border-charcoal-grey bg-deep-slate opacity-50"
		: isSelected
			? "border-neon-lime bg-neon-lime/10"
			: "border-charcoal-grey bg-deep-slate hover:border-muted-ash hover:bg-gunmetal";

	const disabledClasses = disabled ? "cursor-not-allowed" : "cursor-pointer";

	const ariaSelected = !disabled && isSelected;

	return (
		<button
			onClick={onSelect}
			disabled={disabled}
			className={`${baseClasses} ${stateClasses} ${disabledClasses}`}
			role={isMultiSelect ? "checkbox" : "radio"}
			aria-checked={showResult ? isCorrect : ariaSelected}
			aria-disabled={disabled}
			aria-label={`Option ${optionLabel}: ${description}`}
		>
			<div className="flex gap-3 items-start">
				{/* Option letter indicator */}
				<span
					className={`font-mono flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-badges text-xs font-semibold ${
						showResult && isCorrect
							? "bg-forest-green text-pitch-black"
							: showResult && isSelected && !isCorrect
								? "bg-warning-red text-pitch-black"
								: showResult && shouldShowCorrect
									? "bg-emerald/30 text-emerald"
									: isSelected
										? "bg-neon-lime text-pitch-black"
										: "bg-gunmetal text-storm-cloud"
					}`}
				>
					{optionLabel}
				</span>

				<p className={`text-option flex-1 ${
					showResult && isCorrect
						? "text-forest-green font-medium"
						: showResult && isSelected && !isCorrect
							? "text-warning-red"
							: showResult && shouldShowCorrect
								? "text-emerald/80"
								: "text-porcelain"
				}`}>
					{description}
				</p>

				{/* Result indicator icons */}
				{showResult && isCorrect && (
					<div
						className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-forest-green"
						aria-label="Correct answer"
					>
						<svg
							className="w-4 h-4 text-pitch-black"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							strokeWidth="3"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
				)}
				{showResult && isSelected && !isCorrect && (
					<div
						className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-warning-red"
						aria-label="Incorrect answer"
					>
						<svg
							className="w-4 h-4 text-pitch-black"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							strokeWidth="3"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</div>
				)}
				{showResult && shouldShowCorrect && !isSelected && (
					<div
						className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full border border-emerald/50"
						aria-label="Missed correct answer"
					>
						<svg
							className="w-4 h-4 text-emerald/70"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							strokeWidth="3"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
				)}
			</div>
		</button>
	);
}
