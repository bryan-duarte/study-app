import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), geolocation=()",
					},
					{
						key: "Strict-Transport-Security",
						value: "max-age=31536000; includeSubDomains",
					},
					{
						key: "Content-Security-Policy",
						value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; font-src 'self' data:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none';",
					},
				],
			},
			// Correct MIME type for the web app manifest (required by Lighthouse/Chrome).
			{
				source: "/manifest.webmanifest",
				headers: [{ key: "Content-Type", value: "application/manifest+json" }],
			},
			// The service worker must always be revalidated so version updates are
			// picked up on the next navigation instead of serving a stale script.
			{
				source: "/sw.js",
				headers: [{ key: "Cache-Control", value: "no-cache" }],
			},
		];
	},
};

export default nextConfig;
