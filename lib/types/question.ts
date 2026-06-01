/**
 * Domain types for AWS Quiz questions
 * Validates external data at boundary, converts to domain types
 */

export const QUESTION_TYPE = {
	SINGLE_OPTION: "single-option",
	MULTI_OPTION: "multi-option",
} as const;

export type QuestionTypeValue =
	(typeof QUESTION_TYPE)[keyof typeof QUESTION_TYPE];

export type QuestionType = QuestionTypeValue;

export interface OptionDTO {
	description: string;
	is_correct: boolean;
	reasoning: string;
}

export interface QuestionDTO {
	type: string;
	title: string;
	options: readonly OptionDTO[];
}

export interface Option {
	description: string;
	isCorrect: boolean;
	reasoning: string;
}

export interface Question {
	type: QuestionType;
	title: string;
	options: readonly Option[];
}

const VALID_QUESTION_TYPES = new Set<QuestionTypeValue>([
	QUESTION_TYPE.SINGLE_OPTION,
	QUESTION_TYPE.MULTI_OPTION,
]);

const FIELD_REQUIRED = "Field is required";
const FIELD_INVALID = "Field has invalid value";

export class ValidationError extends Error {
	constructor(
		message: string,
		public readonly field: string,
		public readonly value: unknown,
	) {
		super(message);
		this.name = "ValidationError";
	}
}

function validateString(value: unknown, fieldName: string): string {
	if (typeof value !== "string" || value.trim().length === 0) {
		throw new ValidationError(FIELD_REQUIRED, fieldName, value);
	}
	return value;
}

function validateQuestionType(value: unknown): QuestionType {
	const rawType = validateString(value, "type");

	if (!VALID_QUESTION_TYPES.has(rawType as QuestionType)) {
		throw new ValidationError(FIELD_INVALID, "type", rawType);
	}

	return rawType as QuestionType;
}

function validateBoolean(value: unknown, fieldName: string): boolean {
	if (typeof value !== "boolean") {
		throw new ValidationError(FIELD_INVALID, fieldName, value);
	}
	return value;
}

function validateOptionDTO(dto: unknown): OptionDTO {
	if (!dto || typeof dto !== "object") {
		throw new ValidationError(FIELD_REQUIRED, "option", dto);
	}

	const record = dto as Record<string, unknown>;

	return {
		description: validateString(record.description, "option.description"),
		is_correct: validateBoolean(record.is_correct, "option.is_correct"),
		reasoning: validateString(record.reasoning, "option.reasoning"),
	};
}

function validateOptionsArray(value: unknown): readonly OptionDTO[] {
	if (!Array.isArray(value) || value.length === 0) {
		throw new ValidationError(FIELD_REQUIRED, "options", value);
	}

	return value.map((option, index) => {
		try {
			return validateOptionDTO(option);
		} catch (error) {
			if (error instanceof ValidationError) {
				throw new ValidationError(
					error.message,
					`options[${index}].${error.field}`,
					error.value,
				);
			}
			throw error;
		}
	});
}

export function validateQuestionDTO(dto: unknown): QuestionDTO {
	if (!dto || typeof dto !== "object") {
		throw new ValidationError(FIELD_REQUIRED, "question", dto);
	}

	const record = dto as Record<string, unknown>;

	return {
		type: validateQuestionType(record.type),
		title: validateString(record.title, "title"),
		options: validateOptionsArray(record.options),
	};
}

export function toDomain(dto: QuestionDTO): Question {
	return {
		type: validateQuestionType(dto.type),
		title: dto.title,
		options: dto.options.map((option) => ({
			description: option.description,
			isCorrect: option.is_correct,
			reasoning: option.reasoning,
		})),
	};
}

export function toQuestionDTO(question: Question): QuestionDTO {
	return {
		type: question.type,
		title: question.title,
		options: question.options.map((option) => ({
			description: option.description,
			is_correct: option.isCorrect,
			reasoning: option.reasoning,
		})),
	};
}
