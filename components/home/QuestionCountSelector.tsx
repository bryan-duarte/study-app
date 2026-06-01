"use client";

import { useEffect, useState } from "react";
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

	// Don't render until mounted to avoid hydration mismatch
	if (!mounted) {
		return (
			<div className="flex gap-3">
				{QUESTION_COUNTS.map((count) => (
					<button
						key={count}
						disabled
						className="h-10 w-16 rounded-buttons bg-gunmetal text-storm-cloud font-w590 text-body transition-colors disabled:opacity-50"
					>
						{count}
					</button>
				))}
			</div>
		);
	}

	return (
		<div className="flex gap-3">
			{QUESTION_COUNTS.map((count) => {
				const isSelected = count === selectedCount;
				return (
					<button
						key={count}
						onClick={() => handleSelect(count)}
						type="button"
						className={`h-10 w-16 rounded-buttons font-w590 text-body transition-opacity focus:outline-none focus:ring-2 focus:ring-neon-lime focus:ring-offset-2 focus:ring-offset-pitch-black ${
							isSelected
								? "bg-neon-lime text-pitch-black"
								: "bg-gunmetal text-storm-cloud hover:bg-muted-ash"
						}`}
						aria-label={`${count} questions`}
						aria-pressed={isSelected}
					>
						{count}
					</button>
				);
			})}
		</div>
	);
}
