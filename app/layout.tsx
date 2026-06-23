import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import AppNav from "@/components/layout/AppNav";
import AppShell from "@/components/layout/AppShell";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

const inter = Inter({
	variable: "--font-inter-variable",
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
	display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
	variable: "--font-berkeley-mono",
	subsets: ["latin"],
	weight: ["400"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "AWS Certification Quiz",
	description:
		"Practice for the AWS Solutions Architect Associate (SAA-C03) exam with 312 questions across four domains — quiz by category, drill mistakes, and spaced repetition.",
	applicationName: "AWS Quiz",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "AWS Quiz",
	},
	icons: {
		icon: [
			{ url: "/icon.svg", type: "image/svg+xml" },
			{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
			{ url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
		],
		apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
	},
	other: {
		// Legacy iOS capability tag. Next 16 emits only the modern
		// mobile-web-app-capable from appleWebApp.capable; adding this covers
		// all iOS versions for the widest Add-to-Home-Screen compatibility.
		"apple-mobile-web-app-capable": "yes",
	},
};

// viewport-fit=cover enables env(safe-area-inset-*) on notched devices,
// so the fixed bottom action bar clears the iOS home indicator.
// themeColor colors the browser/app chrome and the iOS PWA title bar.
export const viewport: Viewport = {
	themeColor: "#08090a",
	viewportFit: "cover",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
			suppressHydrationWarning
		>
			<body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
				<AppNav />
				<AppShell>{children}</AppShell>
				<ServiceWorkerRegister />
			</body>
		</html>
	);
}
