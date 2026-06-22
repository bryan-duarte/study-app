"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, AlertCircle, History } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import ReviewQuestion from "@/components/sessions/ReviewQuestion";
import type { SessionQuestion } from "@/types/quiz";

interface SessionDetail {
  sessionId: string;
  userId: string;
  startedAt: string | null;
  completedAt: string | null;
  isComplete: boolean;
  answeredCount: number;
  totalQuestions: number;
  questions: SessionQuestion[];
}

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

export default function SessionReplayPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    setError(false);
    setDetail(null);
    fetch(`/api/quiz/session/${sessionId}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: SessionDetail) => {
        if (active) setDetail(data);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [sessionId]);

  const correctCount =
    detail?.questions.filter((q) => q.isCorrect === true).length ?? 0;
  const answered = detail?.answeredCount ?? 0;
  const percentage =
    answered > 0 ? Math.round((correctCount / answered) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/sessions"
        className="animate-fade-in inline-flex items-center gap-1.5 text-caption font-w510 text-storm-cloud transition-colors hover:text-porcelain"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to sessions
      </Link>

      {/* Error */}
      {error && (
        <div className="animate-scale-in mt-6 flex items-center gap-3 rounded-cards border border-warning-red/30 bg-warning-red/[0.07] px-4 py-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-warning-red" strokeWidth={2} />
          <p className="text-body text-light-steel">
            Couldn&apos;t load this session. Please try again.
          </p>
        </div>
      )}

      {/* Loading */}
      {!error && detail === null && (
        <div className="mt-6 space-y-4">
          <div className="shimmer h-[72px] w-full rounded-cards border border-charcoal-grey/70 bg-graphite/50" />
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="shimmer h-[180px] w-full rounded-cards border border-charcoal-grey/70 bg-graphite/50"
            />
          ))}
        </div>
      )}

      {/* Loaded */}
      {!error && detail !== null && (
        <>
          <header className="animate-fade-in-up mt-6 rounded-cards border border-charcoal-grey/70 bg-graphite/50 p-5 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-heading font-w590 text-porcelain">
                    {formatDate(detail.startedAt)}
                  </h1>
                  <Badge
                    variant={detail.isComplete ? "success" : "neutral"}
                    size="sm"
                  >
                    {detail.isComplete ? "Complete" : "In progress"}
                  </Badge>
                </div>
                <p className="mt-1 text-body text-storm-cloud">
                  {correctCount}/{answered} correct
                  <span className="text-fog-grey">
                    {" "}
                    of {detail.totalQuestions} questions
                  </span>
                </p>
              </div>
              <span
                className={`text-heading font-w590 ${
                  percentage >= 80
                    ? "text-emerald"
                    : percentage >= 50
                      ? "text-light-steel"
                      : "text-warning-red"
                }`}
              >
                {percentage}%
              </span>
            </div>
          </header>

          {/* Empty (no questions) */}
          {detail.questions.length === 0 ? (
            <div className="animate-scale-in mt-4 flex flex-col items-center justify-center rounded-cards border border-charcoal-grey/70 bg-graphite/50 px-6 py-16 text-center">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-cards border border-charcoal-grey bg-deep-slate text-storm-cloud">
                <History className="h-6 w-6" strokeWidth={2} />
              </span>
              <p className="text-option font-w510 text-porcelain">
                Nothing to review.
              </p>
              <p className="mt-1 text-body text-fog-grey">
                This session has no recorded questions.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {detail.questions.map((q, i) => (
                <ReviewQuestion
                  key={q.questionId}
                  index={i + 1}
                  sessionQuestion={q}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
