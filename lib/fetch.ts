/**
 * Fetch utilities with timeout support
 */

const DEFAULT_TIMEOUT = 10000; // 10 seconds

/**
 * Creates an AbortController that aborts after the specified timeout
 */
function createTimeoutController(timeoutMs: number): AbortController {
	const controller = new AbortController();
	setTimeout(() => controller.abort(), timeoutMs);
	return controller;
}

/**
 * Wrapper around fetch that adds timeout support
 * @throws {Error} With name "AbortError" if timeout is reached
 */
export async function fetchWithTimeout(
	input: RequestInfo | URL,
	init?: RequestInit & { timeout?: number }
): Promise<Response> {
	const timeout = init?.timeout ?? DEFAULT_TIMEOUT;
	const controller = createTimeoutController(timeout);

	try {
		return await fetch(input, {
			...init,
			signal: controller.signal,
		});
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error(`Request timed out after ${timeout}ms`);
		}
		throw error;
	}
}

/**
 * Type guard for timeout errors
 */
export function isTimeoutError(error: unknown): error is Error {
	return error instanceof Error && error.name === "AbortError";
}
