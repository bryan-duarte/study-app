/**
 * API Error Utilities
 * Provides safe error handling that logs detailed errors server-side
 * while returning generic messages to clients
 */

export interface ApiError {
	error: string;
	code?: string;
}

/**
 * Logs detailed error server-side and returns a safe error response
 */
export function handleApiError(error: unknown, context: string): ApiError {
	// Log detailed error server-side for debugging
	if (error instanceof Error) {
		console.error(`[${context}] Error:`, {
			message: error.message,
			stack: error.stack,
			name: error.name,
		});
	} else {
		console.error(`[${context}] Unknown error:`, error);
	}

	// Return generic error to client
	return {
		error: getGenericErrorMessage(context),
	};
}

/**
 * Maps context to generic error messages
 */
function getGenericErrorMessage(context: string): string {
	const messages: Record<string, string> = {
		questions: "Failed to load questions",
		session: "Failed to manage session",
		progress: "Failed to sync progress",
		analytics: "Failed to process analytics",
		auth: "Authentication failed",
		quiz: "Quiz operation failed",
	};

	return messages[context] || "An error occurred";
}

/**
 * Creates an error response object
 */
export function errorResponse(error: ApiError, status: number = 500): Response {
	return Response.json(error, { status });
}
