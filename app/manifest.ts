import type { MetadataRoute } from "next";

// Web app manifest — served at /manifest.webmanifest by the App Router file
// convention, which also auto-injects <link rel="manifest"> into <head>.
// See app/layout.tsx next.config.ts for the matching Content-Type header.
export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "AWS Certification Quiz",
		short_name: "AWS Quiz",
		description:
			"Practice for the AWS Solutions Architect Associate (SAA-C03) exam — quiz by category, drill mistakes, and use spaced repetition across 312 questions.",
		id: "/",
		start_url: "/",
		scope: "/",
		display: "standalone",
		display_override: ["standalone"],
		orientation: "portrait",
		background_color: "#08090a",
		theme_color: "#08090a",
		categories: ["education", "productivity"],
		icons: [
			// PNGs are required by iOS and Chrome's installability audit. SVG is
			// ignored by iOS, so it is omitted here (kept for the browser-tab icon).
			{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
			{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
			{ src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
			{ src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
		],
	};
}
