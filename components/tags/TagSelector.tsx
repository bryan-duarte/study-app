"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch";
import { toSlug } from "@/lib/tags";
import type { Tag } from "@/types/quiz";

interface TagSelectorProps {
  /** Question to tag. Every review surface already has this id. */
  questionId: string;
  /** Tags already on the question. If omitted, the component fetches them (e.g. quiz/results). Pass `item.tags` to skip the per-card GET (Explorer). */
  currentTags?: Tag[];
  /** The user's full tag list for the add-menu. If omitted, the component fetches it. Pass a page-level `useTags()` list to avoid per-card requests (Explorer). */
  availableTags?: Tag[];
  /** Notify the parent to refetch (e.g. Explorer counts/filter). */
  onMutated?: () => void;
}

/**
 * Shared tag control for every review surface (FeedbackCard, MistakeCard,
 * HistoryCard, ReviewQuestion). Shows a question's tags as removable chips
 * plus an inline "+ Tag" panel that lists existing tags to add and a free-text
 * input to create-and-assign a new one. Single Neon Lime accent — no per-tag
 * colors, no modal/dialog (inline panel only).
 */
export function TagSelector({
  questionId,
  currentTags,
  availableTags,
  onMutated,
}: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>(currentTags ?? []);
  const [allTags, setAllTags] = useState<Tag[]>(availableTags ?? []);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync controlled props when the parent refetches (Explorer reload).
  useEffect(() => {
    if (currentTags) setTags(currentTags);
  }, [currentTags]);
  useEffect(() => {
    if (availableTags) setAllTags(availableTags);
  }, [availableTags]);

  // Self-fetch current tags when not supplied by the parent.
  useEffect(() => {
    if (currentTags) return;
    let active = true;
    fetch(`/api/questions/${questionId}/tags`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { tags?: Tag[] }) => {
        if (active) setTags(d.tags ?? []);
      })
      .catch(() => {
        if (active) setTags([]);
      });
    return () => {
      active = false;
    };
  }, [questionId, currentTags]);

  // Self-fetch the user's tag list when not supplied by the parent.
  useEffect(() => {
    if (availableTags) return;
    let active = true;
    fetch("/api/tags", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { tags?: Tag[] }) => {
        if (active) setAllTags(d.tags ?? []);
      })
      .catch(() => {
        if (active) setAllTags([]);
      });
    return () => {
      active = false;
    };
  }, [availableTags]);

  const assignedIds = new Set(tags.map((t) => t.id));
  const querySlug = toSlug(query);
  const createNew = query.trim().length > 0 && !allTags.some((t) => t.slug === querySlug);

  // Available = user's tags not yet on this question, filtered by the typed query.
  const candidates = allTags
    .filter((t) => !assignedIds.has(t.id))
    .filter((t) => (query.trim() ? t.name.toLowerCase().includes(query.trim().toLowerCase()) : true));

  async function assign(existing?: Tag) {
    setError(null);
    setBusy(true);
    try {
      const body = existing ? { tagId: existing.id } : { name: query.trim() };
      const res = await fetchWithTimeout(
        `/api/questions/${questionId}/tags`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) throw new Error("assign failed");
      const data = (await res.json()) as { tags?: Tag[] };
      const next = data.tags ?? [];
      setTags(next);
      // Merge any newly created tag into the local list so it's pickable elsewhere.
      const fresh = next.filter((t) => !allTags.some((a) => a.id === t.id));
      if (fresh.length) setAllTags((prev) => [...prev, ...fresh]);
      setQuery("");
      onMutated?.();
    } catch {
      setError("Couldn't add tag");
    } finally {
      setBusy(false);
    }
  }

  async function remove(tag: Tag) {
    setError(null);
    setBusy(true);
    const prev = tags;
    setTags((cur) => cur.filter((t) => t.id !== tag.id)); // optimistic
    try {
      const res = await fetchWithTimeout(
        `/api/questions/${questionId}/tags/${tag.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("remove failed");
      onMutated?.();
    } catch {
      setTags(prev); // revert
      setError("Couldn't remove tag");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => void remove(t)}
            disabled={busy}
            aria-label={`Remove tag ${t.name}`}
            className="inline-flex items-center gap-1 rounded-pill border border-neon-lime/40 bg-neon-lime/15 px-2.5 py-1 text-caption text-neon-lime transition-colors hover:border-neon-lime/70 hover:bg-neon-lime/25 disabled:opacity-50"
          >
            {t.name}
            <X className="h-3 w-3" strokeWidth={2.5} />
          </button>
        ))}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1 rounded-pill border border-charcoal-grey bg-deep-slate/60 px-2.5 py-1 text-caption text-storm-cloud transition-colors hover:border-muted-ash hover:text-porcelain"
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
          Tag
        </button>
      </div>

      {open && (
        <div className="animate-slide-down flex flex-col gap-2.5 rounded-cards border border-charcoal-grey/70 bg-graphite/60 p-3">
          {candidates.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {candidates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={busy}
                  onClick={() => void assign(t)}
                  className="inline-flex items-center gap-1.5 rounded-pill border border-charcoal-grey bg-deep-slate/60 px-2.5 py-1 text-caption text-storm-cloud transition-colors hover:border-neon-lime/50 hover:bg-neon-lime/15 hover:text-neon-lime disabled:opacity-50"
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && createNew) {
                  e.preventDefault();
                  void assign();
                }
              }}
              placeholder="New tag…"
              className="min-w-0 flex-1 rounded-badges border border-charcoal-grey bg-deep-slate/60 px-2.5 py-1.5 text-caption text-porcelain placeholder:text-fog-grey focus:border-neon-lime/50 focus:outline-none"
            />
            {createNew && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void assign()}
                className="inline-flex items-center gap-1 rounded-badges border border-neon-lime/50 bg-neon-lime/15 px-2.5 py-1.5 text-caption text-neon-lime transition-colors hover:bg-neon-lime/25 disabled:opacity-50"
              >
                <Plus className="h-3 w-3" strokeWidth={2.5} />
                Create
              </button>
            )}
          </div>

          {error && <p className="text-caption text-warning-red">{error}</p>}
        </div>
      )}
    </div>
  );
}
