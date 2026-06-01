"use client";

import { useQuizStore } from '@/store/quizStore';

interface QuizQuestion {
  type: 'single-option';
  title: string;
  options: readonly QuizOption[];
}

interface QuizOption {
  description: string;
  is_correct: boolean;
  reasoning: string;
}

interface MistakeCardProps {
  questionIndex: number;
  question: QuizQuestion;
}

export default function MistakeCard({ questionIndex, question }: MistakeCardProps) {
  const { confirmedAnswers } = useQuizStore();
  const selectedOptionIndex = confirmedAnswers.get(questionIndex);

  if (selectedOptionIndex === undefined) return null;

  const selectedOption = question.options[selectedOptionIndex];
  const correctOptionIndex = question.options.findIndex(opt => opt.is_correct);
  const correctOption = correctOptionIndex >= 0 ? question.options[correctOptionIndex] : null;

  const questionNumber = questionIndex + 1;

  return (
    <div className="bg-deep-slate border border-warning-red/30 rounded-cards p-4 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-warning-red">✗</span>
        <h3 className="font-w510 text-porcelain">
          Question {questionNumber}
        </h3>
      </div>

      <p className="text-light-steel mb-4">{question.title}</p>

      <div className="space-y-2 text-body">
        <div className="flex gap-2">
          <span className="text-warning-red font-w510">Your answer:</span>
          <span className="text-storm-cloud">{selectedOption?.description}</span>
        </div>

        {correctOption && (
          <div className="flex gap-2">
            <span className="text-emerald font-w510">Correct answer:</span>
            <span className="text-storm-cloud">{correctOption.description}</span>
          </div>
        )}
      </div>

      {correctOption?.reasoning && (
        <div className="mt-4 p-3 bg-pitch-black rounded-buttons">
          <p className="text-caption text-fog-grey mb-1">Explanation:</p>
          <p className="text-body text-storm-cloud">{correctOption.reasoning}</p>
        </div>
      )}
    </div>
  );
}
