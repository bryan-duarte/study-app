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
	const progressLabel = `Question ${current} of ${total}`;
	const percentageLabel = `${Math.round(progress)}% complete`;
	const sessionLabel = `Session Progress: ${sessionProgress}/${sessionTotal}`;

	return (
		<div className="w-full" role="region" aria-label="Quiz progress">
			<div className="flex items-center justify-between mb-2">
				<span className="text-caption font-w510 text-storm-cloud">
					{progressLabel}
				</span>
				<span
					className="text-caption font-regular text-fog-grey"
					aria-hidden="true"
				>
					{percentageLabel}
				</span>
			</div>

			<div
				className="w-full h-2 bg-deep-slate rounded-full overflow-hidden border border-charcoal-grey mb-2"
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
				className="w-full h-1 bg-deep-slate rounded-full overflow-hidden mt-1"
				role="progressbar"
				aria-valuenow={sessionProgress}
				aria-valuemin={0}
				aria-valuemax={sessionTotal}
				aria-label={`Session progress: ${sessionProgress} of ${sessionTotal} questions answered`}
			>
				<div
					className="h-full bg-emerald transition-all duration-300 ease-out"
					style={{ width: `${(sessionProgress / sessionTotal) * 100}%` }}
				/>
			</div>
		</div>
	);
}
