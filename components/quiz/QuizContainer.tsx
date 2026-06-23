"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { QuizQuestion } from "@/lib/transformers/question";
import { cn } from "@/lib/utils/cn";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
	const selectedQuestionCount = useQuizStore((state) => state.selectedQuestionCount);
	const stopSession = useQuizStore((state) => state.stopSession);

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isValidating, setIsValidating] = useState(false);
	const [isStopOpen, setIsStopOpen] = useState(false);
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

	const handleStopConfirm = () => {
		setIsStopOpen(false);
		stopSession();
		router.push("/");
	};

	// Initialize quiz session and load questions
	useEffect(() => {
		const initializeQuiz = async () => {
			setIsLoading(true);
			setError(null);

			try {
				// Load session questions (this will call startSession internally)
				// Pass undefined for userId and use the selected question count
				await loadSessionQuestions(undefined, selectedQuestionCount);
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
	}, [loadSessionQuestions, selectedQuestionCount]);

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
				className="mx-auto w-full max-w-3xl p-6 pb-24 md:pb-6"
				role="status"
				aria-live="polite"
			>
				{/* Progress skeleton */}
				<div className="mb-2 flex justify-between">
					<div className="h-3 w-24 rounded-full bg-deep-slate" />
					<div className="h-3 w-16 rounded-full bg-deep-slate" />
				</div>
				<div className="shimmer mb-8 h-1.5 w-full rounded-full bg-deep-slate" />

				{/* Question skeleton */}
				<div className="mb-6 rounded-cards border border-charcoal-grey/60 bg-graphite/60 p-6">
					<div className="mb-3 h-5 w-24 rounded-badges bg-charcoal-grey" />
					<div className="mb-3 h-4 w-3/4 rounded bg-deep-slate" />
					<div className="mb-3 h-4 w-2/3 rounded bg-deep-slate" />
					<div className="h-4 w-1/2 rounded bg-deep-slate" />
				</div>

				{/* Options skeleton */}
				<div className="space-y-3">
					{[0, 1, 2, 3].map((i) => (
						<div
							key={i}
							className="flex items-center gap-3 rounded-cards border border-charcoal-grey/50 bg-deep-slate/50 p-4"
						>
							<div className="h-6 w-6 rounded-badges bg-charcoal-grey" />
							<div className="h-4 flex-1 rounded bg-charcoal-grey/60" />
						</div>
					))}
				</div>
				<span className="sr-only">Loading quiz…</span>
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
				<p className="text-warning-red">Failed to load quiz: {error}</p>
				<button
					onClick={() => window.location.reload()}
					type="button"
					className="rounded-buttons bg-neon-lime px-4 py-2 text-pitch-black shadow-[inset_0_2.5px_0_-2px_rgba(255,255,255,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-[1.05]"
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
			{/* Stop session control */}
			<div className="mb-3 flex justify-end">
				<button
					onClick={() => setIsStopOpen(true)}
					type="button"
					className="inline-flex items-center gap-1.5 rounded-buttons px-3 py-1.5 text-caption font-w510 text-storm-cloud transition-colors hover:bg-deep-slate/60 hover:text-warning-red focus:outline-none focus-visible:ring-2 focus-visible:ring-storm-cloud focus-visible:ring-offset-2 focus-visible:ring-offset-pitch-black"
					aria-label="Stop session"
				>
					<X className="h-4 w-4" strokeWidth={2} />
					Stop
				</button>
			</div>

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

			<div key={currentIndex} className="mt-8 space-y-6 animate-fade-in-up">
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
							className="animate-slide-down flex items-center gap-3 rounded-cards border-l-[3px] border-l-fog-grey bg-deep-slate/80 p-6 backdrop-blur-sm"
							role="status"
							aria-live="polite"
						>
							<span className="h-4 w-4 animate-spin rounded-full border-2 border-fog-grey border-t-light-steel" />
							<p className="text-body text-storm-cloud">Validating your answer…</p>
						</div>
					)
				)}
			</div>

			{/* Unified Navigation Button */}
			<div
				className={cn(
					"fixed bottom-0 left-0 right-0 border-t border-charcoal-grey bg-pitch-black/80 p-4 pb-safe backdrop-blur-xl md:static md:border-t-0 md:bg-transparent md:p-0 md:mt-6 md:backdrop-blur-none",
				)}
			>
				<div className="max-w-3xl mx-auto flex gap-3">
					{isCurrentConfirmed && hasPreviousQuestion && (
						<button
							onClick={previousQuestion}
							type="button"
							className="px-6 py-3.5 rounded-buttons border border-charcoal-grey bg-gunmetal text-porcelain transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-muted-ash hover:border-muted-ash focus:outline-none focus-visible:ring-2 focus-visible:ring-storm-cloud focus-visible:ring-offset-2 focus-visible:ring-offset-pitch-black disabled:pointer-events-none disabled:opacity-50"
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
							className="flex-1 px-6 py-3.5 rounded-buttons bg-neon-lime text-pitch-black font-w590 transition-all duration-200 ease-out shadow-[inset_0_2.5px_0_-2px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 hover:brightness-[1.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-lime focus-visible:ring-offset-2 focus-visible:ring-offset-pitch-black disabled:pointer-events-none disabled:opacity-50"
							aria-label="Submit answer"
						>
							{isSubmitting || isValidating ? "Validating…" : "Submit Answer"}
						</button>
					)}

					{isCurrentConfirmed && hasNextQuestion && (
						<button
							onClick={nextQuestion}
							type="button"
							className="flex-1 px-6 py-3.5 rounded-buttons bg-neon-lime text-pitch-black font-w590 transition-all duration-200 ease-out shadow-[inset_0_2.5px_0_-2px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 hover:brightness-[1.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-lime focus-visible:ring-offset-2 focus-visible:ring-offset-pitch-black disabled:pointer-events-none disabled:opacity-50"
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
							className="flex-1 px-6 py-3.5 rounded-buttons bg-neon-lime text-pitch-black font-w590 transition-all duration-200 ease-out shadow-[inset_0_2.5px_0_-2px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 hover:brightness-[1.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-lime focus-visible:ring-offset-2 focus-visible:ring-offset-pitch-black disabled:pointer-events-none disabled:opacity-50"
							aria-label="View results"
						>
							View Results
						</button>
					)}
				</div>

				{/* Keyboard shortcuts hint (desktop only — mobile has no keyboard) */}
				<div className="max-w-3xl mx-auto mt-3 hidden text-center md:block">
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

			<ConfirmDialog
				open={isStopOpen}
				title="Stop session?"
				description="Your progress on this session won't be saved as complete. Answers you've already submitted will be kept."
				confirmLabel="Stop session"
				cancelLabel="Keep going"
				destructive
				onConfirm={handleStopConfirm}
				onCancel={() => setIsStopOpen(false)}
			/>
		</div>
	);
}
