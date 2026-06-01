/**
 * Quiz Data Repository
 * Singleton pattern for centralized data access
 * Fetches questions from Supabase with pagination support
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase-generated";
import { env } from "../env";
import {
	type QuizQuestion,
	transformQuestion,
	transformQuestions,
} from "../transformers/question";

interface PaginatedResult<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

interface DataState {
	readonly questions: readonly QuizQuestion[];
	readonly isLoaded: boolean;
}

const INITIAL_STATE: DataState = {
	questions: [],
	isLoaded: false,
};

class QuizRepository {
	private state: DataState = INITIAL_STATE;
	private supabase = createClient<Database>(
		env.supabaseUrl,
		env.supabaseServiceRoleKey,
	);

	private constructor() {}

	static readonly instance = new QuizRepository();

	/**
	 * Fetches questions with pagination
	 */
	async getQuestions(
		page: number = 1,
		limit: number = 10,
	): Promise<QuizQuestion[]> {
		const offset = (page - 1) * limit;

		const { data, error } = await this.supabase
			.from("questions")
			.select("*")
			.order("created_at", { ascending: true })
			.range(offset, offset + limit - 1);

		if (error) {
			console.error("Failed to fetch questions:", error);
			throw new Error(`Failed to fetch questions: ${error.message}`);
		}

		return transformQuestions(data);
	}

	/**
	 * Gets paginated result with metadata
	 */
	async getQuestionsPaginated(
		page: number = 1,
		limit: number = 10,
	): Promise<PaginatedResult<QuizQuestion>> {
		const [questions, total] = await Promise.all([
			this.getQuestions(page, limit),
			this.getTotalCount(),
		]);

		const totalPages = Math.ceil(total / limit);

		return {
			data: questions,
			pagination: {
				page,
				limit,
				total,
				totalPages,
			},
		};
	}

	/**
	 * Gets total question count
	 */
	async getTotalCount(): Promise<number> {
		const { count, error } = await this.supabase
			.from("questions")
			.select("*", { count: "exact", head: true });

		if (error) {
			console.error("Failed to get count:", error);
			throw new Error(`Failed to get count: ${error.message}`);
		}

		return count || 0;
	}

	/**
	 * Gets all questions (use with caution for large datasets)
	 */
	async getAllQuestions(): Promise<QuizQuestion[]> {
		const { data, error } = await this.supabase
			.from("questions")
			.select("*")
			.order("created_at", { ascending: true });

		if (error) {
			console.error("Failed to fetch all questions:", error);
			throw new Error(`Failed to fetch questions: ${error.message}`);
		}

		return transformQuestions(data);
	}

	/**
	 * Gets a single question by ID
	 */
	async getQuestionById(id: string): Promise<QuizQuestion | null> {
		const { data, error } = await this.supabase
			.from("questions")
			.select("*")
			.eq("id", id)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				// Not found
				return null;
			}
			console.error("Failed to fetch question:", error);
			throw new Error(`Failed to fetch question: ${error.message}`);
		}

		return transformQuestion(data);
	}

	/**
	 * Checks if repository is loaded
	 */
	get isLoaded(): boolean {
		return this.state.isLoaded;
	}

	/**
	 * Gets current state (for testing)
	 */
	getState(): DataState {
		return { ...this.state };
	}

	/**
	 * Loads questions into state (for backward compatibility)
	 * This is maintained but new code should use getQuestions/getQuestionsPaginated
	 */
	async loadQuestions(): Promise<void> {
		if (this.state.isLoaded) {
			return;
		}

		const questions = await this.getAllQuestions();

		this.state = {
			questions,
			isLoaded: true,
		};
	}

	/**
	 * Gets all questions from state (requires loadQuestions first)
	 */
	getQuestionsFromState(): readonly QuizQuestion[] {
		if (!this.state.isLoaded) {
			throw new Error("QuizRepository not loaded. Call loadQuestions() first.");
		}

		return this.state.questions;
	}

	/**
	 * Gets question by index from state (requires loadQuestions first)
	 */
	getQuestionByIndex(index: number): QuizQuestion {
		const questions = this.getQuestionsFromState();

		if (index < 0 || index >= questions.length) {
			throw new Error(
				`Question index ${index} out of bounds. Valid range: 0-${questions.length - 1}`,
			);
		}

		return questions[index];
	}

	/**
	 * Gets question count from state (requires loadQuestions first)
	 */
	getQuestionsCount(): number {
		return this.getQuestionsFromState().length;
	}

	/**
	 * Resets state
	 */
	reset(): void {
		this.state = INITIAL_STATE;
	}
}

export const quizRepository = QuizRepository.instance;
