import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Constants
const INITIAL_QUESTION_INDEX = 0;
const EMPTY_QUESTION_COUNT = 0;

// Types
interface QuizOption {
  description: string;
  is_correct: boolean;
  reasoning: string;
}

interface QuizQuestion {
  type: 'single-option';
  title: string;
  options: QuizOption[];
}

interface QuizData {
  questions: QuizQuestion[];
  answers: Map<number, number>;
  confirmedAnswers: Map<number, number>;
  currentIndex: number;
}

interface QuizComputed {
  currentQuestion: QuizQuestion | null;
  progress: number;
  isComplete: boolean;
  hasAnsweredCurrent: boolean;
  isCurrentConfirmed: boolean;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
}

interface QuizActions {
  loadQuestions: (questions: QuizQuestion[]) => void;
  selectOption: (optionIndex: number) => void;
  confirmAnswer: () => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  resetQuiz: () => void;
}

type QuizState = QuizData & QuizComputed & QuizActions;

// Computed helpers
const computeCurrentQuestion = (questions: QuizQuestion[], currentIndex: number): QuizQuestion | null => {
  const hasQuestions = questions.length > EMPTY_QUESTION_COUNT;
  const isValidIndex = currentIndex >= INITIAL_QUESTION_INDEX && currentIndex < questions.length;
  const shouldReturnQuestion = hasQuestions && isValidIndex;

  if (!shouldReturnQuestion) {
    return null;
  }

  return questions[currentIndex];
};

const computeProgress = (currentIndex: number, totalQuestions: number): number => {
  const hasNoQuestions = totalQuestions === EMPTY_QUESTION_COUNT;
  if (hasNoQuestions) {
    return INITIAL_QUESTION_INDEX;
  }

  return ((currentIndex + 1) / totalQuestions) * 100;
};

const computeIsComplete = (currentIndex: number, totalQuestions: number): boolean => {
  const isPastLastQuestion = currentIndex >= totalQuestions;
  const hasNoQuestions = totalQuestions === EMPTY_QUESTION_COUNT;
  return isPastLastQuestion || hasNoQuestions;
};

const computeHasAnsweredCurrent = (answers: Map<number, number>, currentIndex: number): boolean => {
  return answers.has(currentIndex);
};

const computeIsCurrentConfirmed = (confirmedAnswers: Map<number, number>, currentIndex: number): boolean => {
  return confirmedAnswers.has(currentIndex);
};

const computeAnsweredCount = (confirmedAnswers: Map<number, number>): number => {
  return confirmedAnswers.size;
};

const computeCorrectCount = (
  confirmedAnswers: Map<number, number>,
  questions: QuizQuestion[]
): number => {
  let correct = 0;
  const entries = Array.from(confirmedAnswers.entries());

  for (const [questionIndex, selectedOptionIndex] of entries) {
    const question = questions[questionIndex];
    if (!question) continue;

    const selectedOption = question.options[selectedOptionIndex];
    if (selectedOption?.is_correct) {
      correct++;
    }
  }

  return correct;
};

// Create the store
export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      // Initial state
      questions: [],
      answers: new Map(),
      confirmedAnswers: new Map(),
      currentIndex: INITIAL_QUESTION_INDEX,

      // Computed properties
      get currentQuestion(): QuizQuestion | null {
        const { questions, currentIndex } = get();
        return computeCurrentQuestion(questions, currentIndex);
      },

      get progress(): number {
        const { currentIndex, questions } = get();
        return computeProgress(currentIndex, questions.length);
      },

      get isComplete(): boolean {
        const { currentIndex, questions } = get();
        return computeIsComplete(currentIndex, questions.length);
      },

      get hasAnsweredCurrent(): boolean {
        const { answers, currentIndex } = get();
        return computeHasAnsweredCurrent(answers, currentIndex);
      },

      get isCurrentConfirmed(): boolean {
        const { confirmedAnswers, currentIndex } = get();
        return computeIsCurrentConfirmed(confirmedAnswers, currentIndex);
      },

      get totalQuestions(): number {
        return get().questions.length;
      },

      get answeredCount(): number {
        return computeAnsweredCount(get().confirmedAnswers);
      },

      get correctCount(): number {
        const { confirmedAnswers, questions } = get();
        return computeCorrectCount(confirmedAnswers, questions);
      },

      // Actions
      loadQuestions: (questions) => {
        set({
          questions,
          answers: new Map(),
          confirmedAnswers: new Map(),
          currentIndex: INITIAL_QUESTION_INDEX,
        });
      },

      selectOption: (optionIndex) => {
        const { currentIndex, answers } = get();
        const newAnswers = new Map(answers);
        newAnswers.set(currentIndex, optionIndex);
        set({ answers: newAnswers });
      },

      confirmAnswer: () => {
        const { currentIndex, answers, confirmedAnswers } = get();
        const selectedOption = answers.get(currentIndex);

        const hasSelectedOption = selectedOption !== undefined;
        if (!hasSelectedOption) {
          return;
        }

        const newConfirmedAnswers = new Map(confirmedAnswers);
        newConfirmedAnswers.set(currentIndex, selectedOption);
        set({ confirmedAnswers: newConfirmedAnswers });
      },

      nextQuestion: () => {
        const { currentIndex, questions } = get();
        const hasMoreQuestions = currentIndex < questions.length - 1;

        if (hasMoreQuestions) {
          set({ currentIndex: currentIndex + 1 });
        }
      },

      previousQuestion: () => {
        const { currentIndex } = get();
        const hasPreviousQuestions = currentIndex > INITIAL_QUESTION_INDEX;

        if (hasPreviousQuestions) {
          set({ currentIndex: currentIndex - 1 });
        }
      },

      resetQuiz: () => {
        set({
          answers: new Map(),
          confirmedAnswers: new Map(),
          currentIndex: INITIAL_QUESTION_INDEX,
        });
      },
    }),
    {
      name: 'quiz-storage',
      partialize: (state) => ({
        answers: Array.from(state.answers.entries()),
        confirmedAnswers: Array.from(state.confirmedAnswers.entries()),
        currentIndex: state.currentIndex,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        state.answers = new Map(state.answers as unknown as Array<[number, number]>);
        state.confirmedAnswers = new Map(state.confirmedAnswers as unknown as Array<[number, number]>);
      },
    }
  )
);
