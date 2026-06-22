"use client";

import { useState } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { TagSelector } from "@/components/tags/TagSelector";
import type { SessionQuestion } from "@/types/quiz";

interface ReviewQuestionProps {
  /** 1-based position used for the question label. */
  index: number;
  sessionQuestion: SessionQuestion;
}

/**
 * Read-only replay of a single answered question.
 * Mirrors the quiz feedback visual language (OptionItem / FeedbackCard):
 *   - correct option  -> forest-green border + check
 *   - wrong selection  -> warning-red border + X
 *   - reasoning lives inside a per-option collapsible.
 */
export default function ReviewQuestion({
  index,
  sessionQuestion,
}: ReviewQuestionProps) {
  const { question, selectedOptionId, isCorrect } = sessionQuestion;
  const answered = selectedOptionId != null;

  return (
    <div className="animate-fade-in-up rounded-cards border border-charcoal-grey/70 bg-graphite/50 p-5 backdrop-blur-sm">
      {/* Question header */}
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-6 min-w-6 flex-shrink-0 items-center justify-center rounded-badges bg-deep-slate px-1.5 font-mono text-caption font-w590 text-storm-cloud">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <MarkdownRenderer content={question.title} />
        </div>
        <span
          className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
            !answered
              ? "bg-gunmetal text-storm-cloud"
              : isCorrect
                ? "bg-emerald/20 text-emerald"
                : "bg-warning-red/20 text-warning-red"
          }`}
          aria-label={
            !answered ? "Not answered" : isCorrect ? "Correct" : "Incorrect"
          }
        >
          {!answered ? (
            <span className="text-caption font-w590">—</span>
          ) : isCorrect ? (
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          ) : (
            <X className="h-3.5 w-3.5" strokeWidth={3} />
          )}
        </span>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {question.options.map((opt, i) => (
          <ReviewOption
            key={opt.id}
            index={i}
            description={opt.description}
            reasoning={opt.reasoning}
            isCorrect={opt.isCorrect}
            isSelected={opt.id === selectedOptionId}
          />
        ))}
      </div>

      <div className="mt-4 border-t border-charcoal-grey/60 pt-3">
        <TagSelector questionId={question.id} />
      </div>
    </div>
  );
}

function ReviewOption({
  index,
  description,
  reasoning,
  isCorrect,
  isSelected,
}: {
  index: number;
  description: string;
  reasoning: string;
  isCorrect: boolean;
  isSelected: boolean;
}) {
  const [open, setOpen] = useState(false);
  const optionLabel = String.fromCharCode(65 + index);

  const wrongSelection = isSelected && !isCorrect;

  const containerClasses = isCorrect
    ? "border-forest-green bg-forest-green/[0.12]"
    : wrongSelection
      ? "border-warning-red bg-warning-red/[0.12]"
      : "border-charcoal-grey bg-deep-slate/60";

  const labelClasses = isCorrect
    ? "bg-forest-green text-pitch-black"
    : wrongSelection
      ? "bg-warning-red text-pitch-black"
      : "bg-gunmetal text-storm-cloud";

  const textClasses = isCorrect
    ? "font-medium text-forest-green"
    : wrongSelection
      ? "text-warning-red"
      : "text-porcelain";

  return (
    <div className={`rounded-cards border ${containerClasses}`}>
      <div className="flex items-start gap-3 p-4">
        <span
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-badges font-mono text-xs font-semibold ${labelClasses}`}
        >
          {optionLabel}
        </span>

        <div className="min-w-0 flex-1">
          <p className={`text-option ${textClasses}`}>{description}</p>
          {isSelected && (
            <span className="mt-1 inline-block text-caption font-w510 text-storm-cloud">
              Your answer
            </span>
          )}
        </div>

        {isCorrect ? (
          <div
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-forest-green"
            aria-label="Correct answer"
          >
            <Check className="h-4 w-4 text-pitch-black" strokeWidth={3} />
          </div>
        ) : wrongSelection ? (
          <div
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-warning-red"
            aria-label="Incorrect answer"
          >
            <X className="h-4 w-4 text-pitch-black" strokeWidth={3} />
          </div>
        ) : null}
      </div>

      {/* Reasoning collapsible */}
      {reasoning ? (
        <div className="border-t border-charcoal-grey/60 px-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex w-full items-center gap-1.5 py-2.5 text-left text-caption font-w510 text-storm-cloud transition-colors hover:text-porcelain"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
            {open ? "Hide reasoning" : "Show reasoning"}
          </button>
          {open && (
            <div className="animate-slide-down pb-3 text-light-steel">
              <MarkdownRenderer content={reasoning} />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
