"use client";

interface ProgressBarProps {
	current: number;
	total: number;
	progress: number;
	sessionProgress?: number;
	sessionTotal?: number;
}

export default function ProgressBar({
	current,
	total,
	progress,
	sessionProgress = 0,
	sessionTotal = 25,
}: ProgressBarProps) {
	const percentageLabel = `${Math.round(progress)}% complete`;
	const sessionLabel = `Session Progress: ${sessionProgress}/${sessionTotal}`;

	return (
		<div className="w-full" role="region" aria-label="Quiz progress">
			<div className="mb-2 flex items-center justify-between">
				<span className="text-caption font-w510 text-storm-cloud">
					<span className="font-mono text-light-steel">
						{String(current).padStart(2, "0")}
					</span>
					<span className="text-fog-grey"> / {total}</span>
				</span>
				<span
					className="text-caption font-regular text-fog-grey"
					aria-hidden="true"
				>
					{percentageLabel}
				</span>
			</div>

			<div
				className="relative mb-3 h-1.5 w-full overflow-hidden rounded-full border border-charcoal-grey bg-deep-slate shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
				role="progressbar"
				aria-valuenow={Math.round(progress)}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label={percentageLabel}
			>
				<div
					className="relative h-full rounded-full bg-neon-lime transition-all duration-500 ease-out"
					style={{ width: `${progress}%` }}
				>
					<div
						className="absolute inset-y-0 right-0 w-10 rounded-full bg-gradient-to-r from-transparent to-white/50"
						aria-hidden
					/>
				</div>
			</div>

			{/* Session Progress Indicator */}
			<div className="flex items-center justify-between">
				<span className="text-caption font-w510 text-fog-grey">
					{sessionLabel}
				</span>
				<span
					className="text-caption font-regular text-storm-cloud"
					aria-hidden="true"
				>
					{sessionTotal - sessionProgress} remaining
				</span>
			</div>

			<div
				className="mt-1 h-1 w-full overflow-hidden rounded-full bg-deep-slate"
				role="progressbar"
				aria-valuenow={sessionProgress}
				aria-valuemin={0}
				aria-valuemax={sessionTotal}
				aria-label={`Session progress: ${sessionProgress} of ${sessionTotal} questions answered`}
			>
				<div
					className="h-full rounded-full bg-emerald transition-all duration-500 ease-out"
					style={{ width: `${(sessionProgress / sessionTotal) * 100}%` }}
				/>
			</div>
		</div>
	);
}
