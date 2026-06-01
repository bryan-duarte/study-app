"use client";

import { Badge } from "@/components/ui/Badge";

interface QuestionCardProps {
	question: string;
	questionType?: "single-option" | "multi-option";
}

export default function QuestionCard({
	question,
	questionType,
}: QuestionCardProps) {
	return (
		<div className="bg-graphite border border-charcoal-grey rounded-cards p-6 shadow-sm">
			{questionType && (
				<div className="mb-3">
					<Badge variant="neutral" size="sm">
						{questionType === "single-option"
							? "Single Answer"
							: "Multiple Answers"}
					</Badge>
				</div>
			)}
			<h2 className="text-question font-w510 text-porcelain leading-relaxed">
				{question}
			</h2>
		</div>
	);
}
