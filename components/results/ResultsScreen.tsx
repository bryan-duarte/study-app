"use client";

import { Button } from "@/components/ui/Button";
import { useQuizStore } from "@/store/quizStore";
import MistakesList from "./MistakesList";

const PERFECT_SCORE_EMOJI = "Perfect score!";
const PERFECT_SCORE_SUBTEXT = "You got all questions correct.";
const MISTAKES_SECTION_TITLE = "Review Your Mistakes";
const QUIZ_COMPLETE_TITLE = "Session Complete!";
const SESSION_QUESTIONS_COUNT = 25;

export default function ResultsScreen() {
	const {
		questions,
		confirmedAnswers,
		resetQuiz,
		sessionsCompleted,
		totalUniqueQuestionsAnswered,
		session,
		answeredQuestionIds,
	} = useQuizStore();

	const sessionMetrics = session.sessionMetrics;
	const currentSessionData = session.currentSessionData;

	// Authoritative source: the session's questions with their server-validated
	// isCorrect flags (refreshed by handleSessionComplete). Deriving the summary
	// from this keeps the percentage and "X of Y correct" in sync with the
	// metric tiles below — the store's correctCount getter diverges from it.
	const sessionQuestions = currentSessionData?.questions ?? [];
	const totalQuestions = sessionQuestions.length || questions.length;
	const correctAnswers = sessionQuestions.filter((q) => q.isCorrect).length;
	const percentage =
		totalQuestions > 0
			? Math.round((correctAnswers / totalQuestions) * 100)
			: 0;

	// The session is only complete when every question is answered, so the
	// answered count equals the session length (this drives the "Incorrect" tile).
	const questionsAnswered = sessionQuestions.length || questions.length;
	const sessionCorrectCount = correctAnswers;

	const totalUniqueAnswered = sessionMetrics?.totalUniqueQuestionsAnswered ?? totalUniqueQuestionsAnswered;
	const totalAvailable = currentSessionData?.totalAvailableQuestions ?? (65 - answeredQuestionIds.size);

	const mistakes = Array.from(confirmedAnswers.entries())
		.filter(([questionIndex, selectedAnswer]) => {
			const question = questions[questionIndex];
			if (!question) return false;

			const isMultiSelect = question.type === "multi-option";

			if (isMultiSelect) {
				const selectedIndices = Array.isArray(selectedAnswer)
					? selectedAnswer
					: [];
				const correctOptionIndices = question.options
					.map((opt, idx) => (opt.isCorrect ? idx : -1))
					.filter((idx) => idx !== -1);

				const allCorrectSelected = correctOptionIndices.every((idx) =>
					selectedIndices.includes(idx),
				);
				const noIncorrectSelected = selectedIndices.every((idx) =>
					correctOptionIndices.includes(idx),
				);
				return !(allCorrectSelected && noIncorrectSelected && selectedIndices.length > 0);
			} else {
				const selectedOptionIndex =
					typeof selectedAnswer === "number" ? selectedAnswer : selectedAnswer[0];
				const selectedOption = question.options[selectedOptionIndex];
				return selectedOption?.isCorrect === false;
			}
		})
		.map(([questionIndex]) => questionIndex);

	const hasNoMistakes = mistakes.length === 0;
	const isQuestionExhausted = session.isQuestionExhausted || totalAvailable === 0;
	const hasQuestionsRemaining = totalAvailable > 0;

	const handleBackToHome = () => {
		resetQuiz();
		window.location.href = "/";
	};

	const handleTryAgain = () => {
		resetQuiz();
		window.location.href = "/quiz";
	};

	const metrics = [
		{ label: "Correct", value: sessionCorrectCount, color: "text-emerald" },
		{
			label: "Incorrect",
			value: questionsAnswered - sessionCorrectCount,
			color: "text-warning-red",
		},
		{ label: "Unique", value: totalUniqueAnswered, color: "text-neon-lime" },
		{
			label: "Sessions",
			value: sessionsCompleted + 1,
			color: "text-light-steel",
		},
	];

	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 md:px-6">
			{/* Session Summary Card */}
			<div className="animate-fade-in-up relative overflow-hidden rounded-cards border border-charcoal-grey/70 bg-graphite/80 p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm sm:p-8">

				<div className="relative">
					<p className="mb-3 text-caption font-w510 uppercase tracking-[0.16em] text-fog-grey">
						Quiz Results
					</p>
					<h1 className="text-heading font-w590 text-porcelain mb-6">
						{QUIZ_COMPLETE_TITLE}
					</h1>

					<div className="animate-scale-in mb-2 inline-flex items-baseline gap-1">
						<span className="text-[clamp(3.5rem,12vw,5.5rem)] font-light leading-none text-neon-lime">
							{percentage}
						</span>
						<span className="text-2xl font-w510 text-neon-lime/70">%</span>
					</div>

					<p className="text-body text-storm-cloud mb-6">
						{correctAnswers} of {totalQuestions} correct
					</p>

					{/* Session Metrics */}
					<div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
						{metrics.map((m, i) => (
							<div
								key={m.label}
								className="animate-fade-in-up rounded-cards border border-charcoal-grey/60 bg-deep-slate/70 p-3 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-muted-ash"
								style={{ animationDelay: `${120 + i * 60}ms` }}
							>
								<div className={`text-heading font-w590 mb-1 ${m.color}`}>
									{m.value}
								</div>
								<div className="text-caption text-storm-cloud">{m.label}</div>
							</div>
						))}
					</div>

					<div className="flex flex-wrap justify-center gap-3">
						<Button onClick={handleBackToHome} variant="primary">
							Back to Home
						</Button>
						{!hasNoMistakes && (
							<Button
								onClick={() =>
									document
										.getElementById("mistakes")
										?.scrollIntoView({ behavior: "smooth" })
								}
								variant="secondary"
							>
								Review Mistakes
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* Question Exhaustion Banner */}
			{isQuestionExhausted && (
				<div className="rounded-cards border border-warning-red/30 bg-warning-red/[0.08] p-4 backdrop-blur-sm">
					<div className="flex items-start gap-3">
						<div className="text-2xl text-warning-red" aria-hidden="true">
							⚠
						</div>
						<div>
							<h3 className="text-body font-w590 text-warning-red mb-1">
								Questions Exhausted
							</h3>
							<p className="text-caption text-storm-cloud">
								You've answered all {totalUniqueAnswered} available questions.
								Check back later for new content!
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Questions Remaining Warning */}
			{!isQuestionExhausted && hasQuestionsRemaining && totalAvailable < 10 && (
				<div className="rounded-cards border border-emerald/30 bg-emerald/[0.06] p-4 backdrop-blur-sm">
					<div className="flex items-start gap-3">
						<div className="text-2xl text-emerald" aria-hidden="true">
							ℹ
						</div>
						<div>
							<h3 className="text-body font-w590 text-emerald mb-1">
								Few Questions Remaining
							</h3>
							<p className="text-caption text-storm-cloud">
								You've answered {totalUniqueAnswered} questions. {totalAvailable} new questions remaining.
							</p>
						</div>
					</div>
				</div>
			)}

			{hasNoMistakes ? (
				<div className="animate-fade-in-up rounded-cards border border-emerald/30 bg-emerald/[0.06] py-10 text-center backdrop-blur-sm">
					<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald/20 text-emerald">
						<svg
							className="h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							strokeWidth="2.5"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<p className="text-body font-w510 text-porcelain">
						{PERFECT_SCORE_EMOJI}
					</p>
					<p className="text-caption text-storm-cloud">
						{PERFECT_SCORE_SUBTEXT}
					</p>
				</div>
			) : (
				<div id="mistakes" className="animate-fade-in-up scroll-mt-6">
					<h2 className="text-heading font-w510 text-porcelain mb-4">
						{MISTAKES_SECTION_TITLE}
					</h2>
					<MistakesList mistakes={mistakes} />
				</div>
			)}
		</div>
	);
}
