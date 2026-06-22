"use client";

import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import type { QuizQuestion } from "@/lib/transformers/question";
import { useQuizStore } from "@/store/quizStore";

interface FeedbackCardProps {
	question: QuizQuestion;
}

export default function FeedbackCard({ question }: FeedbackCardProps) {
	// Get the current index and session data
	const currentIndex = useQuizStore((state) => state.currentIndex);
	const sessionQuestionData = useQuizStore(
		(state) => state.session.currentSessionData?.questions[currentIndex],
	);
	const currentSelectedAnswer = useQuizStore((state) =>
		state.answers.get(currentIndex),
	);

	const isMultiSelect = question.type === "multi-option";

	let isCorrect = false;
	let selectedOptions: typeof question.options = [];
	let correctOptions: typeof question.options = [];

	// Use server-validated isCorrect when available, otherwise compute locally
	if (sessionQuestionData?.answeredAt && sessionQuestionData.isCorrect !== undefined) {
		// Server has validated this answer - use the server's isCorrect value
		isCorrect = sessionQuestionData.isCorrect;

		// Still need to determine which options were selected for display
		if (isMultiSelect) {
			const selectedIndices = Array.isArray(currentSelectedAnswer)
				? currentSelectedAnswer
				: [];
			selectedOptions = selectedIndices
				.map((i) => question.options[i] ?? null)
				.filter(Boolean);
		} else {
			const hasValidSelection =
				typeof currentSelectedAnswer === "number" &&
				currentSelectedAnswer >= 0;
			const selectedOption = hasValidSelection
				? (question.options[currentSelectedAnswer] ?? null)
				: null;
			selectedOptions = selectedOption ? [selectedOption] : [];
		}
		correctOptions = question.options.filter((opt) => opt.isCorrect);
	} else {
		// No server validation yet - compute locally (fallback)
		if (isMultiSelect) {
			const selectedIndices = Array.isArray(currentSelectedAnswer)
				? currentSelectedAnswer
				: [];
			selectedOptions = selectedIndices
				.map((i) => question.options[i] ?? null)
				.filter(Boolean);
			correctOptions = question.options.filter((opt) => opt.isCorrect);

			const allCorrectSelected = correctOptions.every((correctOpt) =>
				selectedOptions.some(
					(selected) => selected?.description === correctOpt.description,
				),
			);
			const noIncorrectSelected = selectedOptions.every((selected) =>
				correctOptions.some(
					(correct) => correct.description === selected?.description,
				),
			);
			isCorrect =
				allCorrectSelected && noIncorrectSelected && selectedOptions.length > 0;
		} else {
			const hasValidSelection =
				typeof currentSelectedAnswer === "number" &&
				currentSelectedAnswer >= 0;
			const selectedOption = hasValidSelection
				? (question.options[currentSelectedAnswer] ?? null)
				: null;
			isCorrect = selectedOption?.isCorrect ?? false;
			selectedOptions = selectedOption ? [selectedOption] : [];
			correctOptions = question.options.filter((opt) => opt.isCorrect);
		}
	}

	return (
		<div
			className={`animate-slide-down overflow-hidden rounded-cards border-l-[3px] bg-deep-slate/80 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm ${
				isCorrect ? "border-l-emerald" : "border-l-warning-red"
			}`}
			role="region"
			aria-label="Answer feedback"
		>
			<div className="mb-3 flex items-center gap-2">
				<span
					className={`flex h-6 w-6 items-center justify-center rounded-full ${
						isCorrect
							? "bg-emerald/20 text-emerald"
							: "bg-warning-red/20 text-warning-red"
					}`}
					aria-hidden
				>
					{isCorrect ? (
						<svg
							className="h-3.5 w-3.5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							strokeWidth="3"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					) : (
						<svg
							className="h-3.5 w-3.5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							strokeWidth="3"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					)}
				</span>
				<h3
					className={`text-body font-w590 ${
						isCorrect ? "text-emerald" : "text-warning-red"
					}`}
				>
					{isCorrect ? "Correct!" : "Not quite"}
				</h3>
			</div>

			{selectedOptions.length > 0 && (
				<div className="mt-2 text-light-steel">
					{selectedOptions.map((opt) =>
						opt?.reasoning ? (
							<MarkdownRenderer key={opt.description} content={opt.reasoning} />
						) : null,
					)}
				</div>
			)}
		</div>
	);
}
