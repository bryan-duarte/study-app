/**
 * Next.js Middleware with Rate Limiting
 * Protects API routes from abuse with simple in-memory rate limiting
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory store for rate limits (resets on server restart)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute per IP

/**
 * Checks if a request should be rate limited
 */
function checkRateLimit(ip: string): boolean {
	const now = Date.now();
	const record = rateLimit.get(ip);

	// Clean up expired records
	if (record && now > record.resetTime) {
		rateLimit.delete(ip);
		return true;
	}

	// Check if limit exceeded
	if (record && record.count >= RATE_LIMIT_MAX_REQUESTS) {
		return false;
	}

	// Increment counter
	if (record) {
		record.count++;
	} else {
		rateLimit.set(ip, {
			count: 1,
			resetTime: now + RATE_LIMIT_WINDOW,
		});
	}

	return true;
}

/**
 * Gets client IP from request headers
 */
function getClientIp(request: NextRequest): string {
	// Check various headers for IP
	const forwardedFor = request.headers.get("x-forwarded-for");
	const realIp = request.headers.get("x-real-ip");
	const cfConnectingIp = request.headers.get("cf-connecting-ip");

	if (forwardedFor) {
		// x-forwarded-for can contain multiple IPs, take the first one
		return forwardedFor.split(",")[0].trim();
	}

	if (realIp) {
		return realIp;
	}

	if (cfConnectingIp) {
		return cfConnectingIp;
	}

	// Fallback to a hash of the request
	return "unknown";
}

export function middleware(request: NextRequest) {
	const ip = getClientIp(request);

	// Only rate limit API routes
	if (request.nextUrl.pathname.startsWith("/api/")) {
		if (!checkRateLimit(ip)) {
			return NextResponse.json(
				{ error: "Too many requests" },
				{ status: 429 }
			);
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: "/api/:path*",
};
