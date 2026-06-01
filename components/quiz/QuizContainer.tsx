"use client";

import { useEffect, useRef, useState } from "react";
import type { QuizQuestion } from "@/lib/transformers/question";
import { cn } from "@/lib/utils/cn";
import { fetchWithRetry } from "@/lib/utils/retry";
import { useQuizStore } from "@/store/quizStore";
import FeedbackCard from "./FeedbackCard";
import OptionsList from "./OptionsList";
import ProgressBar from "./ProgressBar";
import QuestionCard from "./QuestionCard";

const QUESTIONS_API_URL = "/api/questions";

interface PaginatedQuestionsResponse {
	questions: Array<{
		id: string;
		type: "single-option" | "multi-option";
		title: string;
		options: Array<{
			id: string;
			description: string;
			isCorrect: boolean;
			reasoning: string;
		}>;
	}>;
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

export default function QuizContainer() {
	const questions = useQuizStore((state) => state.questions);
	const confirmedAnswers = useQuizStore((state) => state.confirmedAnswers);
	const currentIndex = useQuizStore((state) => state.currentIndex);
	const loadQuestions = useQuizStore((state) => state.loadQuestions);
	const answers = useQuizStore((state) => state.answers);
	const shuffleQuestions = useQuizStore((state) => state.shuffleQuestions);
	const isShuffled = useQuizStore((state) => state.isShuffled);
	const confirmAnswer = useQuizStore((state) => state.confirmAnswer);
	const nextQuestion = useQuizStore((state) => state.nextQuestion);
	const previousQuestion = useQuizStore((state) => state.previousQuestion);
	const isSubmitting = useQuizStore((state) => state.isSubmitting);

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const hasInitializedRef = useRef(false);

	const currentQuestion = questions[currentIndex] ?? null;
	const totalQuestions = questions.length;
	const progress =
		totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
	const isCurrentConfirmed = confirmedAnswers.has(currentIndex);
	const hasAnsweredCurrent = answers.has(currentIndex);
	const hasNextQuestion = currentIndex < totalQuestions - 1;
	const hasPreviousQuestion = currentIndex > 0;

	useEffect(() => {
		const initializeQuiz = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const response = await fetchWithRetry(async () => {
					const res = await fetch(QUESTIONS_API_URL);
					if (!res.ok) {
						throw new Error(`Failed to load: ${res.statusText}`);
					}
					return res;
				});

				const data: PaginatedQuestionsResponse = await response.json();

				// API returns camelCase format matching our shared QuizQuestion type
				loadQuestions(data.questions as QuizQuestion[]);

				// Shuffle questions if not already shuffled
				if (!isShuffled && !hasInitializedRef.current) {
					shuffleQuestions();
					hasInitializedRef.current = true;
				}
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to load quiz questions";
				setError(errorMessage);
				console.error("Failed to load quiz questions:", err);
			} finally {
				setIsLoading(false);
			}
		};

		initializeQuiz();
	}, [loadQuestions, isShuffled, shuffleQuestions]);

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ignore if typing in an input
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			// Submit: Enter or Cmd/Ctrl+Enter
			if ((e.key === "Enter" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) &&
				hasAnsweredCurrent &&
				!isCurrentConfirmed &&
				!isSubmitting) {
				e.preventDefault();
				confirmAnswer();
				return;
			}

			// Next: ArrowRight or Cmd/Ctrl+ArrowRight
			if ((e.key === "ArrowRight" || (e.key === "ArrowRight" && (e.metaKey || e.ctrlKey))) &&
				isCurrentConfirmed &&
				hasNextQuestion) {
				e.preventDefault();
				nextQuestion();
				return;
			}

			// Previous: ArrowLeft or Cmd/Ctrl+ArrowLeft
			if ((e.key === "ArrowLeft" || (e.key === "ArrowLeft" && (e.metaKey || e.ctrlKey))) &&
				isCurrentConfirmed &&
				hasPreviousQuestion) {
				e.preventDefault();
				previousQuestion();
				return;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [hasAnsweredCurrent, isCurrentConfirmed, hasNextQuestion, hasPreviousQuestion, isSubmitting, confirmAnswer, nextQuestion, previousQuestion]);

	if (isLoading) {
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

	if (error) {
		return (
			<div
				className="flex flex-col items-center justify-center min-h-[400px] gap-4"
				role="alert"
				aria-live="assertive"
			>
				<p className="text-red-400">Failed to load quiz: {error}</p>
				<button
					onClick={() => window.location.reload()}
					type="button"
					className="px-4 py-2 bg-neon-lime text-black rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Retry
				</button>
			</div>
		);
	}

	const hasNoQuestions = totalQuestions === 0;
	if (hasNoQuestions) {
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
		<div className="w-full max-w-3xl mx-auto p-6 pb-24 md:pb-6">
			<ProgressBar
				current={currentIndex + 1}
				total={totalQuestions}
				progress={progress}
			/>

			<div className="mt-8 space-y-6">
				<QuestionCard
					question={currentQuestion.title}
					questionType={currentQuestion.type}
				/>

				<OptionsList options={currentQuestion.options} questionType={currentQuestion.type} />

				{isCurrentConfirmed && <FeedbackCard question={currentQuestion} />}
			</div>

			{/* Unified Navigation Button */}
			<div
				className={cn(
					"fixed bottom-0 left-0 right-0 p-4 pb-safe bg-pitch-black border-t border-charcoal-grey md:static md:border-t-0 md:bg-transparent md:p-0 md:mt-6",
				)}
			>
				<div className="max-w-3xl mx-auto flex gap-3">
					{isCurrentConfirmed && hasPreviousQuestion && (
						<button
							onClick={previousQuestion}
							type="button"
							className="px-6 py-3 bg-gunmetal hover:bg-muted-ash text-porcelain rounded-buttons transition-colors focus:outline-none focus:ring-2 focus:ring-storm-cloud focus:ring-offset-2 focus:ring-offset-pitch-black disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gunmetal"
							aria-label="Previous question"
							disabled={isSubmitting}
						>
							Previous
						</button>
					)}

					{!isCurrentConfirmed && hasAnsweredCurrent && (
						<button
							onClick={confirmAnswer}
							type="button"
							disabled={isSubmitting}
							className="flex-1 px-6 py-3 bg-neon-lime hover:opacity-90 text-pitch-black font-w590 rounded-buttons transition-opacity focus:outline-none focus:ring-2 focus:ring-neon-lime focus:ring-offset-2 focus:ring-offset-pitch-black disabled:opacity-50 disabled:cursor-not-allowed"
							aria-label="Submit answer"
						>
							{isSubmitting ? "Validating..." : "Submit Answer"}
						</button>
					)}

					{isCurrentConfirmed && hasNextQuestion && (
						<button
							onClick={nextQuestion}
							type="button"
							className="flex-1 px-6 py-3 bg-neon-lime hover:opacity-90 text-pitch-black font-w590 rounded-buttons transition-opacity focus:outline-none focus:ring-2 focus:ring-neon-lime focus:ring-offset-2 focus:ring-offset-pitch-black disabled:opacity-50 disabled:cursor-not-allowed"
							aria-label="Next question"
							disabled={isSubmitting}
						>
							Next Question
						</button>
					)}
				</div>

				{/* Keyboard shortcuts hint */}
				<div className="max-w-3xl mx-auto mt-3 text-center md:hidden">
					<p className="text-xs text-storm-cloud">
						{!isCurrentConfirmed && hasAnsweredCurrent
							? "Press Enter to submit"
							: isCurrentConfirmed && hasNextQuestion
								? "Swipe or press → for next"
								: isCurrentConfirmed && hasPreviousQuestion
									? "Press ← for previous"
									: ""}
					</p>
				</div>
			</div>
		</div>
	);
}
