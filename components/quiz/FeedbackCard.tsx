"use client";

import { useQuizStore } from "@/store/quizStore";

interface Option {
  description: string;
  is_correct: boolean;
  reasoning: string;
}

interface Question {
  title: string;
  options: Option[];
}

interface FeedbackCardProps {
  question: Question;
}

export default function FeedbackCard({ question }: FeedbackCardProps) {
  const currentSelectedOption = useQuizStore((state) => {
    const currentIndex = state.currentIndex;
    return state.answers.get(currentIndex);
  });
  const nextQuestion = useQuizStore((state) => state.nextQuestion);
  const previousQuestion = useQuizStore((state) => state.previousQuestion);
  const currentIndex = useQuizStore((state) => state.currentIndex);
  const totalQuestions = useQuizStore((state) => state.totalQuestions);

  const hasValidSelection = currentSelectedOption !== null && currentSelectedOption !== undefined && currentSelectedOption >= 0;
  const selectedOption = hasValidSelection ? (question.options[currentSelectedOption] ?? null) : null;
  const isCorrect = selectedOption?.is_correct ?? false;
  const hasNextQuestion = currentIndex < totalQuestions - 1;
  const hasPreviousQuestion = currentIndex > 0;

  const feedbackTitle = isCorrect ? "Correct!" : "Incorrect";
  const feedbackColor = isCorrect ? "emerald" : "warning-red";

  return (
    <div
      className={`border-l-4 border-${feedbackColor} bg-deep-slate p-6 rounded-cards shadow-subtle`}
      role="region"
      aria-label="Answer feedback"
    >
      <h3
        className={`font-w590 mb-3 text-${feedbackColor} text-body`}
      >
        {feedbackTitle}
      </h3>

      {selectedOption?.reasoning && (
        <div className="prose prose-invert prose-sm max-w-none">
          <p className="text-light-steel whitespace-pre-wrap">
            {selectedOption.reasoning}
          </p>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        {hasPreviousQuestion && (
          <button
            onClick={previousQuestion}
            className="px-4 py-2 bg-gunmetal hover:bg-muted-ash text-porcelain rounded-buttons transition-colors focus:outline-none focus:ring-2 focus:ring-storm-cloud focus:ring-offset-2 focus:ring-offset-pitch-black"
            aria-label="Previous question"
          >
            Previous
          </button>
        )}

        {hasNextQuestion && (
          <button
            onClick={nextQuestion}
            className="px-4 py-2 bg-neon-lime hover:opacity-90 text-pitch-black font-w590 rounded-buttons transition-opacity focus:outline-none focus:ring-2 focus:ring-neon-lime focus:ring-offset-2 focus:ring-offset-pitch-black ml-auto"
            aria-label="Next question"
          >
            Next Question
          </button>
        )}
      </div>
    </div>
  );
}
