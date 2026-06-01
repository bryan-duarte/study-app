"use client";

import { useEffect } from "react";
import { useQuizStore } from "@/store/quizStore";
import ProgressBar from "./ProgressBar";
import QuestionCard from "./QuestionCard";
import OptionsList from "./OptionsList";
import FeedbackCard from "./FeedbackCard";

const QUIZ_DATA_URL = "/questions.json";

export default function QuizContainer() {
  const questions = useQuizStore((state) => state.questions);
  const confirmedAnswers = useQuizStore((state) => state.confirmedAnswers);
  const currentIndex = useQuizStore((state) => state.currentIndex);
  const loadQuestions = useQuizStore((state) => state.loadQuestions);

  const currentQuestion = questions[currentIndex] ?? null;
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const isCurrentConfirmed = confirmedAnswers.has(currentIndex);

  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        const response = await fetch(QUIZ_DATA_URL);
        if (!response.ok) {
          throw new Error(`Failed to load: ${response.statusText}`);
        }

        const questions = await response.json();
        loadQuestions(questions);
      } catch (error) {
        console.error("Failed to load quiz questions:", error);
      }
    };

    initializeQuiz();
  }, [loadQuestions]);

  const hasNoQuestions = totalQuestions === 0;
  if (hasNoQuestions) {
    return (
      <div
        className="flex items-center justify-center min-h-[400px]"
        role="status"
        aria-live="polite"
      >
        <p className="text-fog-grey">Loading quiz...</p>
      </div>
    );
  }

  const hasNoCurrentQuestion = !currentQuestion;
  if (hasNoCurrentQuestion) {
    return (
      <div
        className="flex items-center justify-center min-h-[400px]"
        role="status"
        aria-live="polite"
      >
        <p className="text-fog-grey">No questions available.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <ProgressBar
        current={currentIndex + 1}
        total={totalQuestions}
        progress={progress}
      />

      <div className="mt-8 space-y-6">
        <QuestionCard question={currentQuestion.title} />

        <OptionsList options={currentQuestion.options} />

        {isCurrentConfirmed && <FeedbackCard question={currentQuestion} />}
      </div>
    </div>
  );
}
