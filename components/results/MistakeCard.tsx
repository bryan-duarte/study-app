"use client";

import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { TagSelector } from "@/components/tags/TagSelector";
import type { QuizQuestion } from "@/lib/transformers/question";
import { useQuizStore } from "@/store/quizStore";

interface MistakeCardProps {
  questionIndex: number;
  question: QuizQuestion;
}

export default function MistakeCard({
  questionIndex,
  question,
}: MistakeCardProps) {
  const { confirmedAnswers } = useQuizStore();
  const selectedAnswer = confirmedAnswers.get(questionIndex);

  if (selectedAnswer === undefined) return null;

  const isMultiSelect = question.type === "multi-option";

  let selectedOptions: typeof question.options = [];
  let correctOptions: typeof question.options = [];

  if (isMultiSelect) {
    const selectedIndices = Array.isArray(selectedAnswer)
      ? selectedAnswer
      : [selectedAnswer];
    selectedOptions = selectedIndices
      .map((i) => question.options[i])
      .filter((opt) => opt !== undefined);
    correctOptions = question.options.filter((opt) => opt.isCorrect);
  } else {
    const selectedOptionIndex =
      typeof selectedAnswer === "number" ? selectedAnswer : selectedAnswer[0];
    const selectedOption = question.options[selectedOptionIndex];
    selectedOptions = selectedOption ? [selectedOption] : [];
    correctOptions = question.options.filter((opt) => opt.isCorrect);
  }

  const questionNumber = questionIndex + 1;

  return (
    <div className="rounded-cards border border-warning-red/25 bg-deep-slate/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="flex h-5 w-5 items-center justify-center rounded-badges bg-warning-red/20 text-warning-red"
          aria-hidden
        >
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </span>
        <h3 className="font-mono text-caption font-w510 uppercase tracking-wider text-storm-cloud">
          Question {questionNumber}
        </h3>
      </div>

      <div className="mb-4 text-light-steel [&_h1]:text-question [&_h2]:text-question [&_p]:text-body [&_p]:text-light-steel [&_strong]:font-w510">
        <MarkdownRenderer content={question.title} />
      </div>

      <div className="space-y-2 text-body">
        <div className="flex gap-2">
          <span className="font-w510 text-warning-red">Your answer:</span>
          <span className="text-storm-cloud">
            {selectedOptions.map((opt) => opt.description).join(", ")}
          </span>
        </div>

        {correctOptions.length > 0 && (
          <div className="flex gap-2">
            <span className="font-w510 text-emerald">Correct answer:</span>
            <span className="text-storm-cloud">
              {correctOptions.map((opt) => opt.description).join(", ")}
            </span>
          </div>
        )}
      </div>

      {correctOptions[0]?.reasoning && (
        <div className="mt-4 rounded-buttons border border-charcoal-grey/60 bg-pitch-black/60 p-3">
          <p className="mb-1 text-caption font-w510 uppercase tracking-wider text-fog-grey">
            Explanation
          </p>
          <div className="text-body text-storm-cloud">
            <MarkdownRenderer content={correctOptions[0].reasoning} />
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-charcoal-grey/60 pt-3">
        <TagSelector questionId={question.id} />
      </div>
    </div>
  );
}
