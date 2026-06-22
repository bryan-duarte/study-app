"use client";

import {
	Cloud,
	Database,
	GraduationCap,
	ListOrdered,
} from "lucide-react";
import QuestionCountSelector from "@/components/home/QuestionCountSelector";
import StudyModes from "@/components/home/StudyModes";
import MasterySummary from "@/components/home/MasterySummary";
import { useStats } from "@/lib/client/useStats";
import { TOTAL_QUESTIONS } from "@/lib/categories";

export default function Home() {
	const { stats, loading } = useStats();

	return (
		<div className="relative flex flex-1 flex-col items-center overflow-hidden px-5 pt-20 pb-16 sm:px-6 sm:pt-24">
			{/* Contained hero glow — focuses the eye on the action area */}
			<div
				aria-hidden
				className="pointer-events-none absolute top-[8%] left-1/2 h-[420px] w-[640px] -translate-x-1/2 rounded-full bg-neon-lime/[0.06] blur-[130px]"
			/>

			{/* Brand header */}
			<header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
				<div className="flex items-center gap-2.5">
					<span className="flex h-8 w-8 items-center justify-center rounded-cards bg-neon-lime text-pitch-black shadow-[0_4px_14px_-4px_rgba(228,242,34,0.5)]">
						<Cloud className="h-4 w-4" strokeWidth={2.5} />
					</span>
					<span className="text-body font-w590 text-porcelain">AWS Quiz</span>
				</div>
				<div className="hidden items-center gap-2 rounded-full border border-charcoal-grey bg-graphite/60 px-3 py-1.5 backdrop-blur-sm sm:inline-flex">
					<Database className="h-3.5 w-3.5 text-light-steel" strokeWidth={2} />
					<span className="text-caption font-w510 text-storm-cloud">
						{TOTAL_QUESTIONS} questions
					</span>
				</div>
			</header>

			<main className="relative flex w-full max-w-2xl flex-col items-center gap-6 sm:gap-7">
				{/* Hero */}
				<div className="flex flex-col items-center gap-4 text-center">
					<div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-charcoal-grey bg-graphite/70 px-3.5 py-1.5 backdrop-blur-sm">
						<GraduationCap className="h-4 w-4 text-neon-lime" strokeWidth={2.25} />
						<span className="text-caption font-w510 uppercase tracking-[0.14em] text-storm-cloud">
							AWS Solutions Architect · SAA-C03
						</span>
					</div>

					<h1 className="animate-fade-in-up text-[clamp(2rem,7vw,3.25rem)] font-w590 leading-[1.08] tracking-[-0.03em] text-porcelain">
						Practice. Drill. Master.
					</h1>

					<p
						className="animate-fade-in-up mx-auto max-w-xl text-body font-regular leading-relaxed text-storm-cloud"
						style={{ animationDelay: "60ms" }}
					>
						{TOTAL_QUESTIONS} exam-style questions across four domains — quiz by
						category, drill your mistakes, or review what&apos;s due today. Every
						answer comes with a detailed explanation.
					</p>
				</div>

				{/* Progress / mastery */}
				<div
					className="animate-fade-in-up w-full"
					style={{ animationDelay: "120ms" }}
				>
					<MasterySummary stats={stats} loading={loading} />
				</div>

				{/* Session size */}
				<div
					className="animate-fade-in-up w-full rounded-cards border border-charcoal-grey/70 bg-graphite/50 p-4 backdrop-blur-sm"
					style={{ animationDelay: "160ms" }}
				>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-3">
							<span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-cards border border-charcoal-grey bg-deep-slate text-light-steel">
								<ListOrdered className="h-5 w-5" strokeWidth={2} />
							</span>
							<div>
								<p className="text-body font-w510 text-porcelain">
									Questions per session
								</p>
								<p className="text-caption text-fog-grey">
									Applies to every mode below
								</p>
							</div>
						</div>
						<div
							role="group"
							aria-label="Question count selection"
							className="w-full sm:w-auto"
						>
							<QuestionCountSelector />
						</div>
					</div>
				</div>

				{/* Mode launcher */}
				<div
					className="animate-fade-in-up w-full"
					style={{ animationDelay: "200ms" }}
				>
					<StudyModes stats={stats} />
				</div>
			</main>
		</div>
	);
}
