"use client";

import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import type { QuizQuestion } from "@/lib/transformers/question";
import { useQuizStore } from "@/store/quizStore";

interface FeedbackCardProps {
	question: QuizQuestion;
}

export default function FeedbackCard({ question }: FeedbackCardProps) {
	const currentSelectedAnswer = useQuizStore((state) => {
		const idx = state.currentIndex;
		return state.answers.get(idx);
	});

	const isMultiSelect = question.type === "multi-option";

	let isCorrect = false;
	let selectedOptions: typeof question.options = [];
	let correctOptions: typeof question.options = [];

	if (isMultiSelect) {
		const selectedIndices = Array.isArray(currentSelectedAnswer)
			? currentSelectedAnswer
			: [];
		selectedOptions = selectedIndices.map(
			(i) => question.options[i] ?? null,
		).filter(Boolean);
		correctOptions = question.options.filter((opt) => opt.isCorrect);

		const allCorrectSelected = correctOptions.every((correctOpt) =>
			selectedOptions.some((selected) => selected?.description === correctOpt.description),
		);
		const noIncorrectSelected = selectedOptions.every((selected) =>
			correctOptions.some((correct) => correct.description === selected?.description),
		);
		isCorrect = allCorrectSelected && noIncorrectSelected && selectedOptions.length > 0;
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

	const feedbackTitle = isCorrect ? "Correct!" : "Incorrect";

	return (
		<div
			className={`border-l-4 ${isCorrect ? "border-emerald" : "border-warning-red"} bg-deep-slate p-6 rounded-cards shadow-subtle`}
			role="region"
			aria-label="Answer feedback"
		>
			<h3
				className={`font-w590 mb-3 text-body ${isCorrect ? "text-emerald" : "text-warning-red"}`}
			>
				{feedbackTitle}
			</h3>

			{selectedOptions.length > 0 && (
				<div className="mt-4 text-light-steel">
					{selectedOptions.map((opt) => (
						opt?.reasoning && (
							<MarkdownRenderer key={opt.description} content={opt.reasoning} />
						)
					))}
				</div>
			)}
		</div>
	);
}
