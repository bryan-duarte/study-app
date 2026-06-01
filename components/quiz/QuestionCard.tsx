"use client";

interface QuestionCardProps {
  question: string;
}

export default function QuestionCard({ question }: QuestionCardProps) {
  return (
    <div className="bg-graphite border border-charcoal-grey rounded-cards p-6 shadow-sm">
      <h2 className="text-body font-w510 text-porcelain">{question}</h2>
    </div>
  );
}
