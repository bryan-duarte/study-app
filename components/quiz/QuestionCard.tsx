"use client";

import { Badge } from "@/components/ui/Badge";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

interface QuestionCardProps {
	question: string;
	questionType?: "single-option" | "multi-option";
}

export default function QuestionCard({
	question,
	questionType,
}: QuestionCardProps) {
	return (
		<div className="animate-fade-in-up rounded-cards border border-charcoal-grey/70 bg-graphite/80 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_2px_4px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:p-7">
			{questionType && (
				<div className="mb-4">
					<Badge variant="neutral" size="sm">
						{questionType === "single-option"
							? "Single Answer"
							: "Multiple Answers"}
					</Badge>
				</div>
			)}
			<div className="text-question font-w510 leading-relaxed text-porcelain [&_p+p]:mt-3 [&_strong]:font-w590 [&_strong]:text-porcelain">
				<MarkdownRenderer content={question} />
			</div>
		</div>
	);
}
