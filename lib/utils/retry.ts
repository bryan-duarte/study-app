/**
 * Retry Utilities
 * Provides exponential backoff retry logic for async operations
 */

const MAX_RETRIES_DEFAULT = 3;
const BASE_DELAY_DEFAULT = 1000;

/**
 * Fetch with exponential backoff retry
 * @param fetcher - Function that returns a Promise
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 */
export async function fetchWithRetry<T>(
	fetcher: () => Promise<T>,
	maxRetries: number = MAX_RETRIES_DEFAULT,
	baseDelay: number = BASE_DELAY_DEFAULT,
): Promise<T> {
	let lastError: Error | null = null;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await fetcher();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			// Don't retry if this is the last attempt
			const isLastAttempt = attempt === maxRetries;
			if (isLastAttempt) {
				break;
			}

			// Calculate delay with exponential backoff
			const delay = baseDelay * 2 ** attempt;

			console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);

			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError || new Error("Max retries exceeded");
}

/**
 * Check if an error is a transient (retryable) error
 */
export function isTransientError(error: unknown): boolean {
	if (error instanceof Error) {
		// Network timeout errors
		if (
			error.message.includes("timeout") ||
			error.message.includes("ETIMEDOUT")
		) {
			return true;
		}

		// Rate limiting errors
		if (error.message.includes("429")) {
			return true;
		}

		// Server errors (5xx)
		if (error.message.includes("5")) {
			return true;
		}
	}

	return false;
}

/**
 * Fetch with timeout and retry
 */
export async function fetchWithTimeoutAndRetry<T>(
	fetcher: () => Promise<T>,
	timeout: number = 10000,
	maxRetries: number = MAX_RETRIES_DEFAULT,
): Promise<T> {
	return fetchWithRetry(async () => {
		return Promise.race([
			fetcher(),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("Request timeout")), timeout),
			),
		]);
	}, maxRetries);
}
