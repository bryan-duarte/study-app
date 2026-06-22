/**
 * Client-side Markdown export for studied questions.
 *
 * Produces a single .md document (question + correct answer + your answer +
 * reasoning) suitable for Anki, NotebookLM, or plain notes.
 */
import type { HistoryItem } from "@/types/quiz";

function correctOptions(item: HistoryItem) {
  return item.options.filter((o) => o.isCorrect);
}

function selectedOption(item: HistoryItem) {
  return item.options.find((o) => o.id === item.selectedOptionId) ?? null;
}

/** What to include per question in the export. All default to true. */
export interface MarkdownExportOptions {
  /** List every option (distractors + correct, correct marked with ✅). */
  allOptions?: boolean;
  /** The "Correct answer(s):" line naming just the correct answers. */
  correctAnswer?: boolean;
  /** The "Explanation:" block (the why behind the correct answer). */
  explanation?: boolean;
}

/** Render a list of history items as one Markdown string. */
export function historyToMarkdown(
  items: HistoryItem[],
  options: MarkdownExportOptions = {},
): string {
  const { allOptions = true, correctAnswer = true, explanation = true } = options;
  const today = new Date().toISOString().slice(0, 10);
  const out: string[] = [
    "# AWS SAA-C03 — Study Export",
    "",
    `> ${items.length} question${items.length === 1 ? "" : "s"} · exported ${today}`,
    "",
  ];

  items.forEach((item, i) => {
    const meta = [item.domain, item.topic, item.difficulty]
      .filter(Boolean)
      .join(" · ");
    out.push(`## ${i + 1}. ${meta || "Question"}`);
    out.push("");
    out.push(item.title.trim());
    out.push("");

    if (allOptions && item.options.length > 0) {
      out.push("**Options:**");
      out.push("");
      for (const o of item.options) {
        out.push(`${o.isCorrect ? "- ✅" : "-"} ${o.description}`);
      }
      out.push("");
    }

    const correct = correctOptions(item);
    if (correctAnswer && correct.length > 0) {
      out.push(
        `**Correct answer${correct.length > 1 ? "s" : ""}:** ${correct
          .map((o) => o.description)
          .join("; ")}`,
      );
      out.push("");
    }

    const selected = selectedOption(item);
    if (selected) {
      const mark = item.isCorrect ? "✅" : "❌";
      out.push(`**Your answer:** ${mark} ${selected.description}`);
      out.push("");
    }

    if (explanation) {
      const explanationText = correct[0]?.reasoning?.trim();
      if (explanationText) {
        out.push("**Explanation:**");
        out.push("");
        out.push(explanationText);
        out.push("");
      }
    }

    out.push("---");
    out.push("");
  });

  return out.join("\n");
}

/** Trigger a browser download of `content` as `filename`. No-op on the server. */
export function downloadMarkdown(filename: string, content: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
