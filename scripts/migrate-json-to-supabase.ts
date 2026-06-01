/**
 * Migration Script: JSON to Supabase
 * Loads questions from /public/questions.json and migrates to Supabase
 *
 * Usage: npx tsx scripts/migrate-json-to-supabase.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local FIRST
config({ path: resolve(process.cwd(), ".env.local") });

// Dynamic imports to ensure env vars are loaded first
interface QuestionData {
	type: string;
	title: string;
	options: Array<{
		description: string;
		is_correct: boolean;
		reasoning: string;
	}>;
}

interface JsonOption {
	description: string;
	is_correct: boolean;
	reasoning: string;
}

async function main() {
	const { createClient } = await import("@supabase/supabase-js");
	const { env } = await import("../lib/env.js");
	const questions = await import("../public/questions.json");

	const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);

	let successCount = 0;
	let errorCount = 0;
	const errors: Array<{ question: string; error: string }> = [];

	console.log(`Starting migration of ${questions.default.length} questions...`);

	for (let i = 0; i < questions.default.length; i++) {
		const questionData = questions.default[i] as QuestionData;

		try {
			// Validate question structure
			if (!questionData.type || !questionData.title || !questionData.options) {
				throw new Error("Invalid question structure");
			}

			if (!["single-option", "multi-option"].includes(questionData.type)) {
				throw new Error(`Invalid question type: ${questionData.type}`);
			}

			// Transform options to JSONB format with UUIDs
			const optionsJson = questionData.options.map((opt: JsonOption) => ({
				id: crypto.randomUUID(),
				description: opt.description,
				is_correct: opt.is_correct,
				reasoning: opt.reasoning,
			}));

			// Insert question with JSONB options
			const { data: question, error: questionError } = await supabase
				.from("questions")
				.insert({
					type: questionData.type,
					title: questionData.title,
					options: optionsJson,
				})
				.select("id")
				.single();

			if (questionError) throw questionError;

			// Validate at least one correct answer
			const hasCorrectAnswer = questionData.options.some(
				(opt) => opt.is_correct,
			);
			if (!hasCorrectAnswer) {
				console.warn(`Warning: Question ${i + 1} has no correct answer`);
			}

			successCount++;

			if ((i + 1) % 10 === 0) {
				console.log(
					`Progress: ${i + 1}/${questions.default.length} questions migrated`,
				);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			errors.push({ question: `Question ${i + 1}`, error: errorMessage });
			errorCount++;
			console.error(`Failed to migrate question ${i + 1}:`, errorMessage);
		}
	}

	console.log("\n=== Migration Complete ===");
	console.log(`✓ Success: ${successCount} questions`);
	console.log(`✗ Failed: ${errorCount} questions`);

	if (errors.length > 0) {
		console.log("\nErrors:");
		errors.forEach(({ question, error }) => {
			console.log(`  ${question}: ${error}`);
		});
	}

	// Verify final count
	const { count } = await supabase
		.from("questions")
		.select("*", { count: "exact", head: true });

	console.log(`\nTotal questions in database: ${count}`);
	console.log(`Expected: ${questions.default.length}`);
}

main().catch(console.error);
