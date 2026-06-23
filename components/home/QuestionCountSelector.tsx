"use client";

import { useEffect, useState } from "react";
import { Hash } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useQuizStore } from "@/store/quizStore";

const STORAGE_KEY = "quiz-question-count";
const QUESTION_COUNTS = [10, 20, 30];

/**
 * Compact, label-less session-size control. The descriptive copy ("Questions
 * per session…") is intentionally dropped — a leading hash glyph carries the
 * meaning, and the value applies to every study mode launched below it.
 *
 * Single source of truth: the Zustand `selectedQuestionCount` + the
 * `quiz-question-count` localStorage key that the modes read at launch.
 */
export default function QuestionCountSelector() {
	const selectedCount = useQuizStore((state) => state.selectedQuestionCount);
	const setQuestionCount = useQuizStore((state) => state.setQuestionCount);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const count = parseInt(stored, 10);
			if (QUESTION_COUNTS.includes(count)) setQuestionCount(count);
		}
		setMounted(true);
	}, [setQuestionCount]);

	const handleSelect = (count: number) => {
		setQuestionCount(count);
		localStorage.setItem(STORAGE_KEY, count.toString());
	};

	return (
		<div
			role="radiogroup"
			aria-label="Questions per session"
			className="inline-flex items-center gap-1 rounded-pill border border-charcoal-grey bg-deep-slate/60 p-1 pl-2.5 backdrop-blur-sm"
		>
			<Hash
				className="mr-0.5 h-3.5 w-3.5 flex-shrink-0 text-storm-cloud"
				strokeWidth={2.5}
				aria-hidden
			/>
			{QUESTION_COUNTS.map((count) => {
				const isSelected = mounted && count === selectedCount;
				return (
					<button
						key={count}
						type="button"
						role="radio"
						aria-checked={isSelected}
						aria-label={`${count} questions per session`}
						onClick={() => handleSelect(count)}
						className={cn(
							"flex h-9 min-w-[44px] select-none items-center justify-center rounded-pill px-2.5 text-body font-w590 transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-lime focus-visible:ring-offset-2 focus-visible:ring-offset-pitch-black",
							isSelected
								? "bg-neon-lime text-pitch-black shadow-[inset_0_2.5px_0_-2px_rgba(255,255,255,0.4)]"
								: "text-storm-cloud hover:text-porcelain active:scale-95",
						)}
					>
						{count}
					</button>
				);
			})}
		</div>
	);
}
