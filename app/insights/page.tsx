"use client";

import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Target,
  Trophy,
  Flame,
  CalendarClock,
  AlertTriangle,
  TrendingUp,
  Layers,
  ArrowUpRight,
  Compass,
  RefreshCw,
} from "lucide-react";
import { useStats } from "@/lib/client/useStats";
import { DOMAIN_LABELS, type DomainValue } from "@/lib/categories";
import type { StatsResponse } from "@/types/quiz";
import ScoreTrend from "@/components/insights/ScoreTrend";
import AccuracyBar from "@/components/insights/AccuracyBar";

export default function InsightsPage() {
  const { stats, loading, error, reload } = useStats();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <header className="animate-fade-in-up mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-cards border border-charcoal-grey bg-deep-slate text-neon-lime">
          <BarChart3 className="h-5 w-5" strokeWidth={2} />
        </span>
        <div>
          <h1 className="text-heading font-w590 text-porcelain">Insights</h1>
          <p className="text-body text-storm-cloud">Your readiness at a glance</p>
        </div>
      </header>

      {loading && <LoadingState />}

      {!loading && error && <ErrorState onRetry={reload} />}

      {!loading && !error && (!stats || stats.answered === 0) && <EmptyState />}

      {!loading && !error && stats && stats.answered > 0 && (
        <Dashboard stats={stats} />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                   */
/* -------------------------------------------------------------------------- */

function Dashboard({ stats }: { stats: StatsResponse }) {
  const {
    answered,
    totalQuestions,
    accuracyOverall,
    mastered,
    streakDays,
    dueCount,
    wrongCount,
    byDomain,
    byTopic,
    trend,
  } = stats;

  const coverage = totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0;

  // Weak topics: API already sorts weakest-first; keep only touched topics, bottom ~8.
  const weakTopics = byTopic.filter((t) => t.answered > 0).slice(0, 8);

  const examReady = accuracyOverall >= 80 && totalQuestions > 0 && answered / totalQuestions >= 0.8;

  return (
    <div className="flex flex-col gap-6">
      {/* 2. Headline tiles */}
      <section className="animate-fade-in-up grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <Tile
          icon={Layers}
          tone="steel"
          label="Answered"
          value={`${answered}/${totalQuestions}`}
          sub={`${coverage}% coverage`}
        />
        <Tile
          icon={Target}
          tone="lime"
          label="Accuracy"
          value={`${accuracyOverall}%`}
        />
        <Tile
          icon={CheckCircle2}
          tone="emerald"
          label="Mastered"
          value={mastered}
        />
        <Tile icon={Flame} tone="lime" label="Streak" value={`${streakDays}d`} />
        <Tile
          icon={CalendarClock}
          tone="steel"
          label="Due"
          value={dueCount}
        />
        <Tile
          icon={AlertTriangle}
          tone={wrongCount > 0 ? "red" : "steel"}
          label="Wrong"
          value={wrongCount}
        />
      </section>

      {/* 3. Score trend */}
      <section
        className="animate-fade-in-up rounded-cards border border-charcoal-grey/70 bg-graphite/50 p-4 backdrop-blur-sm sm:p-5"
        style={{ animationDelay: "60ms" }}
      >
        <SectionHead
          icon={TrendingUp}
          title="Score trend"
          hint="Per completed session"
        />
        <ScoreTrend trend={trend} />
      </section>

      {/* 4. Accuracy by domain */}
      <section
        className="animate-fade-in-up rounded-cards border border-charcoal-grey/70 bg-graphite/50 p-4 backdrop-blur-sm sm:p-5"
        style={{ animationDelay: "120ms" }}
      >
        <SectionHead icon={BarChart3} title="Accuracy by domain" />
        <div className="flex flex-col gap-1.5">
          {byDomain.map((d, i) => {
            const label = DOMAIN_LABELS[d.domain as DomainValue] ?? d.domain;
            return (
              <AccuracyBar
                key={d.domain}
                label={label}
                correct={d.correct}
                answered={d.answered}
                accuracy={d.accuracy}
                untouched={d.answered === 0}
                delayMs={i * 60}
              />
            );
          })}
        </div>
      </section>

      {/* 5. Weak topics */}
      <section
        className="animate-fade-in-up rounded-cards border border-charcoal-grey/70 bg-graphite/50 p-4 backdrop-blur-sm sm:p-5"
        style={{ animationDelay: "180ms" }}
      >
        <SectionHead
          icon={Target}
          title="Weak topics"
          hint="Where to focus next"
        />
        {weakTopics.length === 0 ? (
          <p className="py-2 text-body text-fog-grey">
            Answer questions across topics to surface your weak spots.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {weakTopics.map((t, i) => (
              <AccuracyBar
                key={t.topic}
                label={t.topic}
                correct={t.correct}
                answered={t.answered}
                accuracy={t.accuracy}
                delayMs={i * 50}
              />
            ))}
          </div>
        )}
      </section>

      {/* 6. Readiness verdict */}
      <section
        className="animate-fade-in-up"
        style={{ animationDelay: "240ms" }}
      >
        <VerdictBanner examReady={examReady} accuracy={accuracyOverall} coverage={coverage} />
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Verdict                                                                     */
/* -------------------------------------------------------------------------- */

function VerdictBanner({
  examReady,
  accuracy,
  coverage,
}: {
  examReady: boolean;
  accuracy: number;
  coverage: number;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-cards border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
        examReady
          ? "border-neon-lime/30 bg-neon-lime/[0.07]"
          : "border-charcoal-grey/70 bg-graphite/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-cards ${
            examReady ? "bg-neon-lime/15 text-neon-lime" : "bg-deep-slate text-light-steel"
          }`}
        >
          {examReady ? (
            <Trophy className="h-5 w-5" strokeWidth={2} />
          ) : (
            <Target className="h-5 w-5" strokeWidth={2} />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-option font-w590 text-porcelain">
            {examReady ? "Looking exam-ready" : "Keep drilling your weak areas"}
          </p>
          <p className="text-body text-storm-cloud">
            {examReady
              ? `${accuracy}% accuracy across ${coverage}% of the pool. Keep your edge with Due Today.`
              : `You're at ${accuracy}% accuracy on ${coverage}% coverage. Aim for 80%+ across 80% of the pool.`}
          </p>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-buttons bg-neon-lime px-4 py-2 text-body font-w590 text-pitch-black transition-all hover:-translate-y-0.5"
        >
          <Flame className="h-4 w-4" strokeWidth={2.5} />
          Practice
        </Link>
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 rounded-buttons border border-charcoal-grey bg-deep-slate px-4 py-2 text-body font-w510 text-light-steel transition-colors hover:border-muted-ash hover:text-porcelain"
        >
          <Compass className="h-4 w-4" strokeWidth={2} />
          Explorer
        </Link>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                 */
/* -------------------------------------------------------------------------- */

function SectionHead({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof BarChart3;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-light-steel" strokeWidth={2} />
        <h2 className="text-body font-w590 text-porcelain">{title}</h2>
      </div>
      {hint && (
        <span className="text-caption font-w510 uppercase tracking-[0.12em] text-fog-grey">
          {hint}
        </span>
      )}
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Flame;
  label: string;
  value: string | number;
  sub?: string;
  tone: "emerald" | "steel" | "lime" | "red";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald"
      : tone === "lime"
        ? "text-neon-lime"
        : tone === "red"
          ? "text-warning-red"
          : "text-light-steel";
  return (
    <div className="flex flex-col gap-1.5 rounded-cards border border-charcoal-grey/60 bg-deep-slate/50 p-3">
      <Icon className={`h-4 w-4 ${toneClass}`} strokeWidth={2} />
      <div className="min-w-0">
        <p className="truncate text-option font-w590 text-porcelain">{value}</p>
        <p className="truncate text-caption text-fog-grey">{sub ?? label}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* States                                                                      */
/* -------------------------------------------------------------------------- */

function LoadingState() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="shimmer h-[76px] rounded-cards border border-charcoal-grey/60 bg-deep-slate/50"
          />
        ))}
      </div>
      <div className="shimmer h-[200px] rounded-cards border border-charcoal-grey/70 bg-graphite/50" />
      <div className="shimmer h-[220px] rounded-cards border border-charcoal-grey/70 bg-graphite/50" />
      <div className="shimmer h-[300px] rounded-cards border border-charcoal-grey/70 bg-graphite/50" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="animate-scale-in flex flex-col items-center gap-4 rounded-cards border border-dashed border-charcoal-grey/70 bg-graphite/40 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-cards border border-charcoal-grey bg-deep-slate text-light-steel">
        <BarChart3 className="h-6 w-6" strokeWidth={2} />
      </span>
      <div>
        <p className="text-option font-w590 text-porcelain">No insights yet</p>
        <p className="mt-1 text-body text-storm-cloud">
          Take a quiz to unlock insights.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-buttons bg-neon-lime px-4 py-2 text-body font-w590 text-pitch-black transition-all hover:-translate-y-0.5"
      >
        Start practicing
        <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
      </Link>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-cards border border-warning-red/30 bg-warning-red/[0.06] px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-cards bg-warning-red/15 text-warning-red">
        <AlertTriangle className="h-6 w-6" strokeWidth={2} />
      </span>
      <div>
        <p className="text-option font-w590 text-porcelain">Couldn&apos;t load insights</p>
        <p className="mt-1 text-body text-storm-cloud">
          Something went wrong fetching your stats.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-buttons border border-charcoal-grey bg-deep-slate px-4 py-2 text-body font-w510 text-light-steel transition-colors hover:border-muted-ash hover:text-porcelain"
      >
        <RefreshCw className="h-4 w-4" strokeWidth={2} />
        Retry
      </button>
    </div>
  );
}
