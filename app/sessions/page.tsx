"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, History, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { SessionSummary } from "@/types/quiz";

function formatDate(iso: string | null): string {
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function scoreTone(pct: number): string {
  if (pct >= 80) return "text-emerald";
  if (pct >= 50) return "text-light-steel";
  return "text-warning-red";
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setError(false);
    fetch("/api/quiz/sessions", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { sessions: SessionSummary[] }) => {
        if (active) setSessions(data.sessions ?? []);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="animate-fade-in-up mb-6">
        <h1 className="text-heading font-w590 text-porcelain">Sessions</h1>
        <p className="mt-1 text-body text-storm-cloud">
          Revisit any past session.
        </p>
      </header>

      {/* Error */}
      {error && (
        <div className="animate-scale-in flex items-center gap-3 rounded-cards border border-warning-red/30 bg-warning-red/[0.07] px-4 py-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-warning-red" strokeWidth={2} />
          <p className="text-body text-light-steel">
            Couldn&apos;t load your sessions. Please try again.
          </p>
        </div>
      )}

      {/* Loading */}
      {!error && sessions === null && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="shimmer h-[88px] w-full rounded-cards border border-charcoal-grey/70 bg-graphite/50"
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!error && sessions !== null && sessions.length === 0 && (
        <div className="animate-scale-in flex flex-col items-center justify-center rounded-cards border border-charcoal-grey/70 bg-graphite/50 px-6 py-16 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-cards border border-charcoal-grey bg-deep-slate text-storm-cloud">
            <History className="h-6 w-6" strokeWidth={2} />
          </span>
          <p className="text-option font-w510 text-porcelain">No sessions yet.</p>
          <p className="mt-1 text-body text-fog-grey">
            Finish a quiz and it&apos;ll show up here.
          </p>
        </div>
      )}

      {/* List */}
      {!error && sessions !== null && sessions.length > 0 && (
        <ul className="space-y-3">
          {sessions.map((s, i) => (
            <li
              key={s.sessionId}
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <SessionRow session={s} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SessionRow({ session }: { session: SessionSummary }) {
  const {
    sessionId,
    startedAt,
    isComplete,
    percentage,
    correctCount,
    answeredCount,
  } = session;

  return (
    <Link
      href={`/sessions/${sessionId}`}
      className="group block rounded-cards border border-charcoal-grey/70 bg-graphite/50 p-4 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-muted-ash focus:outline-none focus-visible:ring-2 focus-visible:ring-storm-cloud"
    >
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-body font-w510 text-porcelain">
              {formatDate(startedAt)}
            </span>
            <Badge variant={isComplete ? "success" : "neutral"} size="sm">
              {isComplete ? "Complete" : "In progress"}
            </Badge>
          </div>
          <p className="mt-1 text-caption text-fog-grey">
            {correctCount}/{answeredCount} correct
          </p>
          <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-pill bg-deep-slate">
            <div
              className={`h-full rounded-pill transition-all duration-700 ${
                percentage >= 80
                  ? "bg-emerald"
                  : percentage >= 50
                    ? "bg-light-steel"
                    : "bg-warning-red"
              }`}
              style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-heading font-w590 ${scoreTone(percentage)}`}>
            {percentage}%
          </span>
          <ChevronRight className="h-5 w-5 flex-shrink-0 text-fog-grey transition-transform group-hover:translate-x-1 group-hover:text-storm-cloud" />
        </div>
      </div>
    </Link>
  );
}
