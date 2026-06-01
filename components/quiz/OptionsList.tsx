"use client";

import { useQuizStore } from "@/store/quizStore";
import OptionItem from "./OptionItem";

interface Option {
  description: string;
  is_correct: boolean;
  reasoning: string;
}

interface OptionsListProps {
  options: Option[];
}

export default function OptionsList({ options }: OptionsListProps) {
  const currentSelectedOption = useQuizStore((state) => {
    const currentIndex = state.currentIndex;
    return state.answers.get(currentIndex);
  });
  const isCurrentConfirmed = useQuizStore((state) => state.isCurrentConfirmed);
  const selectOption = useQuizStore((state) => state.selectOption);
  const confirmAnswer = useQuizStore((state) => state.confirmAnswer);

  const hasOptions = options.length > 0;
  if (!hasOptions) {
    return null;
  }

  const hasSelectedOption = currentSelectedOption !== null;

  return (
    <div className="space-y-4">
      <div
        className="space-y-3"
        role="radiogroup"
        aria-label="Answer options"
      >
        {options.map((option, index) => {
          const isSelected = currentSelectedOption === index;
          const showResult = isCurrentConfirmed;
          const isCorrect = option.is_correct;

          return (
            <OptionItem
              key={index}
              index={index}
              description={option.description}
              isSelected={isSelected}
              showResult={showResult}
              isCorrect={isCorrect}
              onSelect={() => selectOption(index)}
              disabled={isCurrentConfirmed}
            />
          );
        })}
      </div>

      {!isCurrentConfirmed && hasSelectedOption && (
        <button
          onClick={confirmAnswer}
          className="w-full mt-4 px-6 py-3 bg-neon-lime hover:opacity-90 text-pitch-black font-w590 rounded-buttons transition-opacity focus:outline-none focus:ring-2 focus:ring-neon-lime focus:ring-offset-2 focus:ring-offset-pitch-black"
          aria-label="Submit answer"
        >
          Submit Answer
        </button>
      )}
    </div>
  );
}
