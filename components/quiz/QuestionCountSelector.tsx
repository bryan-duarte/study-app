'use client';

import { useState, useEffect } from 'react';

type QuestionCount = 10 | 20 | 30;

interface QuestionCountSelectorProps {
  value: QuestionCount;
  onChange: (count: QuestionCount) => void;
}

const STORAGE_KEY = 'quiz-question-count';
const DEFAULT_COUNT: QuestionCount = 20;

const OPTIONS: QuestionCount[] = [10, 20, 30];

export function QuestionCountSelector({ value, onChange }: QuestionCountSelectorProps) {
  const [selectedCount, setSelectedCount] = useState<QuestionCount>(value);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (OPTIONS.includes(parsed as QuestionCount)) {
        setSelectedCount(parsed as QuestionCount);
        onChange(parsed as QuestionCount);
      }
    }
  }, [onChange]);

  const handleSelect = (count: QuestionCount) => {
    setSelectedCount(count);
    localStorage.setItem(STORAGE_KEY, count.toString());
    onChange(count);
  };

  return (
    <div className="flex items-center gap-2" data-testid="question-count-selector">
      <span className="text-sm text-storm-cloud">Questions:</span>
      <div className="flex gap-1" role="group" aria-label="Question count options">
        {OPTIONS.map((count) => (
          <button
            key={count}
            onClick={() => handleSelect(count)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-md transition-colors
              ${selectedCount === count
                ? 'bg-neon-lime text-pitch-black'
                : 'bg-gunmetal text-porcelain hover:bg-muted-ash'
              }
            `}
            aria-pressed={selectedCount === count}
            data-testid="question-count-option"
            data-selected={selectedCount === count}
            data-value={count}
          >
            {count}
          </button>
        ))}
      </div>
    </div>
  );
}
