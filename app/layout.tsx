import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import AppNav from "@/components/layout/AppNav";

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
};

// viewport-fit=cover enables env(safe-area-inset-*) on notched devices,
// so the fixed bottom action bar clears the iOS home indicator.
export const viewport: Viewport = {
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
				{children}
			</body>
		</html>
	);
}
