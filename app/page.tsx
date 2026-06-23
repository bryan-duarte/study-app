"use client";

import Link from "next/link";
import {
	Cloud,
	ListOrdered,
	History,
	Compass,
	ArrowUpRight,
	Sparkles,
	AlertTriangle,
	RefreshCw,
} from "lucide-react";
import QuestionCountSelector from "@/components/home/QuestionCountSelector";
import StudyModes from "@/components/home/StudyModes";
import MasterySummary from "@/components/home/MasterySummary";
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

	return (
		<div className="relative mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-5 pb-10 sm:gap-6 sm:px-6 sm:pt-8">
			{/* Subtle top glow for atmosphere (kept contained) */}
			<div
				aria-hidden
				className="pointer-events-none absolute top-[-4%] left-1/2 h-[320px] w-[560px] -translate-x-1/2 rounded-full bg-neon-lime/[0.05] blur-[120px]"
			/>

			{/* 1. Header strip: brand + focal daily line + certification selector */}
			<header className="animate-fade-in-up flex flex-col gap-3">
				<div className="flex items-center gap-3">
					<span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-cards bg-neon-lime text-pitch-black shadow-[0_4px_14px_-4px_rgba(228,242,34,0.5)]">
						<Cloud className="h-5 w-5" strokeWidth={2.5} />
					</span>
					<div className="min-w-0">
						<p className="text-option font-w590 leading-tight text-porcelain">
							Welcome back
						</p>
						<p className="truncate text-caption font-w510 text-storm-cloud">
							{greetingSub(loading, error, answered, dueCount)}
						</p>
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

			{/* 3. Session size */}
			<div
				className="animate-fade-in-up w-full rounded-cards border border-charcoal-grey/70 bg-graphite/50 p-4 backdrop-blur-sm"
				style={{ animationDelay: "120ms" }}
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

			{/* 4. Study modes */}
			<div className="animate-fade-in-up" style={{ animationDelay: "160ms" }}>
				<StudyModes stats={stats} />
			</div>

			{/* 5. Recent activity glance */}
			<section
				className="animate-fade-in-up"
				style={{ animationDelay: "200ms" }}
			>
				<div className="mb-2.5 flex items-center justify-between">
					<p className="text-caption font-w510 uppercase tracking-[0.14em] text-storm-cloud">
						Review & explore
					</p>
					<Link
						href="/insights"
						className="inline-flex items-center gap-1 text-caption font-w510 text-storm-cloud transition-colors hover:text-neon-lime"
					>
						Insights <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
					</Link>
				</div>
				<div className="grid grid-cols-2 gap-2.5">
					<GlanceLink
						href="/sessions"
						icon={History}
						label="Past sessions"
						sub="Review & replay"
					/>
					<GlanceLink
						href="/history"
						icon={Compass}
						label="Explorer"
						sub="Browse & export"
					/>
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

function GlanceLink({
	href,
	icon: Icon,
	label,
	sub,
}: {
	href: string;
	icon: typeof History;
	label: string;
	sub: string;
}) {
	return (
		<Link
			href={href}
			className="group flex items-center gap-3 rounded-cards border border-charcoal-grey/70 bg-graphite/50 p-3.5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-muted-ash"
		>
			<span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-cards border border-charcoal-grey bg-deep-slate text-light-steel transition-colors group-hover:text-neon-lime">
				<Icon className="h-5 w-5" strokeWidth={2} />
			</span>
			<span className="min-w-0">
				<span className="block truncate text-body font-w510 text-porcelain">
					{label}
				</span>
				<span className="block truncate text-caption text-fog-grey">{sub}</span>
			</span>
		</Link>
	);
}
