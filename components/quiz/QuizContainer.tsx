"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { QuizQuestion } from "@/lib/transformers/question";
import { cn } from "@/lib/utils/cn";
import { useQuizStore } from "@/store/quizStore";
import FeedbackCard from "./FeedbackCard";
import OptionsList from "./OptionsList";
import ProgressBar from "./ProgressBar";
import QuestionCard from "./QuestionCard";

const SESSION_QUESTIONS_COUNT = 25;

export default function QuizContainer() {
	const router = useRouter();
	const questions = useQuizStore((state) => state.questions);
	const confirmedAnswers = useQuizStore((state) => state.confirmedAnswers);
	const currentIndex = useQuizStore((state) => state.currentIndex);
	const loadSessionQuestions = useQuizStore((state) => state.loadSessionQuestions);
	const answers = useQuizStore((state) => state.answers);
	const confirmAnswer = useQuizStore((state) => state.confirmAnswer);
	const nextQuestion = useQuizStore((state) => state.nextQuestion);
	const previousQuestion = useQuizStore((state) => state.previousQuestion);
	const isSubmitting = useQuizStore((state) => state.isSubmitting);
	// Subscribe to session.currentSessionData to ensure reactivity when answeredAt changes
	const currentSessionData = useQuizStore((state) => state.session.currentSessionData);
	const sessionProgress = useQuizStore((state) => state.sessionProgress);
	const sessionRemaining = useQuizStore((state) => state.sessionRemaining);
	const isSessionComplete = useQuizStore((state) => state.isSessionComplete);
	const session = useQuizStore((state) => state.session);

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isValidating, setIsValidating] = useState(false);
	const hasInitializedRef = useRef(false);

	const currentQuestion = questions[currentIndex] ?? null;
	const totalQuestions = questions.length;
	const progress =
		totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
	const isCurrentConfirmed = confirmedAnswers.has(currentIndex);
	const hasAnsweredCurrent = answers.has(currentIndex);
	const hasNextQuestion = currentIndex < totalQuestions - 1;
	const hasPreviousQuestion = currentIndex > 0;
	// Check if the current answer has been validated by the server (has answeredAt timestamp)
	const isCurrentValidated = currentSessionData?.questions[currentIndex]?.answeredAt;

	const handleConfirmAnswer = async () => {
		setIsValidating(true);
		await confirmAnswer();
		// Clear validating state after a short delay to ensure server response is processed
		setTimeout(() => setIsValidating(false), 100);
	};

	// Initialize quiz session and load questions
	useEffect(() => {
		const initializeQuiz = async () => {
			setIsLoading(true);
			setError(null);

			try {
				// Load session questions (this will call startSession internally)
				// Pass undefined for userId to let the backend handle guest users
				await loadSessionQuestions(undefined);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to load quiz questions";
				setError(errorMessage);
				console.error("Failed to load quiz questions:", err);
			} finally {
				setIsLoading(false);
			}
		};

		if (!hasInitializedRef.current) {
			initializeQuiz();
			hasInitializedRef.current = true;
		}
	}, [loadSessionQuestions]);

	// Redirect to results when session is complete
	useEffect(() => {
		if (isSessionComplete && isLoading === false) {
			router.push("/quiz/results");
		}
	}, [isSessionComplete, isLoading, router]);

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
				!isSubmitting &&
				!isValidating) {
				e.preventDefault();
				handleConfirmAnswer();
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
	}, [hasAnsweredCurrent, isCurrentConfirmed, hasNextQuestion, hasPreviousQuestion, isSubmitting, isValidating, confirmAnswer, nextQuestion, previousQuestion]);

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
		// Check if questions are exhausted
		if (session.isQuestionExhausted) {
			return (
				<div
					className="flex items-center justify-center min-h-[400px]"
					role="status"
					aria-live="polite"
				>
					<div className="text-center">
						<p className="text-heading font-w590 text-warning-red mb-2">
							Questions Exhausted
						</p>
						<p className="text-body text-storm-cloud">
							You've answered all available questions. Check back later for new content!
						</p>
					</div>
				</div>
			);
		}

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

	const sessionTotal = currentSessionData?.questions.length ?? SESSION_QUESTIONS_COUNT;

	return (
		<div className="w-full max-w-3xl mx-auto p-6 pb-24 md:pb-6">
			{/* Live region for announcing answer feedback */}
			<div aria-live="polite" aria-atomic="true" className="sr-only">
				{isCurrentConfirmed ? "Answer submitted" : ""}
			</div>

			<ProgressBar
				current={currentIndex + 1}
				total={totalQuestions}
				progress={progress}
				sessionProgress={sessionProgress}
				sessionTotal={sessionTotal}
			/>

			<div className="mt-8 space-y-6">
				<QuestionCard
					question={currentQuestion.title}
					questionType={currentQuestion.type}
				/>

				<OptionsList options={currentQuestion.options} questionType={currentQuestion.type} />

				{/* Show feedback skeleton while validating, show full feedback when validated */}
				{isCurrentConfirmed && (
					isCurrentValidated ? (
						<FeedbackCard question={currentQuestion} />
					) : (
						<div
							className="border-l-4 border-fog-grey bg-deep-slate p-6 rounded-cards shadow-subtle animate-pulse"
							role="status"
							aria-live="polite"
						>
							<p className="text-body text-fog-grey">Validating your answer...</p>
						</div>
					)
				)}
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
							disabled={isSubmitting || isValidating}
						>
							Previous
						</button>
					)}

					{!isCurrentConfirmed && hasAnsweredCurrent && (
						<button
							onClick={handleConfirmAnswer}
							type="button"
							disabled={isSubmitting || isValidating}
							className="flex-1 px-6 py-3 bg-neon-lime hover:opacity-90 text-pitch-black font-w590 rounded-buttons transition-opacity focus:outline-none focus:ring-2 focus:ring-neon-lime focus:ring-offset-2 focus:ring-offset-pitch-black disabled:opacity-50 disabled:cursor-not-allowed"
							aria-label="Submit answer"
						>
							{isSubmitting || isValidating ? "Validating..." : "Submit Answer"}
						</button>
					)}

					{isCurrentConfirmed && hasNextQuestion && (
						<button
							onClick={nextQuestion}
							type="button"
							className="flex-1 px-6 py-3 bg-neon-lime hover:opacity-90 text-pitch-black font-w590 rounded-buttons transition-opacity focus:outline-none focus:ring-2 focus:ring-neon-lime focus:ring-offset-2 focus:ring-offset-pitch-black disabled:opacity-50 disabled:cursor-not-allowed"
							aria-label="Next question"
							disabled={isSubmitting || isValidating}
						>
							Next Question
						</button>
					)}

					{isCurrentConfirmed && !hasNextQuestion && (
						<button
							onClick={() => router.push("/quiz/results")}
							type="button"
							className="flex-1 px-6 py-3 bg-neon-lime hover:opacity-90 text-pitch-black font-w590 rounded-buttons transition-opacity focus:outline-none focus:ring-2 focus:ring-neon-lime focus:ring-offset-2 focus:ring-offset-pitch-black disabled:opacity-50 disabled:cursor-not-allowed"
							aria-label="View results"
						>
							View Results
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
