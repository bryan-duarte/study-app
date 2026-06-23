"use client";

import { Cloud, Sparkles, AlertTriangle, RefreshCw } from "lucide-react";
import StudyModes from "@/components/home/StudyModes";
import MasterySummary from "@/components/home/MasterySummary";
import QuestionCountSelector from "@/components/home/QuestionCountSelector";
import CertificationSelector from "@/components/certifications/CertificationSelector";
import { useStats } from "@/lib/client/useStats";

/** Focal daily line: leads with what to do today (due work), then progress. */
function greetingSub(
	loading: boolean,
	error: boolean,
	answered: number,
	dueCount: number,
): string {
	if (loading) return "Loading your progress…";
	if (error) return "Couldn't load your progress — tap retry";
	if (dueCount > 0) {
		return `${dueCount} question${dueCount === 1 ? "" : "s"} due today`;
	}
	if (answered > 0) return "You're all caught up — keep your streak going";
	return "Start your first session below";
}

export default function Home() {
	const { stats, loading, error, reload } = useStats();
	const answered = stats?.answered ?? 0;
	const dueCount = stats?.dueCount ?? 0;
	// A failed fetch must not be mistaken for "no progress yet" — only treat the
	// user as new when the request actually succeeded with zero answers.
	const isNewUser = !loading && !error && answered === 0;
	// A live "signal LED" only pulses when there's actually work waiting today.
	const hasDue = dueCount > 0;

	return (
		<div className="relative mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-6 pb-10 sm:gap-6 sm:px-6 sm:pt-8">
			{/* 1. Header strip: brand eyebrow + focal daily line + certification */}
			<header className="animate-fade-in-up relative z-50 flex flex-col gap-4">
				<div className="flex items-center gap-3">
					<span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-cards bg-neon-lime text-pitch-black shadow-[inset_0_2.5px_0_-2px_rgba(255,255,255,0.4)]">
						<Cloud className="h-5 w-5" strokeWidth={2.5} />
					</span>
					<div className="min-w-0 flex-1">
						<p className="text-caption font-w590 uppercase tracking-[0.16em] text-storm-cloud">
							Welcome back
						</p>
						<div className="flex items-center gap-2">
							{hasDue && (
								<span className="relative flex h-2 w-2 flex-shrink-0">
									<span className="absolute inline-flex h-full w-full animate-ping rounded-pill bg-neon-lime opacity-75" />
									<span className="relative inline-flex h-2 w-2 rounded-pill bg-neon-lime" />
								</span>
							)}
							<p className="min-w-0 truncate text-question font-w590 text-porcelain">
								{greetingSub(loading, error, answered, dueCount)}
							</p>
						</div>
					</div>
				</div>
				<CertificationSelector className="w-full" />
			</header>

			{/* 2. Progress hero */}
			<div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
				{error ? (
					<StatsErrorCard onRetry={reload} />
				) : isNewUser ? (
					<GettingStartedCard />
				) : (
					<MasterySummary stats={stats} loading={loading} />
				)}
			</div>

			{/* 3. Practice — section header carries the label; the selector beside it
			    is label-less (icon + count) and applies to every mode below. */}
			<section className="flex flex-col gap-3">
				<div
					className="animate-fade-in-up flex items-center justify-between gap-3"
					style={{ animationDelay: "120ms" }}
				>
					<p className="text-caption font-w590 uppercase tracking-[0.16em] text-storm-cloud">
						Practice
					</p>
					<QuestionCountSelector />
				</div>
				<div className="animate-fade-in-up" style={{ animationDelay: "150ms" }}>
					<StudyModes stats={stats} />
				</div>
			</section>
		</div>
	);
}

function GettingStartedCard() {
	return (
		<div className="flex items-start gap-3 rounded-cards border border-neon-lime/25 bg-neon-lime/[0.06] p-4">
			<span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-cards bg-neon-lime/15 text-neon-lime">
				<Sparkles className="h-5 w-5" strokeWidth={2} />
			</span>
			<div>
				<p className="text-option font-w590 text-porcelain">
					Welcome to your study dashboard
				</p>
				<p className="mt-0.5 text-body text-storm-cloud">
					Answer your first questions below to unlock progress tracking,
					insights, and spaced repetition.
				</p>
			</div>
		</div>
	);
}

/** Shown when the stats fetch fails — an existing user with a transient error
 *  must see a retry affordance, never the "new user" onboarding card. */
function StatsErrorCard({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="flex items-start gap-3 rounded-cards border border-warning-red/30 bg-warning-red/[0.06] p-4">
			<span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-cards bg-warning-red/15 text-warning-red">
				<AlertTriangle className="h-5 w-5" strokeWidth={2} />
			</span>
			<div className="min-w-0 flex-1">
				<p className="text-option font-w590 text-porcelain">
					Couldn&apos;t load your progress
				</p>
				<p className="mt-0.5 text-body text-storm-cloud">
					Check your connection and try again — your stats and streak are safe.
				</p>
				<button
					type="button"
					onClick={onRetry}
					className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-buttons border border-charcoal-grey bg-deep-slate px-3.5 text-body font-w510 text-porcelain transition-colors hover:border-muted-ash hover:text-neon-lime focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-lime focus-visible:ring-offset-2 focus-visible:ring-offset-pitch-black"
				>
					<RefreshCw className="h-4 w-4" strokeWidth={2} />
					Retry
				</button>
			</div>
		</div>
	);
}
