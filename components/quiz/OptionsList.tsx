"use client";

import type { QuizOption } from "@/lib/transformers/question";
import { useQuizStore } from "@/store/quizStore";
import OptionItem from "./OptionItem";

interface OptionsListProps {
	options: QuizOption[];
	questionType?: "single-option" | "multi-option";
}

export default function OptionsList({ options, questionType }: OptionsListProps) {
	const currentSelectedOption = useQuizStore((state) => {
		const currentIndex = state.currentIndex;
		return state.answers.get(currentIndex);
	});
	const confirmedAnswers = useQuizStore((state) => {
		const currentIndex = state.currentIndex;
		return state.confirmedAnswers.get(currentIndex);
	});
	const isCurrentConfirmed = useQuizStore((state) => state.isCurrentConfirmed);
	const selectOption = useQuizStore((state) => state.selectOption);

	const isMultiSelect = questionType === "multi-option";
	const selectedIndices = Array.isArray(currentSelectedOption)
		? currentSelectedOption
		: currentSelectedOption !== undefined
			? [currentSelectedOption]
			: [];

	const hasOptions = options.length > 0;
	if (!hasOptions) {
		return null;
	}

	return (
		<div className="space-y-4">
			<div
				className="space-y-3"
				role={isMultiSelect ? "group" : "radiogroup"}
				aria-label="Answer options"
			>
				{options.map((option, index) => {
					const isSelected = selectedIndices.includes(index);
					const showResult = isCurrentConfirmed;
					const isCorrect = option.isCorrect;

					// For multi-select, show correct options when confirmed
					const shouldShowCorrect = showResult && isCorrect && isMultiSelect;

					return (
						<OptionItem
							key={index}
							index={index}
							description={option.description}
							isSelected={isSelected}
							showResult={showResult}
							isCorrect={isCorrect}
							shouldShowCorrect={shouldShowCorrect}
							onSelect={() => selectOption(index)}
							disabled={isCurrentConfirmed}
							isMultiSelect={isMultiSelect}
						/>
					);
				})}
			</div>
		</div>
	);
}
