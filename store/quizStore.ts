import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuizQuestion } from "@/lib/transformers/question";
import type { SessionQuestion, SessionStartResponse } from "@/types/quiz";
import { fetchWithTimeout, isTimeoutError } from "@/lib/fetch";

// Constants
const INITIAL_QUESTION_INDEX = 0;
const EMPTY_QUESTION_COUNT = 0;
const DEFAULT_PAGE = 1;
const DEFAULT_QUESTIONS_PER_PAGE = 10;
const DEFAULT_SESSION_QUESTION_COUNT = 20;
const DEFAULT_QUESTION_COUNT = 20;

// Session Types
interface SessionQuestionData {
	questionId: string;
	isCorrect: boolean;
	timeTaken?: number;
	timestamp: number;
}

interface SessionMetrics {
	sessionId: string;
	questionsAnswered: number;
	correctCount: number;
	totalUniqueQuestionsAnswered: number;
	startTime: number;
	endTime?: number;
	isComplete: boolean;
}

interface SessionState {
	sessionId: string | null;
	sessionQuestions: Map<string, SessionQuestionData>;
	sessionMetrics: SessionMetrics | null;
	questionPoolSize: number;
	isQuestionExhausted: boolean;
	sessionStartTime: number | null;
	currentSessionData: SessionStartResponse | null;
}

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
	answers: Map<number, number | number[]>;
	confirmedAnswers: Map<number, number | number[]>;
	currentIndex: number;
	pagination: PaginationState;
	sync: SyncState;
	shuffledIndices: number[];
	isShuffled: boolean;
	isSubmitting: boolean;
	sessionsCompleted: number;
	totalUniqueQuestionsAnswered: number;
	answeredQuestionIds: Set<string>;
	session: SessionState;
	selectedQuestionCount: number;
	// Explicit counter for session progress to ensure reactivity
	sessionAnsweredCount: number;
	// Direct session progress value (not computed) for proper reactivity
	sessionProgress: number;
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
	questionsRemaining: number;
	sessionRemaining: number;
	isSessionComplete: boolean;
}

interface QuizActions {
	loadQuestions: (questions: QuizQuestion[]) => void;
	loadQuestionsPage: (page: number, limit?: number) => Promise<void>;
	loadSessionQuestions: (userId?: string) => Promise<void>;
	selectOption: (optionIndex: number) => void;
	toggleOption: (optionIndex: number) => void;
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
	startSession: (userId?: string, questionCount?: number) => Promise<SessionStartResponse | null>;
	recordSessionAnswer: (questionId: string, selectedOptionId: string) => Promise<void>;
	getSessionMetrics: () => SessionMetrics | null;
	handleSessionComplete: () => Promise<void>;
	checkExhaustionStatus: () => Promise<void>;
	setQuestionCount: (count: number) => void;
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
	answers: Map<number, number | number[]>,
	currentIndex: number,
): boolean => {
	const answer = answers.get(currentIndex);
	if (typeof answer === "number") {
		return answer >= 0;
	}
	return Array.isArray(answer) && answer.length > 0;
};

const computeIsCurrentConfirmed = (
	confirmedAnswers: Map<number, number | number[]>,
	currentIndex: number,
): boolean => {
	return confirmedAnswers.has(currentIndex);
};

const computeAnsweredCount = (
	confirmedAnswers: Map<number, number | number[]>,
): number => {
	return confirmedAnswers.size;
};

const computeCorrectCount = (
	confirmedAnswers: Map<number, number | number[]>,
	questions: QuizQuestion[],
): number => {
	let correct = 0;
	const entries = Array.from(confirmedAnswers.entries());

	for (const [questionIndex, selectedAnswer] of entries) {
		const question = questions[questionIndex];
		if (!question) continue;

		const isMultiSelect = question.type === "multi-option";
		const correctOptionIndices = question.options
			.map((opt, idx) => (opt.isCorrect ? idx : -1))
			.filter((idx) => idx !== -1);

		if (isMultiSelect) {
			const selectedIndices = Array.isArray(selectedAnswer)
				? selectedAnswer
				: [selectedAnswer];
			const allCorrectSelected = correctOptionIndices.every((idx) =>
				selectedIndices.includes(idx),
			);
			const noIncorrectSelected = selectedIndices.every((idx) =>
				correctOptionIndices.includes(idx),
			);
			if (allCorrectSelected && noIncorrectSelected) {
				correct++;
			}
		} else {
			const selectedOptionIndex =
				typeof selectedAnswer === "number" ? selectedAnswer : selectedAnswer[0];
			const selectedOption = question.options[selectedOptionIndex];
			if (selectedOption?.isCorrect) {
				correct++;
			}
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
			isSubmitting: false,
			sessionsCompleted: 0,
			totalUniqueQuestionsAnswered: 0,
			answeredQuestionIds: new Set(),
			session: {
				sessionId: null,
				sessionQuestions: new Map(),
				sessionMetrics: null,
				questionPoolSize: 0,
				isQuestionExhausted: false,
				sessionStartTime: null,
				currentSessionData: null,
			},
			selectedQuestionCount: DEFAULT_QUESTION_COUNT,
			sessionAnsweredCount: 0,
			sessionProgress: 0,

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

			get questionsRemaining(): number {
				const { answeredQuestionIds, questions } = get();
				const newQuestions = questions.filter(
					(q) => !answeredQuestionIds.has(q.id),
				).length;
				return newQuestions;
			},

			// Compute session remaining (not stored, computed on access)
			get sessionRemaining(): number {
				const { session, sessionAnsweredCount } = get();
				const total = session.currentSessionData?.questions.length ?? DEFAULT_SESSION_QUESTION_COUNT;
				return total - sessionAnsweredCount;
			},

			get isSessionComplete(): boolean {
				const { session, confirmedAnswers } = get();
				// Check if session is marked complete in backend
				if (session.currentSessionData) {
					const answered = session.currentSessionData.questions.filter((q) => q.answeredAt).length;
					return answered >= session.currentSessionData.questions.length;
				}
				// Fallback to local count
				return confirmedAnswers.size >= DEFAULT_SESSION_QUESTION_COUNT;
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
				const { currentIndex, answers, questions } = get();
				const question = questions[currentIndex];
				if (!question) return;

				const isMultiSelect = question.type === "multi-option";
				const newAnswers = new Map(answers);

				if (isMultiSelect) {
					const current = answers.get(currentIndex);
					const selectedArray = Array.isArray(current) ? current : [];
					const isSelected = selectedArray.includes(optionIndex);
					const newArray = isSelected
						? selectedArray.filter((i) => i !== optionIndex)
						: [...selectedArray, optionIndex].sort((a, b) => a - b);
					newAnswers.set(currentIndex, newArray);
				} else {
					newAnswers.set(currentIndex, optionIndex);
				}
				set({ answers: newAnswers });
			},

			toggleOption: (optionIndex) => {
				const { selectOption } = get();
				selectOption(optionIndex);
			},

			confirmAnswer: async () => {
				const { currentIndex, answers, confirmedAnswers, questions, session } = get();
				const selectedOption = answers.get(currentIndex);
				const question = questions[currentIndex];

				const hasSelectedOption = selectedOption !== undefined;
				if (!hasSelectedOption || !question) {
					return;
				}

				set({ isSubmitting: true });

				// Calculate if answer is correct locally for immediate feedback
				const isMultiSelect = question.type === "multi-option";
				const correctOptionIndices = question.options
					.map((opt, idx) => (opt.isCorrect ? idx : -1))
					.filter((idx) => idx !== -1);

				let isCorrect = false;
				let selectedOptionId: string | null = null;

				if (isMultiSelect) {
					const selectedIndices = Array.isArray(selectedOption)
						? selectedOption
						: [selectedOption];
					const allCorrectSelected = correctOptionIndices.every((idx) =>
						selectedIndices.includes(idx),
					);
					const noIncorrectSelected = selectedIndices.every((idx) =>
						correctOptionIndices.includes(idx),
					);
					isCorrect = allCorrectSelected && noIncorrectSelected && selectedIndices.length > 0;
					// For multi-select, collect the actual option UUIDs
					selectedOptionId = selectedIndices
						.map((idx) => question.options[idx]?.id)
						.filter((id): id is string => Boolean(id))
						.join("-");
				} else {
					const optionIndex =
						typeof selectedOption === "number" ? selectedOption : selectedOption[0];
					const selectedOptionValue = question.options[optionIndex];
					isCorrect = selectedOptionValue?.isCorrect ?? false;
					selectedOptionId = selectedOptionValue?.id ?? null;
				}

				// Update local confirmed answers immediately
				const newConfirmedAnswers = new Map(confirmedAnswers);
				const wasAlreadyConfirmed = newConfirmedAnswers.has(currentIndex);
				newConfirmedAnswers.set(currentIndex, selectedOption);

				// Combine both updates in a single set() call for proper reactivity
				const newCount = wasAlreadyConfirmed ? get().sessionAnsweredCount : get().sessionAnsweredCount + 1;
				set({
					confirmedAnswers: newConfirmedAnswers,
					isSubmitting: false,
					sessionAnsweredCount: newCount,
					sessionProgress: newCount,
				});

				// Update local session data immediately for immediate progress updates
				if (session.currentSessionData && question.id && selectedOptionId) {
					const updatedQuestions = session.currentSessionData.questions.map((q) =>
						q.questionId === question.id
							? { ...q, selectedOptionId, isCorrect, answeredAt: new Date().toISOString() }
							: q
					);

					const updatedSessionData: SessionStartResponse = {
						sessionId: session.currentSessionData.sessionId,
						questions: updatedQuestions,
						totalAvailableQuestions: session.currentSessionData.totalAvailableQuestions,
					};

					set({
						session: {
							...session,
							currentSessionData: updatedSessionData,
						},
					});
				}

				// Record session answer if session is active and we have a valid option ID
				// This syncs with the server and may update isCorrect based on server validation
				if (session.sessionId && selectedOptionId) {
					await get().recordSessionAnswer(question.id, selectedOptionId);
				}
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

			resetQuiz: async () => {
				const { questions, confirmedAnswers, answeredQuestionIds, sessionsCompleted, totalUniqueQuestionsAnswered, session } = get();

				// Track newly answered question IDs for this session
				const newAnsweredIds = new Set(answeredQuestionIds);
				let uniqueCount = totalUniqueQuestionsAnswered;

				for (const [questionIndex] of confirmedAnswers.entries()) {
					const question = questions[questionIndex];
					if (question && !newAnsweredIds.has(question.id)) {
						newAnsweredIds.add(question.id);
						uniqueCount++;
					}
				}

				// Complete session if it was active
				if (session.sessionId && session.sessionQuestions.size > 0) {
					await get().handleSessionComplete();
				}

				set({
					answers: new Map(),
					confirmedAnswers: new Map(),
					currentIndex: INITIAL_QUESTION_INDEX,
					sessionsCompleted: sessionsCompleted + 1,
					totalUniqueQuestionsAnswered: uniqueCount,
					answeredQuestionIds: newAnsweredIds,
					session: {
						...session,
						sessionId: null,
						sessionQuestions: new Map(),
						sessionMetrics: null,
						currentSessionData: null,
					},
					sessionAnsweredCount: 0,
					sessionProgress: 0,
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
					const response = await fetchWithTimeout(
						`/api/questions?page=${page}&limit=${questionsPerPage}`,
						{ timeout: 15000 },
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
					if (isTimeoutError(error)) {
						console.error("Questions request timed out");
					} else {
						console.error("Failed to load questions page:", error);
					}
					throw error;
				}
			},

			loadSessionQuestions: async (userId?: string) => {
				try {
					const sessionData = await get().startSession(userId);
					if (!sessionData) {
						throw new Error("Failed to start session");
					}

					// Transform SessionQuestion[] to QuizQuestion[]
					const transformedQuestions = sessionData.questions.map((sq) => ({
						id: sq.question.id,
						type: sq.question.type,
						title: sq.question.title,
						options: sq.question.options.map((opt) => ({
							id: opt.id,
							description: opt.description,
							isCorrect: opt.is_correct,
							reasoning: opt.reasoning,
						})),
					}));

					set({
						questions: transformedQuestions,
						answers: new Map(),
						confirmedAnswers: new Map(),
						currentIndex: INITIAL_QUESTION_INDEX,
						session: {
							...get().session,
							questionPoolSize: sessionData.totalAvailableQuestions,
							isQuestionExhausted: sessionData.questions.length === 0,
							currentSessionData: sessionData,
						},
						sessionAnsweredCount: 0,
						sessionProgress: 0,
					});

					// Don't shuffle - the session API already returns shuffled questions
				} catch (error) {
					console.error("Failed to load session questions:", error);
					throw error;
				}
			},

			// Sync actions
			syncProgress: async () => {
				const state = useQuizStore.getState();

				useQuizStore.setState({ sync: { ...state.sync, isSyncing: true } });

				try {
					const state = useQuizStore.getState();
					const response = await fetchWithTimeout("/api/quiz/progress", {
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

			// Session actions
			startSession: async (userId?: string, questionCount?: number) => {
				try {
					const count = questionCount ?? get().selectedQuestionCount;
					const response = await fetchWithTimeout("/api/quiz/session/start", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ user_id: userId, question_count: count }),
					});

					if (!response.ok) {
						throw new Error(`Failed to start session: ${response.statusText}`);
					}

					const data = await response.json() as SessionStartResponse;

					set({
						session: {
							...get().session,
							sessionId: data.sessionId,
							sessionStartTime: Date.now(),
							sessionQuestions: new Map(),
							currentSessionData: data,
						},
					});

					return data;
				} catch (error) {
					console.error("Failed to start session:", error);
					return null;
				}
			},

			recordSessionAnswer: async (questionId: string, selectedOptionId: string) => {
				const { session } = get();
				if (!session.sessionId) return;

				try {
					const response = await fetchWithTimeout(`/api/quiz/session/${session.sessionId}/answer`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							questionId,
							selectedOptionId,
						}),
					});

					if (!response.ok) {
						throw new Error(`Failed to record answer: ${response.statusText}`);
					}

					const data = await response.json();

					// Update local session state with server response
					// This may update isCorrect with server-validated value
					if (session.currentSessionData) {
						const updatedQuestions = session.currentSessionData.questions.map((q) =>
							q.questionId === questionId
								? { ...q, selectedOptionId, isCorrect: data.isCorrect, answeredAt: q.answeredAt || new Date().toISOString() }
								: q
						);

						const updatedSessionData: SessionStartResponse = {
							sessionId: session.currentSessionData.sessionId,
							questions: updatedQuestions,
							totalAvailableQuestions: session.currentSessionData.totalAvailableQuestions,
						};

						set({
							session: {
								...session,
								sessionQuestions: new Map(
									Array.from(session.sessionQuestions.entries()).concat([
										[questionId, {
											questionId,
											isCorrect: data.isCorrect,
											timestamp: Date.now(),
										}],
									]),
								),
								currentSessionData: updatedSessionData,
							},
						});
					}

					// Check if session is complete
					if (data.sessionComplete) {
						await get().handleSessionComplete();
					}
				} catch (error) {
					console.error("Failed to record session answer:", error);
				}
			},

			getSessionMetrics: () => {
				const { session } = get();
				return session.sessionMetrics;
			},

			handleSessionComplete: async () => {
				const { session, correctCount, totalUniqueQuestionsAnswered } = get();
				if (!session.sessionId) return;

				try {
					// Fetch updated session details
					const response = await fetchWithTimeout(`/api/quiz/session/${session.sessionId}`, { timeout: 10000 });

					if (!response.ok) {
						throw new Error(`Failed to get session details: ${response.statusText}`);
					}

					const data = await response.json();

					const metrics: SessionMetrics = {
						sessionId: session.sessionId,
						questionsAnswered: data.answeredCount,
						correctCount: data.questions.filter((q: SessionQuestion) => q.isCorrect).length,
						totalUniqueQuestionsAnswered,
						startTime: session.sessionStartTime ?? Date.now(),
						endTime: Date.now(),
						isComplete: data.isComplete,
					};

					set({
						session: {
							...get().session,
							sessionMetrics: metrics,
							currentSessionData: {
								...session.currentSessionData!,
								questions: data.questions,
							},
						},
					});
				} catch (error) {
					console.error("Failed to complete session:", error);
				}
			},

			checkExhaustionStatus: async () => {
				const { answeredQuestionIds } = get();

				try {
					// Use the session start API to check exhaustion
					const response = await fetchWithTimeout("/api/quiz/session/start", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ user_id: undefined }),
					});

					if (!response.ok) {
						throw new Error(`Failed to check exhaustion: ${response.statusText}`);
					}

					const data = await response.json() as SessionStartResponse;

					set({
						session: {
							...get().session,
							questionPoolSize: data.totalAvailableQuestions,
							isQuestionExhausted: data.questions.length === 0,
						},
					});
				} catch (error) {
					console.error("Failed to check exhaustion status:", error);
				}
			},

			setQuestionCount: (count: number) => {
				const validCounts = [10, 20, 30];
				if (!validCounts.includes(count)) {
					console.warn(`Invalid question count: ${count}. Must be one of ${validCounts.join(", ")}`);
					return;
				}
				set({ selectedQuestionCount: count });
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
				sessionsCompleted: state.sessionsCompleted,
				totalUniqueQuestionsAnswered: state.totalUniqueQuestionsAnswered,
				answeredQuestionIds: Array.from(state.answeredQuestionIds),
				selectedQuestionCount: state.selectedQuestionCount,
				sessionAnsweredCount: state.sessionAnsweredCount,
				sessionProgress: state.sessionProgress,
			}),
			onRehydrateStorage: () => (state) => {
				if (!state) return;

				state.answers = new Map(
					state.answers as unknown as Array<[number, number | number[]]>,
				);
				state.confirmedAnswers = new Map(
					state.confirmedAnswers as unknown as Array<[number, number | number[]]>,
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
				state.sessionsCompleted = state.sessionsCompleted ?? 0;
				state.totalUniqueQuestionsAnswered = state.totalUniqueQuestionsAnswered ?? 0;
				state.answeredQuestionIds = new Set(
					state.answeredQuestionIds as unknown as string[],
				);
				state.selectedQuestionCount = state.selectedQuestionCount ?? DEFAULT_QUESTION_COUNT;
				state.sessionAnsweredCount = state.sessionAnsweredCount ?? 0;
				state.sessionProgress = state.sessionProgress ?? 0;
				state.session = {
					sessionId: null,
					sessionQuestions: new Map(),
					sessionMetrics: null,
					questionPoolSize: 0,
					isQuestionExhausted: false,
					sessionStartTime: null,
					currentSessionData: null,
				};
			},
		},
	),
);
