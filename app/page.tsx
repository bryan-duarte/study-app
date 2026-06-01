import Link from "next/link";

export default function Home() {
	return (
		<div className="flex flex-col flex-1 items-center justify-center bg-pitch-black font-sans min-h-screen">
			<main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-12 p-8">
				<div className="text-center space-y-4">
					<h1 className="text-heading-lg font-w590 text-porcelain tracking-heading">
						AWS Certification Quiz
					</h1>
					<p className="text-body font-regular text-storm-cloud max-w-2xl mx-auto">
						Test your AWS knowledge with 50 practice questions covering various
						AWS services and concepts.
					</p>
				</div>

				<div className="flex flex-col sm:flex-row gap-4">
					<Link
						href="/quiz"
						className="flex h-14 items-center justify-center gap-2 rounded-buttons bg-neon-lime px-6 text-pitch-black font-w590 text-body transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-neon-lime focus:ring-offset-2 focus:ring-offset-pitch-black"
					>
						Start Quiz
					</Link>
				</div>

				<div className="text-center space-y-2 text-fog-grey text-caption">
					<p>50 Questions • Multiple Choice • Detailed Explanations</p>
					<p>Practice for your AWS certification exam</p>
				</div>
			</main>
		</div>
	);
}
