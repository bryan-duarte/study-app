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
      <div className="text-question font-w510 text-porcelain leading-relaxed [&_h1]:text-question [&_h2]:text-question [&_h1]:font-w510 [&_h2]:font-w510 [&_p]:text-body [&_p]:text-porcelain [&_strong]:font-w510">
        <MarkdownRenderer content={question} />
      </div>
    </div>
  );
}
