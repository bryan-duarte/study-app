"use client";

import { useState } from "react";
import Link from "next/link";
import { Tag as TagIcon, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTags } from "@/lib/client/useTags";
import { fetchWithTimeout } from "@/lib/fetch";
import type { TagWithCount } from "@/types/quiz";

/**
 * Tag management: list tags with question counts, rename inline, delete
 * (two-step confirm), and click a tag to filter the Explorer by it.
 *
 * Tag creation happens inline while reviewing questions (TagSelector); this
 * page is for organizing and pruning.
 */
export default function TagsPage() {
  const { tags, loading, error, reload } = useTags();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function startEdit(t: TagWithCount) {
    setActionError(null);
    setEditingId(t.id);
    setEditValue(t.name);
  }

  async function saveEdit(id: string) {
    const name = editValue.trim();
    if (!name) return;
    try {
      const res = await fetchWithTimeout(`/api/tags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("rename failed");
      setEditingId(null);
      await reload();
    } catch {
      setActionError("Couldn't rename tag");
    }
  }

  async function deleteTag(id: string) {
    try {
      const res = await fetchWithTimeout(`/api/tags/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete failed");
      setConfirmDeleteId(null);
      await reload();
    } catch {
      setActionError("Couldn't delete tag");
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="animate-fade-in-up flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-cards border border-charcoal-grey bg-deep-slate text-neon-lime">
          <TagIcon className="h-5 w-5" strokeWidth={2} />
        </span>
        <div>
          <h1 className="text-heading font-w590 text-porcelain">Tags</h1>
          <p className="text-body text-storm-cloud">
            Organize the tags you create while reviewing questions.
          </p>
        </div>
      </div>

      {actionError && (
        <p className="mt-4 text-caption text-warning-red">{actionError}</p>
      )}

      {/* Body */}
      <div className="mt-5">
        {loading ? (
          <SkeletonList />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : tags.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {tags.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center gap-2 rounded-cards border border-charcoal-grey/70 bg-graphite/50 p-3"
              >
                {editingId === t.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void saveEdit(t.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="min-w-0 flex-1 rounded-badges border border-neon-lime/50 bg-deep-slate/60 px-2.5 py-1.5 text-body text-porcelain focus:outline-none"
                  />
                ) : (
                  <Link
                    href={`/history?tags=${encodeURIComponent(t.slug)}`}
                    className="inline-flex items-center gap-1.5 rounded-pill border border-neon-lime/40 bg-neon-lime/10 px-2.5 py-1 text-body text-neon-lime transition-colors hover:bg-neon-lime/20"
                  >
                    {t.name}
                  </Link>
                )}

                <span className="text-caption text-fog-grey">
                  {t.questionCount} question{t.questionCount === 1 ? "" : "s"}
                </span>

                <div className="ml-auto flex items-center gap-1">
                  {editingId === t.id ? (
                    <>
                      <IconBtn
                        label="Save rename"
                        onClick={() => void saveEdit(t.id)}
                        tone="lime"
                      >
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      </IconBtn>
                      <IconBtn
                        label="Cancel rename"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4" strokeWidth={2.5} />
                      </IconBtn>
                    </>
                  ) : confirmDeleteId === t.id ? (
                    <>
                      <span className="text-caption text-warning-red">Delete?</span>
                      <IconBtn
                        label="Confirm delete"
                        onClick={() => void deleteTag(t.id)}
                        tone="red"
                      >
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      </IconBtn>
                      <IconBtn
                        label="Cancel delete"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        <X className="h-4 w-4" strokeWidth={2.5} />
                      </IconBtn>
                    </>
                  ) : (
                    <>
                      <IconBtn label={`Rename ${t.name}`} onClick={() => startEdit(t)}>
                        <Pencil className="h-4 w-4" strokeWidth={2} />
                      </IconBtn>
                      <IconBtn
                        label={`Delete ${t.name}`}
                        onClick={() => {
                          setActionError(null);
                          setConfirmDeleteId(t.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </IconBtn>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "default" | "lime" | "red";
}) {
  const toneClass =
    tone === "lime"
      ? "text-neon-lime hover:bg-neon-lime/15"
      : tone === "red"
        ? "text-warning-red hover:bg-warning-red/15"
        : "text-storm-cloud hover:bg-deep-slate hover:text-porcelain";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-badges transition-colors ${toneClass}`}
    >
      {children}
    </button>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="shimmer h-12 rounded-cards border border-charcoal-grey/70 bg-graphite/50"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="animate-scale-in flex flex-col items-center justify-center rounded-cards border border-dashed border-charcoal-grey/70 bg-graphite/40 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-cards border border-charcoal-grey bg-deep-slate text-fog-grey">
        <TagIcon className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <p className="mt-4 text-option font-w510 text-porcelain">No tags yet</p>
      <p className="mt-1 max-w-sm text-body text-storm-cloud">
        Create tags while you review questions (quiz feedback, results, or the
        Explorer). They&apos;ll show up here to rename, delete, or filter by.
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
        Couldn&apos;t load your tags
      </p>
      <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
        Retry
      </Button>
    </div>
  );
}
