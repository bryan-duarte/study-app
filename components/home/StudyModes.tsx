"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Layers,
  Target,
  CalendarClock,
  ChevronRight,
  Check,
  Shuffle,
} from "lucide-react";
import { useQuizStore } from "@/store/quizStore";
import { DOMAINS, TOPICS } from "@/lib/categories";
import type { SessionMode, StatsResponse } from "@/types/quiz";

interface StudyModesProps {
  stats: StatsResponse | null;
}

/**
 * Home launcher for every session mode:
 *   - Quick practice (standard, interleaved across all domains)
 *   - By category (pick domains + topics; multi-domain = interleaved)
 *   - Mistake Bank (drill questions answered incorrectly)
 *   - Due today (spaced-repetition queue)
 */
export default function StudyModes({ stats }: StudyModesProps) {
  const router = useRouter();
  const setSessionConfig = useQuizStore((s) => s.setSessionConfig);

  const [showCategory, setShowCategory] = useState(false);
  const [domains, setDomains] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);

  const wrongCount = stats?.wrongCount ?? 0;
  const dueCount = stats?.dueCount ?? 0;

  function launch(
    mode: SessionMode,
    extra?: { domains?: string[]; topics?: string[] },
  ) {
    setSessionConfig({
      mode,
      domains: extra?.domains ?? [],
      topics: extra?.topics ?? [],
    });
    router.push("/quiz");
  }

  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  return (
    <div className="w-full">
      {/* Quick practice — primary action */}
      <button
        type="button"
        onClick={() => launch("standard")}
        data-testid="mode-standard"
        className="group flex w-full items-center gap-3.5 rounded-cards bg-neon-lime px-5 py-4 text-left text-pitch-black shadow-[inset_0_2.5px_0_-2px_rgba(255,255,255,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-[1.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-lime focus-visible:ring-offset-2 focus-visible:ring-offset-pitch-black"
      >
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-cards bg-pitch-black/10">
          <Zap className="h-5 w-5 fill-current" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-option font-w590">Quick Practice</span>
          <span className="block text-caption font-w510 opacity-70">
            Fresh questions, all domains interleaved
          </span>
        </span>
        <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </button>

      {/* Secondary modes — bento grid: the "By Category" disclosure spans the
          full width, the two count-badge modes share the row beneath it. */}
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <ModeCard
          testId="mode-category"
          icon={Layers}
          label="By Category"
          sub="Pick domains & topics"
          active={showCategory}
          onClick={() => setShowCategory((v) => !v)}
          className="col-span-2"
        />
        <ModeCard
          testId="mode-mistakes"
          icon={Target}
          label="Mistake Bank"
          sub={wrongCount > 0 ? `${wrongCount} to review` : "Nothing wrong yet"}
          badge={wrongCount > 0 ? wrongCount : undefined}
          badgeTone="error"
          disabled={wrongCount === 0}
          onClick={() => launch("mistakes")}
        />
        <ModeCard
          testId="mode-due"
          icon={CalendarClock}
          label="Due Today"
          sub={dueCount > 0 ? `${dueCount} due for review` : "Nothing due"}
          badge={dueCount > 0 ? dueCount : undefined}
          badgeTone="lime"
          disabled={dueCount === 0}
          onClick={() => launch("due")}
        />
      </div>

      {/* Category picker */}
      {showCategory && (
        <div className="animate-slide-down mt-3 rounded-cards border border-charcoal-grey/70 bg-graphite/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-body font-w510 text-porcelain">Domains</p>
            <button
              type="button"
              onClick={() => setDomains(DOMAINS.map((d) => d.value))}
              className="inline-flex items-center gap-1 text-caption font-w510 text-storm-cloud hover:text-neon-lime"
            >
              <Shuffle className="h-3.5 w-3.5" strokeWidth={2} /> Select all (interleave)
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {DOMAINS.map((d) => (
              <Chip
                key={d.value}
                label={d.label}
                selected={domains.includes(d.value)}
                onClick={() => setDomains((l) => toggle(l, d.value))}
              />
            ))}
          </div>

          <p className="mb-2 mt-4 text-body font-w510 text-porcelain">
            Topics{" "}
            <span className="text-caption font-regular text-fog-grey">
              (optional)
            </span>
          </p>
          <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
            {TOPICS.map((t) => (
              <Chip
                key={t}
                label={t}
                selected={topics.includes(t)}
                onClick={() => setTopics((l) => toggle(l, t))}
                size="sm"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => launch("category", { domains, topics })}
            disabled={domains.length === 0 && topics.length === 0}
            data-testid="start-category"
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-buttons bg-neon-lime px-5 text-body font-w590 text-pitch-black transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start category quiz
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function ModeCard({
  icon: Icon,
  label,
  sub,
  onClick,
  active,
  disabled,
  badge,
  badgeTone,
  testId,
  className,
}: {
  icon: typeof Layers;
  label: string;
  sub: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  badge?: number;
  badgeTone?: "error" | "lime";
  testId?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={`group relative flex items-center gap-3 rounded-cards border p-3.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-storm-cloud ${
        active
          ? "border-neon-lime/40 bg-deep-slate"
          : "border-charcoal-grey/70 bg-graphite/50 hover:-translate-y-0.5 hover:border-muted-ash"
      } ${disabled ? "cursor-not-allowed opacity-45" : ""} ${className ?? ""}`}
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
      {badge !== undefined && (
        <span
          className={`absolute right-2.5 top-2.5 inline-flex min-w-5 items-center justify-center rounded-pill px-1.5 py-0.5 text-caption font-w590 ${
            badgeTone === "error"
              ? "bg-warning-red/20 text-warning-red"
              : "bg-neon-lime/20 text-neon-lime"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function Chip({
  label,
  selected,
  onClick,
  size = "md",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 rounded-pill border transition-colors ${
        size === "sm" ? "px-2.5 py-1 text-caption" : "px-3 py-1.5 text-body"
      } ${
        selected
          ? "border-neon-lime/50 bg-neon-lime/15 text-neon-lime"
          : "border-charcoal-grey bg-deep-slate/60 text-storm-cloud hover:border-muted-ash hover:text-porcelain"
      }`}
    >
      {selected && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
      {label}
    </button>
  );
}
