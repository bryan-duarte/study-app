"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useQuizStore } from "@/store/quizStore";

const STORAGE_KEY = "quiz-question-count";
const QUESTION_COUNTS = [10, 20, 30];
const DEFAULT_COUNT = 20;

export default function QuestionCountSelector() {
	const selectedCount = useQuizStore((state) => state.selectedQuestionCount);
	const setQuestionCount = useQuizStore((state) => state.setQuestionCount);
	const [mounted, setMounted] = useState(false);

	// Load from localStorage on mount
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const count = parseInt(stored, 10);
			if (QUESTION_COUNTS.includes(count)) {
				setQuestionCount(count);
			}
		}
		setMounted(true);
	}, [setQuestionCount]);

	const handleSelect = (count: number) => {
		setQuestionCount(count);
		localStorage.setItem(STORAGE_KEY, count.toString());
	};

	// Full-width segmented control on mobile, auto-width inline on >=sm
	const containerClasses =
		"flex w-full items-center gap-1 rounded-buttons border border-charcoal-grey bg-deep-slate/60 p-1 backdrop-blur-sm sm:inline-flex sm:w-auto";
	const buttonClasses = (isSelected: boolean) =>
		cn(
			"inline-flex h-11 flex-1 select-none items-center justify-center gap-1.5 rounded-badges px-3 text-body font-w590 transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-lime focus-visible:ring-offset-2 focus-visible:ring-offset-pitch-black sm:flex-none sm:min-w-[68px] sm:px-5",
			isSelected
				? "bg-neon-lime text-pitch-black shadow-[0_4px_14px_-4px_rgba(228,242,34,0.5)]"
				: "text-storm-cloud hover:bg-gunmetal/60 hover:text-porcelain",
		);

	// Don't render until mounted to avoid hydration mismatch
	if (!mounted) {
		return (
			<div className={containerClasses}>
				{QUESTION_COUNTS.map((count) => (
					<button
						key={count}
						disabled
						className="inline-flex h-11 flex-1 items-center justify-center rounded-badges px-3 text-body font-w590 text-fog-grey sm:flex-none sm:min-w-[68px] sm:px-5"
					>
						{count}
					</button>
				))}
			</div>
		);
	}

	return (
		<div className={containerClasses}>
			{QUESTION_COUNTS.map((count) => {
				const isSelected = count === selectedCount;
				return (
					<button
						key={count}
						onClick={() => handleSelect(count)}
						type="button"
						className={buttonClasses(isSelected)}
						aria-label={`${count} questions`}
						aria-pressed={isSelected}
					>
						{isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
						{count}
					</button>
				);
			})}
		</div>
	);
}
