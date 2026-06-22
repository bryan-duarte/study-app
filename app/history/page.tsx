"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Compass, Download, Filter, X, Plus, Tag } from "lucide-react";
import HistoryCard from "@/components/history/HistoryCard";
import { Button } from "@/components/ui/Button";
import {
  historyToMarkdown,
  downloadMarkdown,
  type MarkdownExportOptions,
} from "@/lib/markdown-export";
import { useTags } from "@/lib/client/useTags";
import { fetchWithTimeout } from "@/lib/fetch";
import { toSlug } from "@/lib/tags";
import type { HistoryItem } from "@/types/quiz";

type Tab = "all" | "wrong";
type TagMode = "and" | "or";

/**
 * Explorer is a client component that reads the `tags`/`mode` search params
 * (deep-linked from the Tags page). useSearchParams requires a Suspense
 * boundary, so the default export wraps the page in one.
 */
export default function Page() {
  return (
    <Suspense fallback={<SkeletonList />}>
      <ExplorerPage />
    </Suspense>
  );
}

function ExplorerPage() {
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [selectedTags, setSelectedTags] = useState<Set<string>>(() => {
    const slugs = (searchParams?.get("tags") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return new Set(slugs);
  });
  const [tagMode, setTagMode] = useState<TagMode>(
    searchParams?.get("mode") === "and" ? "and" : "or",
  );

  const [exportOpts, setExportOpts] = useState<MarkdownExportOptions>({
    allOptions: true,
    correctAnswer: true,
    explanation: true,
  });

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkQuery, setBulkQuery] = useState("");
  const [bulkError, setBulkError] = useState(false);

  const { tags, reload: reloadTags } = useTags();

  const load = useCallback(
    async (currentTab: Tab, tagSlugs: string[], mode: TagMode) => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams();
        params.set("wrongOnly", currentTab === "wrong" ? "true" : "false");
        if (tagSlugs.length > 0) {
          params.set("tags", tagSlugs.join(","));
          params.set("tagMode", mode);
        }
        const res = await fetch(`/api/quiz/history?${params.toString()}`, {
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
    },
    [],
  );

  useEffect(() => {
    void load(tab, [...selectedTags], tagMode);
    // Reset selection when the visible set changes (filter/tab/tag switch).
    setSelected(new Set());
  }, [tab, selectedTags, tagMode, load]);

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

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const handleExport = () => {
    const toExport =
      selectedCount > 0
        ? items.filter((i) => selected.has(i.questionId))
        : items;
    if (toExport.length === 0) return;
    downloadMarkdown("aws-saa-study-export.md", historyToMarkdown(toExport, exportOpts));
  };

  const onTagsMutated = useCallback(async () => {
    await reloadTags();
    await load(tab, [...selectedTags], tagMode);
  }, [reloadTags, load, tab, selectedTags, tagMode]);

  const bulkAssign = async (tagId?: string, name?: string) => {
    const questionIds = [...selected];
    if (questionIds.length === 0 || (!tagId && !name)) return;
    setBulkError(false);
    try {
      const res = await fetchWithTimeout("/api/questions/tags/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds, tagId, name }),
      });
      if (!res.ok) throw new Error("bulk failed");
      setBulkOpen(false);
      setBulkQuery("");
      setSelected(new Set());
      await reloadTags();
      await load(tab, [...selectedTags], tagMode);
    } catch {
      setBulkError(true);
    }
  };

  const bulkQuerySlug = toSlug(bulkQuery);
  const bulkCreateNew =
    bulkQuery.trim().length > 0 && !tags.some((t) => t.slug === bulkQuerySlug);

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
              Browse, tag, and export everything you&apos;ve answered.
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

      {/* Tag filter bar */}
      {tags.length > 0 && (
        <div className="animate-fade-in-up mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1 text-caption font-w510 text-fog-grey">
            <Tag className="h-3.5 w-3.5" strokeWidth={2} />
            Tags
          </span>
          {tags.map((t) => (
            <Chip
              key={t.id}
              label={t.name}
              selected={selectedTags.has(t.slug)}
              onClick={() => toggleTag(t.slug)}
            />
          ))}
          {selectedTags.size >= 2 && (
            <div className="ml-1 inline-flex items-center gap-0.5 rounded-buttons border border-charcoal-grey/70 bg-graphite/60 p-0.5">
              <FilterButton
                active={tagMode === "or"}
                onClick={() => setTagMode("or")}
                icon={undefined}
                label="Any"
              />
              <FilterButton
                active={tagMode === "and"}
                onClick={() => setTagMode("and")}
                icon={undefined}
                label="All"
              />
            </div>
          )}
        </div>
      )}

      {/* Export options */}
      {!loading && !error && items.length > 0 && (
        <div className="animate-fade-in-up mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-caption font-w510 text-fog-grey">
            Export includes:
          </span>
          <Chip
            label="All options"
            selected={exportOpts.allOptions !== false}
            onClick={() =>
              setExportOpts((p) => ({ ...p, allOptions: !(p.allOptions !== false) }))
            }
          />
          <Chip
            label="Correct answer"
            selected={exportOpts.correctAnswer !== false}
            onClick={() =>
              setExportOpts((p) => ({
                ...p,
                correctAnswer: !(p.correctAnswer !== false),
              }))
            }
          />
          <Chip
            label="Explanation"
            selected={exportOpts.explanation !== false}
            onClick={() =>
              setExportOpts((p) => ({
                ...p,
                explanation: !(p.explanation !== false),
              }))
            }
          />
        </div>
      )}

      {/* Bulk tag bar */}
      {!loading && !error && selectedCount > 0 && (
        <div className="animate-slide-down mt-3 rounded-cards border border-charcoal-grey/70 bg-graphite/60 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-caption font-w510 text-porcelain">
              Apply a tag to {selectedCount} selected question
              {selectedCount === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              onClick={() => setBulkOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-pill border border-charcoal-grey bg-deep-slate/60 px-2.5 py-1 text-caption text-storm-cloud transition-colors hover:border-neon-lime/50 hover:text-neon-lime"
            >
              <Plus className="h-3 w-3" strokeWidth={2.5} />
              Choose tag
            </button>
          </div>

          {bulkOpen && (
            <div className="mt-2.5 flex flex-col gap-2.5">
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => void bulkAssign(t.id)}
                      className="inline-flex items-center gap-1.5 rounded-pill border border-charcoal-grey bg-deep-slate/60 px-2.5 py-1 text-caption text-storm-cloud transition-colors hover:border-neon-lime/50 hover:bg-neon-lime/15 hover:text-neon-lime"
                    >
                      <Plus className="h-3 w-3" strokeWidth={2.5} />
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={bulkQuery}
                  onChange={(e) => setBulkQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && bulkCreateNew) {
                      e.preventDefault();
                      void bulkAssign(undefined, bulkQuery.trim());
                    }
                  }}
                  placeholder="New tag…"
                  className="min-w-0 flex-1 rounded-badges border border-charcoal-grey bg-deep-slate/60 px-2.5 py-1.5 text-caption text-porcelain placeholder:text-fog-grey focus:border-neon-lime/50 focus:outline-none"
                />
                {bulkCreateNew && (
                  <button
                    type="button"
                    onClick={() => void bulkAssign(undefined, bulkQuery.trim())}
                    className="inline-flex items-center gap-1 rounded-badges border border-neon-lime/50 bg-neon-lime/15 px-2.5 py-1.5 text-caption text-neon-lime transition-colors hover:bg-neon-lime/25"
                  >
                    <Plus className="h-3 w-3" strokeWidth={2.5} />
                    Create
                  </button>
                )}
              </div>
              {bulkError && (
                <p className="text-caption text-warning-red">
                  Couldn&apos;t apply the tag. Try again.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="mt-5">
        {loading ? (
          <SkeletonList />
        ) : error ? (
          <ErrorState onRetry={() => load(tab, [...selectedTags], tagMode)} />
        ) : items.length === 0 ? (
          <EmptyState wrongOnly={tab === "wrong"} hasTagFilter={selectedTags.size > 0} />
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <HistoryCard
                key={item.questionId}
                item={item}
                index={i}
                selected={selected.has(item.questionId)}
                onToggleSelect={toggleSelect}
                availableTags={tags}
                onTagsMutated={() => void onTagsMutated()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-caption transition-colors ${
        selected
          ? "border-neon-lime/50 bg-neon-lime/15 text-neon-lime"
          : "border-charcoal-grey bg-deep-slate/60 text-storm-cloud hover:border-muted-ash hover:text-porcelain"
      }`}
    >
      {selected && <span className="text-neon-lime">✓</span>}
      {label}
    </button>
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
  icon?: typeof Filter;
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
      {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={2} />}
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

function EmptyState({
  wrongOnly,
  hasTagFilter,
}: {
  wrongOnly: boolean;
  hasTagFilter: boolean;
}) {
  return (
    <div className="animate-scale-in flex flex-col items-center justify-center rounded-cards border border-dashed border-charcoal-grey/70 bg-graphite/40 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-cards border border-charcoal-grey bg-deep-slate text-fog-grey">
        <Compass className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <p className="mt-4 text-option font-w510 text-porcelain">
        {hasTagFilter
          ? "No questions match"
          : wrongOnly
            ? "No wrong answers"
            : "No answers yet"}
      </p>
      <p className="mt-1 max-w-sm text-body text-storm-cloud">
        {hasTagFilter
          ? "No answered questions carry the selected tag(s). Adjust the tag filter to see more."
          : wrongOnly
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
