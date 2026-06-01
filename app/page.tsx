"use client";

import Link from "next/link";
import QuestionCountSelector from "@/components/home/QuestionCountSelector";
import { useQuizStore } from "@/store/quizStore";

export default function Home() {
	const selectedQuestionCount = useQuizStore((state) => state.selectedQuestionCount);

	return (
		<div className="flex flex-col flex-1 items-center justify-center bg-pitch-black font-sans min-h-screen">
			<main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-12 p-8">
				<div className="text-center space-y-4">
					<h1 className="text-heading-lg font-w590 text-porcelain tracking-heading">
						AWS Certification Quiz
					</h1>
					<p className="text-body font-regular text-storm-cloud max-w-2xl mx-auto">
						Test your AWS knowledge with {selectedQuestionCount} practice questions covering
						various AWS services and concepts.
					</p>
				</div>

				<div className="flex flex-col items-center gap-6">
					<div className="flex flex-col items-center gap-3">
						<label
							htmlFor="question-count"
							className="text-body font-w510 text-light-steel"
						>
							Number of Questions
						</label>
						<div role="group" aria-label="Question count selection">
							<QuestionCountSelector />
						</div>
					</div>

					<Link
						href="/quiz"
						className="flex h-14 items-center justify-center gap-2 rounded-buttons bg-neon-lime px-6 text-pitch-black font-w590 text-body transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-neon-lime focus:ring-offset-2 focus:ring-offset-pitch-black"
					>
						Start Quiz
					</Link>
				</div>

				<div className="text-center space-y-2 text-fog-grey text-caption">
					<p>{selectedQuestionCount} Questions • Multiple Choice • Detailed Explanations</p>
					<p>Practice for your AWS certification exam</p>
				</div>
			</main>
		</div>
	);
}
