/**
 * Paginator Component
 * Displays pagination controls for navigating through quiz questions
 */

"use client";

interface PaginatorProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	disabled?: boolean;
}

export function Paginator({
	currentPage,
	totalPages,
	onPageChange,
	disabled = false,
}: PaginatorProps) {
	if (totalPages <= 1) return null;

	const getPageNumbers = () => {
		const pages: (number | string)[] = [];
		const showEllipsis = totalPages > 7;

		if (!showEllipsis) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Always show first page
			pages.push(1);

			// Show ellipsis if needed
			if (currentPage > 3) {
				pages.push("...");
			}

			// Show current page and neighbors
			const start = Math.max(2, currentPage - 1);
			const end = Math.min(totalPages - 1, currentPage + 1);

			for (let i = start; i <= end; i++) {
				pages.push(i);
			}

			// Show ellipsis if needed
			if (currentPage < totalPages - 2) {
				pages.push("...");
			}

			// Always show last page
			pages.push(totalPages);
		}

		return pages;
	};

	return (
		<nav
			aria-label="Quiz pagination"
			className="flex items-center justify-center gap-2 py-4"
		>
			<button
				onClick={() => onPageChange(currentPage - 1)}
				disabled={disabled || currentPage === 1}
				aria-label="Previous page"
				className="px-3 py-1 rounded bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
			>
				← Previous
			</button>

			{getPageNumbers().map((page, index) =>
				typeof page === "string" ? (
					<span
						key={`ellipsis-${index}`}
						className="text-body text-white/50 px-2"
						aria-hidden="true"
					>
						...
					</span>
				) : (
					<button
						key={page}
						onClick={() => onPageChange(page)}
						disabled={disabled}
						aria-label={`Go to page ${page}`}
						aria-current={currentPage === page ? "page" : undefined}
						className={`px-3 py-1 rounded transition-colors ${
							currentPage === page
								? "bg-neon-lime text-black"
								: "bg-white/10 text-white hover:bg-white/20"
						}`}
					>
						{page}
					</button>
				),
			)}

			<button
				onClick={() => onPageChange(currentPage + 1)}
				disabled={disabled || currentPage === totalPages}
				aria-label="Next page"
				className="px-3 py-1 rounded bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
			>
				Next →
			</button>
		</nav>
	);
}
