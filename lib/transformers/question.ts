/**
 * Question Data Transformer
 * Converts Supabase snake_case format to app camelCase format
 * Handles JSONB options array transformation
 */

import type { Database } from "@/types/supabase-generated";

// Supabase types - accept wider type for query results
type SupabaseQuestion =
	| Database["public"]["Tables"]["questions"]["Row"]
	| Record<string, unknown>;

// JSONB option types from Supabase
interface JsonbOption {
	id: string;
	description: string;
	is_correct: boolean;
	reasoning: string;
}

// Application types
export interface QuizOption {
	id: string;
	description: string;
	isCorrect: boolean;
	reasoning: string;
}

export interface QuizQuestion {
	id: string;
	type: "single-option" | "multi-option";
	title: string;
	options: QuizOption[];
}

/**
 * Validates that data has the structure of a Supabase question
 */
function isValidQuestion(data: unknown): data is SupabaseQuestion {
	if (typeof data !== "object" || data === null) {
		return false;
	}

	const question = data as Record<string, unknown>;
	return (
		typeof question.id === "string" &&
		typeof question.type === "string" &&
		typeof question.title === "string" &&
		"options" in question
	);
}

/**
 * Transforms a single question from Supabase format to app format
 * Converts snake_case to camelCase for nested objects
 * Accepts unknown for maximum type compatibility, validates at runtime
 */
export function transformQuestion(data: unknown): QuizQuestion {
	if (!isValidQuestion(data)) {
		console.warn("Invalid question structure:", data);
		return createFallbackQuestion();
	}

	// Type assertion: data is guaranteed to be SupabaseQuestion after validation
	const question = data as SupabaseQuestion;
	return {
		id: question.id as string,
		type: question.type as "single-option" | "multi-option",
		title: question.title as string,
		options: transformOptions(question.options),
	};
}

/**
 * Creates a fallback question for invalid data
 */
function createFallbackQuestion(): QuizQuestion {
	return {
		id: "fallback-id",
		type: "single-option",
		title: "Invalid question data",
		options: [createFallbackOption()],
	};
}

/**
 * Transforms JSONB options array to camelCase format
 */
function transformOptions(optionsJson: unknown): QuizOption[] {
	if (!Array.isArray(optionsJson)) {
		console.warn("Options is not an array, returning empty array");
		return [];
	}

	return optionsJson.map((opt: unknown) => {
		if (!isValidJsonbOption(opt)) {
			console.warn("Invalid option structure:", opt);
			return createFallbackOption();
		}

		return {
			id: opt.id,
			description: opt.description,
			isCorrect: opt.is_correct,
			reasoning: opt.reasoning,
		};
	});
}

/**
 * Type guard for JSONB option validation
 */
function isValidJsonbOption(opt: unknown): opt is JsonbOption {
	if (typeof opt !== "object" || opt === null) {
		return false;
	}

	const option = opt as Record<string, unknown>;
	return (
		typeof option.id === "string" &&
		typeof option.description === "string" &&
		typeof option.is_correct === "boolean" &&
		typeof option.reasoning === "string"
	);
}

/**
 * Creates a fallback option for invalid data
 */
function createFallbackOption(): QuizOption {
	return {
		id: "fallback-id",
		description: "Invalid option data",
		isCorrect: false,
		reasoning: "Data validation failed",
	};
}

/**
 * Transforms an array of questions
 * Accepts unknown array for maximum type compatibility
 */
export function transformQuestions(data: unknown[]): QuizQuestion[] {
	return data.map(transformQuestion);
}
