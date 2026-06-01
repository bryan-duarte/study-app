"use client";

import { useQuizStore } from '@/store/quizStore';
import { Button } from '@/components/ui/Button';
import MistakesList from './MistakesList';

const PERFECT_SCORE_EMOJI = "Perfect score!";
const PERFECT_SCORE_SUBTEXT = "You got all questions correct.";
const MISTAKES_SECTION_TITLE = "Review Your Mistakes";
const QUIZ_COMPLETE_TITLE = "Quiz Complete!";

export default function ResultsScreen() {
  const { questions, confirmedAnswers, resetQuiz, correctCount } = useQuizStore();

  const totalQuestions = questions.length;
  const correctAnswers = correctCount;
  const incorrectAnswers = totalQuestions - correctAnswers;
  const percentage = totalQuestions > 0
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : 0;

  const mistakes = Array.from(confirmedAnswers.entries())
    .filter(([questionIndex, selectedOptionIndex]) => {
      const question = questions[questionIndex];
      if (!question) return false;

      const selectedOption = question.options[selectedOptionIndex];
      return selectedOption?.is_correct === false;
    })
    .map(([questionIndex]) => questionIndex);

  const hasNoMistakes = mistakes.length === 0;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-3xl mx-auto">
      <div className="bg-graphite border border-charcoal-grey rounded-cards p-6 text-center shadow-sm">
        <h1 className="text-heading font-w590 text-porcelain mb-4">
          {QUIZ_COMPLETE_TITLE}
        </h1>

        <div className="text-heading-lg font-w590 text-neon-lime mb-2">
          {percentage}%
        </div>

        <p className="text-storm-cloud mb-6">
          {correctAnswers} of {totalQuestions} correct
        </p>

        <div className="flex justify-center gap-4">
          <div className="text-center">
            <div className="text-heading font-w590 text-emerald">{correctAnswers}</div>
            <div className="text-caption text-storm-cloud">Correct</div>
          </div>
          <div className="w-px bg-charcoal-grey" />
          <div className="text-center">
            <div className="text-heading font-w590 text-warning-red">{incorrectAnswers}</div>
            <div className="text-caption text-storm-cloud">Incorrect</div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <Button onClick={resetQuiz} variant="primary">
            Try Again
          </Button>
        </div>
      </div>

      {hasNoMistakes ? (
        <div className="text-center text-storm-cloud py-8">
          <p className="text-body">{PERFECT_SCORE_EMOJI}</p>
          <p className="text-caption">{PERFECT_SCORE_SUBTEXT}</p>
        </div>
      ) : (
        <div>
          <h2 className="text-heading font-w510 text-porcelain mb-4">
            {MISTAKES_SECTION_TITLE}
          </h2>
          <MistakesList mistakes={mistakes} />
        </div>
      )}
    </div>
  );
}
