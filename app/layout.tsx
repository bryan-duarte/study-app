import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

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
		"Test your AWS knowledge with 50 practice questions covering various AWS services and concepts.",
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
		>
			<body className="min-h-full flex flex-col font-sans">{children}</body>
		</html>
	);
}
