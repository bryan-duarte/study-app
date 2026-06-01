"use client";

import { useQuizStore } from '@/store/quizStore';
import MistakeCard from './MistakeCard';

interface MistakesListProps {
  mistakes: number[];
}

export default function MistakesList({ mistakes }: MistakesListProps) {
  const { questions } = useQuizStore();

  return (
    <div className="flex flex-col gap-4">
      {mistakes.map((questionIndex) => {
        const question = questions[questionIndex];
        if (!question) return null;

        return (
          <MistakeCard
            key={questionIndex}
            questionIndex={questionIndex}
            question={question}
          />
        );
      })}
    </div>
  );
}
