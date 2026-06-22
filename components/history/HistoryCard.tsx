"use client";

import { useState } from "react";
import { Check, ChevronDown, CircleCheck, CircleX } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { TagSelector } from "@/components/tags/TagSelector";
import { DOMAIN_LABELS } from "@/lib/categories";
import type { HistoryItem, Tag } from "@/types/quiz";

interface HistoryCardProps {
  item: HistoryItem;
  index: number;
  selected: boolean;
  onToggleSelect: (questionId: string) => void;
  /** The user's full tag list, shared page-level (avoids per-card requests). */
  availableTags?: Tag[];
  /** Notify parent to refetch after a tag mutation (refresh counts + items). */
  onTagsMutated?: () => void;
}

function domainLabel(domain: string | null): string | null {
  if (!domain) return null;
  return (DOMAIN_LABELS as Record<string, string>)[domain] ?? domain;
}

/** One answered question: meta badges, a correctness pill, markdown title, and a details expander. */
export default function HistoryCard({
  item,
  index,
  selected,
  onToggleSelect,
  availableTags,
  onTagsMutated,
}: HistoryCardProps) {
  const [open, setOpen] = useState(false);

  const correctOptions = item.options.filter((o) => o.isCorrect);
  const selectedOption =
    item.options.find((o) => o.id === item.selectedOptionId) ?? null;
  const reasoning = correctOptions[0]?.reasoning?.trim() ?? "";
  const dLabel = domainLabel(item.domain);

  return (
    <Card
      padding="md"
      className="animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
    >
      {/* Top row: checkbox + meta badges + correctness pill */}
      <div className="flex items-start gap-3">
        <label className="mt-0.5 flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(item.questionId)}
            className="peer sr-only"
            aria-label="Select question for export"
          />
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-badges border border-charcoal-grey bg-deep-slate text-pitch-black transition-colors peer-checked:border-neon-lime peer-checked:bg-neon-lime peer-focus-visible:ring-2 peer-focus-visible:ring-storm-cloud">
            {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </span>
        </label>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {dLabel && (
              <Badge variant="info" size="sm">
                {dLabel}
              </Badge>
            )}
            {item.topic && (
              <Badge variant="neutral" size="sm">
                {item.topic}
              </Badge>
            )}
            {item.difficulty && (
              <Badge variant="neutral" size="sm">
                {item.difficulty}
              </Badge>
            )}
            {item.tags?.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center rounded-pill border border-neon-lime/40 bg-neon-lime/10 px-2 py-0.5 text-caption text-neon-lime"
              >
                {t.name}
              </span>
            ))}
            <span className="flex-1" />
            {item.isCorrect === true ? (
              <span className="inline-flex items-center gap-1 rounded-pill bg-forest-green/20 px-2 py-0.5 text-caption font-w510 text-emerald">
                <CircleCheck className="h-3.5 w-3.5" strokeWidth={2.25} />
                Correct
              </span>
            ) : item.isCorrect === false ? (
              <span className="inline-flex items-center gap-1 rounded-pill bg-warning-red/20 px-2 py-0.5 text-caption font-w510 text-warning-red">
                <CircleX className="h-3.5 w-3.5" strokeWidth={2.25} />
                Incorrect
              </span>
            ) : null}
          </div>

          {/* Question title (markdown) */}
          <div className="mt-2">
            <MarkdownRenderer content={item.title.trim()} />
          </div>

          {/* Details expander */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-2 inline-flex items-center gap-1 text-caption font-w510 text-storm-cloud transition-colors hover:text-neon-lime"
          >
            {open ? "Hide details" : "Show details"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
          </button>

          {open && (
            <div className="animate-slide-down mt-3 space-y-3 rounded-cards border border-charcoal-grey/60 bg-pitch-black/40 p-3">
              <div>
                <p className="text-caption font-w510 uppercase tracking-[0.12em] text-fog-grey">
                  Correct answer{correctOptions.length > 1 ? "s" : ""}
                </p>
                <ul className="mt-1 space-y-1">
                  {correctOptions.length > 0 ? (
                    correctOptions.map((o) => (
                      <li
                        key={o.id}
                        className="flex items-start gap-2 text-body text-emerald"
                      >
                        <CircleCheck
                          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
                          strokeWidth={2.25}
                        />
                        <span>{o.description}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-body text-fog-grey">Not available.</li>
                  )}
                </ul>
              </div>

              <div>
                <p className="text-caption font-w510 uppercase tracking-[0.12em] text-fog-grey">
                  Your answer
                </p>
                <p
                  className={`mt-1 flex items-start gap-2 text-body ${
                    item.isCorrect === false
                      ? "text-warning-red"
                      : "text-light-steel"
                  }`}
                >
                  {selectedOption ? (
                    <>
                      {item.isCorrect ? (
                        <CircleCheck
                          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald"
                          strokeWidth={2.25}
                        />
                      ) : (
                        <CircleX
                          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-warning-red"
                          strokeWidth={2.25}
                        />
                      )}
                      <span>{selectedOption.description}</span>
                    </>
                  ) : (
                    <span className="text-fog-grey">Not recorded.</span>
                  )}
                </p>
              </div>

              {reasoning && (
                <div>
                  <p className="text-caption font-w510 uppercase tracking-[0.12em] text-fog-grey">
                    Reasoning
                  </p>
                  <div className="mt-1">
                    <MarkdownRenderer content={reasoning} />
                  </div>
                </div>
              )}

              {item.timesAnswered > 0 && (
                <p className="text-caption text-fog-grey">
                  Answered {item.timesAnswered} time
                  {item.timesAnswered === 1 ? "" : "s"}
                </p>
              )}

              <div>
                <p className="text-caption font-w510 uppercase tracking-[0.12em] text-fog-grey">
                  Tags
                </p>
                <div className="mt-1">
                  <TagSelector
                    questionId={item.questionId}
                    currentTags={item.tags}
                    availableTags={availableTags}
                    onMutated={onTagsMutated}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
