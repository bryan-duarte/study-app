/**
 * Client-side Markdown export for studied questions.
 *
 * Produces a single .md document suitable for Anki, NotebookLM, or plain notes.
 * The QUESTION TEXT is always included (the one hard requirement); every other
 * field is individually toggleable via MarkdownExportOptions. See
 * DEFAULT_EXPORT_OPTIONS for the defaults, which preserve the pre-customization
 * output byte-for-byte.
 */
import type { HistoryItem } from "@/types/quiz";

function correctOptions(item: HistoryItem) {
  return item.options.filter((o) => o.isCorrect);
}

function selectedOption(item: HistoryItem) {
  return item.options.find((o) => o.id === item.selectedOptionId) ?? null;
}

/** Human-readable label for a question's response format. */
function typeLabel(type: HistoryItem["type"]): string {
  return type === "multi-option" ? "Multiple response" : "Single answer";
}

/** Date-only slice of an ISO timestamp (e.g. "2026-06-21"); "" when absent. */
function dateOnly(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

/** What to include per question in the export. All optional — see DEFAULT_EXPORT_OPTIONS. */
export interface MarkdownExportOptions {
  /** The "## N. domain · topic · difficulty" heading line. */
  metaHeader?: boolean;
  /** "**Type:** Single answer / Multiple response" line under the question. */
  questionType?: boolean;
  /** The full options list (distractors + correct, correct marked with ✅). */
  allOptions?: boolean;
  /** The "Correct answer(s):" line naming just the correct answers. */
  correctAnswer?: boolean;
  /** The "Explanation:" block (the why behind the correct answer). */
  explanation?: boolean;
  /** The "Your answer:" line (what you picked + ✅/❌). */
  yourAnswer?: boolean;
  /** The "Tags:" line (#Name #Name). */
  tags?: boolean;
  /** The "Answered: N time(s)" line. */
  timesAnswered?: boolean;
  /** The "First answered:" / "Last answered:" lines (date-only). */
  timestamps?: boolean;
  /** The "> ID: <questionId>" footnote line. */
  questionId?: boolean;
}

/**
 * Sensible defaults — preserves the pre-customization output (meta header,
 * all options, correct answer, explanation, and your answer on; the rest off).
 * Also the source of truth the Explorer merges persisted choices over, so new
 * keys added later fall back to their default instead of silently turning off.
 */
export const DEFAULT_EXPORT_OPTIONS: Required<MarkdownExportOptions> = {
  metaHeader: true,
  questionType: false,
  allOptions: true,
  correctAnswer: true,
  explanation: true,
  yourAnswer: true,
  tags: false,
  timesAnswered: false,
  timestamps: false,
  questionId: false,
};

/** Render a list of history items as one Markdown string. The question text is always included. */
export function historyToMarkdown(
  items: HistoryItem[],
  userOptions: MarkdownExportOptions = {},
): string {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...userOptions };
  const today = new Date().toISOString().slice(0, 10);
  const out: string[] = [
    "# AWS SAA-C03 — Study Export",
    "",
    `> ${items.length} question${items.length === 1 ? "" : "s"} · exported ${today}`,
    "",
  ];

  items.forEach((item, i) => {
    // Heading — numbering is structural (always present); the meta line is toggleable.
    const meta = [item.domain, item.topic, item.difficulty]
      .filter(Boolean)
      .join(" · ");
    const heading = opts.metaHeader ? meta || "Question" : "Question";
    out.push(`## ${i + 1}. ${heading}`);
    out.push("");

    // Question text — ALWAYS included (the one hard requirement).
    out.push(item.title.trim());
    out.push("");

    const correct = correctOptions(item);

    // Optional: question type.
    if (opts.questionType) {
      out.push(`**Type:** ${typeLabel(item.type)}`);
      out.push("");
    }

    // Optional: all options.
    if (opts.allOptions && item.options.length > 0) {
      out.push("**Options:**");
      out.push("");
      for (const o of item.options) {
        out.push(`${o.isCorrect ? "- ✅" : "-"} ${o.description}`);
      }
      out.push("");
    }

    // Optional: correct answer(s).
    if (opts.correctAnswer && correct.length > 0) {
      out.push(
        `**Correct answer${correct.length > 1 ? "s" : ""}:** ${correct
          .map((o) => o.description)
          .join("; ")}`,
      );
      out.push("");
    }

    // Optional: your answer.
    const selected = selectedOption(item);
    if (opts.yourAnswer && selected) {
      const mark = item.isCorrect ? "✅" : "❌";
      out.push(`**Your answer:** ${mark} ${selected.description}`);
      out.push("");
    }

    // Optional: explanation.
    if (opts.explanation) {
      const explanationText = correct[0]?.reasoning?.trim();
      if (explanationText) {
        out.push("**Explanation:**");
        out.push("");
        out.push(explanationText);
        out.push("");
      }
    }

    // Optional: tags (name, not slug — reads better in Anki/NotebookLM).
    if (opts.tags && item.tags && item.tags.length > 0) {
      out.push(`**Tags:** ${item.tags.map((t) => `#${t.name}`).join(" ")}`);
      out.push("");
    }

    // Optional: times answered.
    if (opts.timesAnswered && item.timesAnswered > 0) {
      out.push(
        `**Answered:** ${item.timesAnswered} time${item.timesAnswered === 1 ? "" : "s"}`,
      );
      out.push("");
    }

    // Optional: answer timestamps (date-only; first/last emitted together).
    if (opts.timestamps) {
      const first = dateOnly(item.firstAnsweredAt);
      const last = dateOnly(item.lastAnsweredAt);
      if (first) out.push(`**First answered:** ${first}`);
      if (last) out.push(`**Last answered:** ${last}`);
      if (first || last) out.push("");
    }

    // Optional: question ID (cross-reference footnote).
    if (opts.questionId) {
      out.push(`> ID: ${item.questionId}`);
      out.push("");
    }

    // Separator between questions (structural).
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
