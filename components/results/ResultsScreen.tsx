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
		correctCount,
		sessionsCompleted,
		totalUniqueQuestionsAnswered,
		session,
		answeredQuestionIds,
	} = useQuizStore();

	const sessionMetrics = session.sessionMetrics;

	const totalQuestions = questions.length;
	const correctAnswers = correctCount;
	const incorrectAnswers = totalQuestions - correctCount;
	const percentage =
		totalQuestions > 0
			? Math.round((correctAnswers / totalQuestions) * 100)
			: 0;

	// Use session metrics if available, otherwise use current session data
	const currentSessionData = session.currentSessionData;
	const questionsAnswered = currentSessionData?.questions.length ?? totalQuestions;

	// Calculate correct count from session data if available
	let sessionCorrectCount = correctCount;
	if (currentSessionData) {
		sessionCorrectCount = currentSessionData.questions.filter((q) => q.isCorrect).length;
	}

	const totalUniqueAnswered = sessionMetrics?.totalUniqueQuestionsAnswered ?? totalUniqueQuestionsAnswered;
	const exhaustedCount = currentSessionData?.exhaustedCount ?? answeredQuestionIds.size;
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

	const handleStartNewSession = async () => {
		resetQuiz();
		window.location.href = "/quiz";
	};

	const handleTryAgain = () => {
		resetQuiz();
		window.location.href = "/quiz";
	};

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6 max-w-3xl mx-auto">
			{/* Session Summary Card */}
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

				{/* Session Metrics */}
				<div className="grid grid-cols-2 gap-4 mb-6">
					<div className="bg-deep-slate rounded p-3">
						<div className="text-body font-w590 text-emerald mb-1">
							{sessionCorrectCount}
						</div>
						<div className="text-caption text-storm-cloud">Correct</div>
					</div>
					<div className="bg-deep-slate rounded p-3">
						<div className="text-body font-w590 text-warning-red mb-1">
							{questionsAnswered - sessionCorrectCount}
						</div>
						<div className="text-caption text-storm-cloud">Incorrect</div>
					</div>
					<div className="bg-deep-slate rounded p-3">
						<div className="text-body font-w590 text-neon-lime mb-1">
							{totalUniqueAnswered}
						</div>
						<div className="text-caption text-storm-cloud">
							Unique Questions
						</div>
					</div>
					<div className="bg-deep-slate rounded p-3">
						<div className="text-body font-w590 text-fog-grey mb-1">
							{sessionsCompleted + 1}
						</div>
						<div className="text-caption text-storm-cloud">Sessions</div>
					</div>
				</div>

				<div className="flex gap-3 justify-center">
					<Button onClick={handleStartNewSession} variant="primary">
						Start New Session
					</Button>
					{!hasNoMistakes && (
						<Button onClick={() => {/* Scroll to mistakes */}} variant="secondary">
							Review Mistakes
						</Button>
					)}
				</div>
			</div>

			{/* Question Exhaustion Banner */}
			{isQuestionExhausted && (
				<div className="bg-warning-red/10 border border-warning-red/30 rounded-cards p-4">
					<div className="flex items-start gap-3">
						<div className="text-warning-red text-2xl" aria-hidden="true">
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
				<div className="bg-emerald/10 border border-emerald/30 rounded-cards p-4">
					<div className="flex items-start gap-3">
						<div className="text-emerald text-2xl" aria-hidden="true">
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
