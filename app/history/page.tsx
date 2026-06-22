"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Compass, Download, Filter, X } from "lucide-react";
import HistoryCard from "@/components/history/HistoryCard";
import { Button } from "@/components/ui/Button";
import { historyToMarkdown, downloadMarkdown } from "@/lib/markdown-export";
import type { HistoryItem } from "@/types/quiz";

type Tab = "all" | "wrong";

export default function ExplorerPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async (current: Tab) => {
    setLoading(true);
    setError(false);
    try {
      const wrongOnly = current === "wrong";
      const res = await fetch(`/api/quiz/history?wrongOnly=${wrongOnly}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("history failed");
      const data = (await res.json()) as { items: HistoryItem[] };
      setItems(data.items ?? []);
    } catch {
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(tab);
    // Reset selection when switching filter — selected ids may no longer be visible.
    setSelected(new Set());
  }, [tab, load]);

  const toggleSelect = useCallback((questionId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }, []);

  const selectedCount = selected.size;
  const allSelected = items.length > 0 && selectedCount === items.length;

  const toggleSelectAll = () => {
    setSelected(allSelected ? new Set() : new Set(items.map((i) => i.questionId)));
  };

  const handleExport = () => {
    const toExport =
      selectedCount > 0
        ? items.filter((i) => selected.has(i.questionId))
        : items;
    if (toExport.length === 0) return;
    downloadMarkdown("aws-saa-study-export.md", historyToMarkdown(toExport));
  };

  const wrongCountVisible = useMemo(
    () => items.filter((i) => i.isCorrect === false).length,
    [items],
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="animate-fade-in-up flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-cards border border-charcoal-grey bg-deep-slate text-neon-lime">
            <Compass className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-heading font-w590 text-porcelain">Explorer</h1>
            <p className="text-body text-storm-cloud">
              Browse and export everything you&apos;ve answered.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleExport}
          disabled={loading || items.length === 0}
          className="flex-shrink-0"
        >
          <Download className="h-4 w-4" strokeWidth={2} />
          {selectedCount > 0 ? `Export .md (${selectedCount})` : "Export .md"}
        </Button>
      </div>

      {/* Filter toggle + counts */}
      <div className="animate-fade-in-up mt-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-0.5 rounded-buttons border border-charcoal-grey/70 bg-graphite/60 p-0.5">
          <FilterButton
            active={tab === "all"}
            onClick={() => setTab("all")}
            icon={Filter}
            label="All"
          />
          <FilterButton
            active={tab === "wrong"}
            onClick={() => setTab("wrong")}
            icon={X}
            label="Wrong only"
          />
        </div>

        {!loading && !error && (
          <p className="text-caption text-fog-grey">
            {items.length} question{items.length === 1 ? "" : "s"}
            {tab === "all" && wrongCountVisible > 0 && (
              <>
                {" · "}
                <span className="text-warning-red">
                  {wrongCountVisible} wrong
                </span>
              </>
            )}
          </p>
        )}

        {!loading && !error && items.length > 0 && (
          <button
            type="button"
            onClick={toggleSelectAll}
            className="ml-auto text-caption font-w510 text-storm-cloud transition-colors hover:text-neon-lime"
          >
            {allSelected ? "Clear selection" : "Select all"}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="mt-5">
        {loading ? (
          <SkeletonList />
        ) : error ? (
          <ErrorState onRetry={() => load(tab)} />
        ) : items.length === 0 ? (
          <EmptyState wrongOnly={tab === "wrong"} />
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <HistoryCard
                key={item.questionId}
                item={item}
                index={i}
                selected={selected.has(item.questionId)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Filter;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-tags px-3 py-1.5 text-caption font-w510 transition-colors sm:text-body ${
        active
          ? "bg-deep-slate text-porcelain"
          : "text-storm-cloud hover:text-porcelain"
      }`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      {label}
    </button>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="shimmer rounded-cards border border-charcoal-grey/70 bg-graphite/50 p-4"
        >
          <div className="flex gap-2">
            <div className="h-4 w-20 rounded-badges bg-deep-slate" />
            <div className="h-4 w-28 rounded-badges bg-deep-slate" />
          </div>
          <div className="mt-3 h-4 w-full rounded bg-deep-slate" />
          <div className="mt-2 h-4 w-3/4 rounded bg-deep-slate" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ wrongOnly }: { wrongOnly: boolean }) {
  return (
    <div className="animate-scale-in flex flex-col items-center justify-center rounded-cards border border-dashed border-charcoal-grey/70 bg-graphite/40 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-cards border border-charcoal-grey bg-deep-slate text-fog-grey">
        <Compass className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <p className="mt-4 text-option font-w510 text-porcelain">
        {wrongOnly ? "No wrong answers" : "No answers yet"}
      </p>
      <p className="mt-1 max-w-sm text-body text-storm-cloud">
        {wrongOnly
          ? "Everything you've answered so far is correct. Switch to All to browse them."
          : "No answers yet — take a quiz to start your history."}
      </p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="animate-scale-in flex flex-col items-center justify-center rounded-cards border border-warning-red/30 bg-warning-red/[0.06] px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-cards border border-warning-red/30 bg-warning-red/10 text-warning-red">
        <X className="h-6 w-6" strokeWidth={2} />
      </span>
      <p className="mt-4 text-option font-w510 text-porcelain">
        Couldn&apos;t load your history
      </p>
      <p className="mt-1 max-w-sm text-body text-storm-cloud">
        Something went wrong fetching your answers. Try again.
      </p>
      <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
        Retry
      </Button>
    </div>
  );
}
