"use client";

import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
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
    <div className="bg-deep-slate border border-warning-red/30 rounded-cards p-4 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-warning-red">✗</span>
        <h3 className="font-w510 text-porcelain">Question {questionNumber}</h3>
      </div>

      <div className="text-light-steel mb-4 [&_h1]:text-question [&_h2]:text-question [&_p]:text-body [&_p]:text-light-steel [&_strong]:font-w510">
        <MarkdownRenderer content={question.title} />
      </div>

      <div className="space-y-2 text-body">
        <div className="flex gap-2">
          <span className="text-warning-red font-w510">Your answer:</span>
          <span className="text-storm-cloud">
            {selectedOptions.map((opt) => opt.description).join(", ")}
          </span>
        </div>

        {correctOptions.length > 0 && (
          <div className="flex gap-2">
            <span className="text-emerald font-w510">Correct answer:</span>
            <span className="text-storm-cloud">
              {correctOptions.map((opt) => opt.description).join(", ")}
            </span>
          </div>
        )}
      </div>

      {correctOptions[0]?.reasoning && (
        <div className="mt-4 p-3 bg-pitch-black rounded-buttons">
          <p className="text-caption text-fog-grey mb-1">Explanation:</p>
          <div className="text-body text-storm-cloud">
            <MarkdownRenderer content={correctOptions[0].reasoning} />
          </div>
        </div>
      )}
    </div>
  );
}
