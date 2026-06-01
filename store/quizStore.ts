import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuizQuestion } from "@/lib/transformers/question";

// Constants
const INITIAL_QUESTION_INDEX = 0;
const EMPTY_QUESTION_COUNT = 0;
const DEFAULT_PAGE = 1;
const DEFAULT_QUESTIONS_PER_PAGE = 10;

interface PaginationState {
	currentPage: number;
	totalPages: number;
	questionsPerPage: number;
	allQuestionsLoaded: boolean;
}

interface SyncState {
	isSyncing: boolean;
	autoSyncEnabled: boolean;
	lastSyncTime: number | null;
}

interface QuizData {
	questions: QuizQuestion[];
	answers: Map<number, number>;
	confirmedAnswers: Map<number, number>;
	currentIndex: number;
	pagination: PaginationState;
	sync: SyncState;
	shuffledIndices: number[];
	isShuffled: boolean;
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
	loadQuestionsPage: (page: number, limit?: number) => Promise<void>;
	selectOption: (optionIndex: number) => void;
	confirmAnswer: () => void;
	nextQuestion: () => void;
	previousQuestion: () => void;
	resetQuiz: () => void;
	shuffleQuestions: () => void;
	setCurrentPage: (page: number) => void;
	syncProgress: () => Promise<void>;
	loadProgress: () => Promise<void>;
	enableAutoSync: () => void;
	disableAutoSync: () => void;
}

type QuizState = QuizData & QuizComputed & QuizActions;

// Computed helpers
const computeCurrentQuestion = (
	questions: QuizQuestion[],
	currentIndex: number,
): QuizQuestion | null => {
	const hasQuestions = questions.length > EMPTY_QUESTION_COUNT;
	const isValidIndex =
		currentIndex >= INITIAL_QUESTION_INDEX && currentIndex < questions.length;
	const shouldReturnQuestion = hasQuestions && isValidIndex;

	if (!shouldReturnQuestion) {
		return null;
	}

	return questions[currentIndex];
};

const computeProgress = (
	currentIndex: number,
	totalQuestions: number,
): number => {
	const hasNoQuestions = totalQuestions === EMPTY_QUESTION_COUNT;
	if (hasNoQuestions) {
		return INITIAL_QUESTION_INDEX;
	}

	return ((currentIndex + 1) / totalQuestions) * 100;
};

const computeIsComplete = (
	currentIndex: number,
	totalQuestions: number,
): boolean => {
	const isPastLastQuestion = currentIndex >= totalQuestions;
	const hasNoQuestions = totalQuestions === EMPTY_QUESTION_COUNT;
	return isPastLastQuestion || hasNoQuestions;
};

const computeHasAnsweredCurrent = (
	answers: Map<number, number>,
	currentIndex: number,
): boolean => {
	return answers.has(currentIndex);
};

const computeIsCurrentConfirmed = (
	confirmedAnswers: Map<number, number>,
	currentIndex: number,
): boolean => {
	return confirmedAnswers.has(currentIndex);
};

const computeAnsweredCount = (
	confirmedAnswers: Map<number, number>,
): number => {
	return confirmedAnswers.size;
};

const computeCorrectCount = (
	confirmedAnswers: Map<number, number>,
	questions: QuizQuestion[],
): number => {
	let correct = 0;
	const entries = Array.from(confirmedAnswers.entries());

	for (const [questionIndex, selectedOptionIndex] of entries) {
		const question = questions[questionIndex];
		if (!question) continue;

		const selectedOption = question.options[selectedOptionIndex];
		if (selectedOption?.isCorrect) {
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
			pagination: {
				currentPage: DEFAULT_PAGE,
				totalPages: 1,
				questionsPerPage: DEFAULT_QUESTIONS_PER_PAGE,
				allQuestionsLoaded: false,
			},
			sync: {
				isSyncing: false,
				autoSyncEnabled: false,
				lastSyncTime: null,
			},
			shuffledIndices: [],
			isShuffled: false,

			// Computed properties
			get currentQuestion(): QuizQuestion | null {
				const { questions, currentIndex, shuffledIndices } = get();
				const actualIndex = shuffledIndices[currentIndex] ?? currentIndex;
				return computeCurrentQuestion(questions, actualIndex);
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

			shuffleQuestions: () => {
				const { questions, isShuffled } = get();

				if (isShuffled || questions.length === 0) return;

				const indices = Array.from({ length: questions.length }, (_, i) => i);

				// Fisher-Yates shuffle algorithm
				for (let i = indices.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[indices[i], indices[j]] = [indices[j], indices[i]];
				}

				set({
					shuffledIndices: indices,
					isShuffled: true,
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

			// Pagination actions
			setCurrentPage: (page: number) => {
				const { pagination } = get();
				const isValidPage = page >= 1 && page <= pagination.totalPages;

				if (isValidPage) {
					set({ pagination: { ...pagination, currentPage: page } });
				}
			},

			loadQuestionsPage: async (page: number, limit?: number) => {
				try {
					const questionsPerPage = limit ?? get().pagination.questionsPerPage;
					const response = await fetch(
						`/api/questions?page=${page}&limit=${questionsPerPage}`,
					);

					if (!response.ok) {
						throw new Error(`Failed to load questions: ${response.statusText}`);
					}

					const data = await response.json();

					// API returns transformed questions with camelCase properties
					const transformedQuestions = data.questions as QuizQuestion[];

					set({
						questions: transformedQuestions,
						pagination: {
							...get().pagination,
							currentPage: data.pagination.page,
							totalPages: data.pagination.totalPages,
							allQuestionsLoaded: !data.pagination.hasNext,
						},
					});
				} catch (error) {
					console.error("Failed to load questions page:", error);
					throw error;
				}
			},

			// Sync actions
			syncProgress: async () => {
				const state = useQuizStore.getState();

				useQuizStore.setState({ sync: { ...state.sync, isSyncing: true } });

				try {
					const state = useQuizStore.getState();
					const response = await fetch("/api/quiz/progress", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							answers: Array.from(state.answers.entries()),
							confirmedAnswers: Array.from(state.confirmedAnswers.entries()),
							currentIndex: state.currentIndex,
							isComplete: state.isComplete,
						}),
					});

					if (!response.ok) {
						const errorData = await response.json();
						throw new Error(errorData.error || "Sync failed");
					}

					useQuizStore.setState({
						sync: {
							...state.sync,
							isSyncing: false,
							lastSyncTime: Date.now(),
						},
					});
				} catch (error) {
					console.error("Progress sync failed:", error);
					useQuizStore.setState({
						sync: {
							...useQuizStore.getState().sync,
							isSyncing: false,
						},
					});
				}
			},

			loadProgress: async () => {
				try {
					const response = await fetch("/api/quiz/progress");

					if (!response.ok) {
						// User not authenticated or no progress
						return;
					}

					const data = await response.json();

					useQuizStore.getState().loadQuestions([]); // Preserve questions

					set({
						answers: new Map(data.answers),
						confirmedAnswers: new Map(data.confirmedAnswers),
						currentIndex: data.currentIndex,
					});
				} catch (error) {
					console.error("Failed to load progress:", error);
				}
			},

			enableAutoSync: () => {
				set({ sync: { ...get().sync, autoSyncEnabled: true } });
			},

			disableAutoSync: () => {
				set({ sync: { ...get().sync, autoSyncEnabled: false } });
			},
		}),
		{
			name: "quiz-storage",
			partialize: (state) => ({
				answers: Array.from(state.answers.entries()),
				confirmedAnswers: Array.from(state.confirmedAnswers.entries()),
				currentIndex: state.currentIndex,
				pagination: state.pagination,
				sync: {
					...state.sync,
					lastSyncTime: state.sync.lastSyncTime,
				},
				shuffledIndices: state.shuffledIndices,
				isShuffled: state.isShuffled,
			}),
			onRehydrateStorage: () => (state) => {
				if (!state) return;

				state.answers = new Map(
					state.answers as unknown as Array<[number, number]>,
				);
				state.confirmedAnswers = new Map(
					state.confirmedAnswers as unknown as Array<[number, number]>,
				);
				state.pagination = {
					currentPage: state.pagination?.currentPage ?? DEFAULT_PAGE,
					totalPages: state.pagination?.totalPages ?? 1,
					questionsPerPage:
						state.pagination?.questionsPerPage ?? DEFAULT_QUESTIONS_PER_PAGE,
					allQuestionsLoaded: state.pagination?.allQuestionsLoaded ?? false,
				};
				state.sync = {
					isSyncing: false,
					autoSyncEnabled: state.sync?.autoSyncEnabled ?? false,
					lastSyncTime: state.sync?.lastSyncTime ?? null,
				};
				state.shuffledIndices = state.shuffledIndices ?? [];
				state.isShuffled = state.isShuffled ?? false;
			},
		},
	),
);
