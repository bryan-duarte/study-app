"use client";

import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import type { QuizQuestion } from "@/lib/transformers/question";
import { useQuizStore } from "@/store/quizStore";

interface FeedbackCardProps {
	question: QuizQuestion;
}

export default function FeedbackCard({ question }: FeedbackCardProps) {
	const currentSelectedOption = useQuizStore((state) => {
		const idx = state.currentIndex;
		return state.answers.get(idx);
	});

	const hasValidSelection =
		currentSelectedOption !== null &&
		currentSelectedOption !== undefined &&
		currentSelectedOption >= 0;
	const selectedOption = hasValidSelection
		? (question.options[currentSelectedOption] ?? null)
		: null;
	const isCorrect = selectedOption?.isCorrect ?? false;

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

			{selectedOption?.reasoning && (
				<div className="mt-4 text-light-steel">
					<MarkdownRenderer content={selectedOption.reasoning} />
				</div>
			)}
		</div>
	);
}
