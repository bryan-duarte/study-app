"use client";

import Link from "next/link";
import { Flame, Target, CheckCircle2, Trophy, ArrowUpRight } from "lucide-react";
import type { StatsResponse } from "@/types/quiz";

interface MasterySummaryProps {
  stats: StatsResponse | null;
  loading: boolean;
}

/**
 * Motivation loop on the home screen: mastered X/total, accuracy, day streak,
 * plus the exhaustion banner once the whole pool has been answered.
 */
export default function MasterySummary({ stats, loading }: MasterySummaryProps) {
  if (loading) {
    return (
      <div className="shimmer h-[92px] w-full rounded-cards border border-charcoal-grey/70 bg-graphite/50" />
    );
  }
  if (!stats || stats.answered === 0) return null;

  const { mastered, totalQuestions, accuracyOverall, streakDays, isExhausted } =
    stats;
  const pct = totalQuestions > 0 ? Math.round((mastered / totalQuestions) * 100) : 0;

  return (
    <div className="w-full">
      {isExhausted && (
        <div className="animate-scale-in mb-3 flex items-center gap-3 rounded-cards border border-neon-lime/30 bg-neon-lime/[0.07] px-4 py-3">
          <Trophy className="h-5 w-5 flex-shrink-0 text-neon-lime" strokeWidth={2} />
          <p className="text-body text-porcelain">
            You&apos;ve answered all{" "}
            <span className="font-w590">{totalQuestions}</span> questions —{" "}
            <span className="font-w590 text-neon-lime">{accuracyOverall}%</span>{" "}
            accuracy. Keep them sharp with Mistake Bank or Due Today.
          </p>
        </div>
      )}

      <div className="rounded-cards border border-charcoal-grey/70 bg-graphite/50 p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-caption font-w510 uppercase tracking-[0.14em] text-storm-cloud">
            Your progress
          </p>
          <Link
            href="/insights"
            className="inline-flex items-center gap-1 text-caption font-w510 text-storm-cloud transition-colors hover:text-neon-lime"
          >
            Insights <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>

        {/* Mastery progress */}
        <div className="mb-3">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-body font-w510 text-porcelain">
              {mastered}
              <span className="text-storm-cloud">/{totalQuestions} mastered</span>
            </span>
            <span className="text-caption font-w510 text-fog-grey">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-pill bg-deep-slate">
            <div
              className="h-full rounded-pill bg-neon-lime transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-2">
          <Stat icon={CheckCircle2} tone="emerald" label="Mastered" value={mastered} />
          <Stat icon={Target} tone="steel" label="Accuracy" value={`${accuracyOverall}%`} />
          <Stat icon={Flame} tone="lime" label="Streak" value={`${streakDays}d`} />
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Flame;
  label: string;
  value: string | number;
  tone: "emerald" | "steel" | "lime";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald"
      : tone === "lime"
        ? "text-neon-lime"
        : "text-light-steel";
  return (
    <div className="flex items-center gap-2 rounded-cards border border-charcoal-grey/60 bg-deep-slate/50 px-3 py-2">
      <Icon className={`h-4 w-4 flex-shrink-0 ${toneClass}`} strokeWidth={2} />
      <div className="min-w-0">
        <p className="truncate text-body font-w590 text-porcelain">{value}</p>
        <p className="truncate text-caption text-fog-grey">{label}</p>
      </div>
    </div>
  );
}
