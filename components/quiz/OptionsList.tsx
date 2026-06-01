"use client";

import type { QuizOption } from "@/lib/transformers/question";
import { useQuizStore } from "@/store/quizStore";
import OptionItem from "./OptionItem";

interface OptionsListProps {
	options: QuizOption[];
}

export default function OptionsList({ options }: OptionsListProps) {
	const currentSelectedOption = useQuizStore((state) => {
		const currentIndex = state.currentIndex;
		return state.answers.get(currentIndex);
	});
	const isCurrentConfirmed = useQuizStore((state) => state.isCurrentConfirmed);
	const selectOption = useQuizStore((state) => state.selectOption);

	const hasOptions = options.length > 0;
	if (!hasOptions) {
		return null;
	}

	return (
		<div className="space-y-4">
			<div className="space-y-3" role="radiogroup" aria-label="Answer options">
				{options.map((option, index) => {
					const isSelected = currentSelectedOption === index;
					const showResult = isCurrentConfirmed;
					const isCorrect = option.isCorrect;

					return (
						<OptionItem
							key={index}
							index={index}
							description={option.description}
							isSelected={isSelected}
							showResult={showResult}
							isCorrect={isCorrect}
							onSelect={() => selectOption(index)}
							disabled={isCurrentConfirmed}
						/>
					);
				})}
			</div>
		</div>
	);
}
