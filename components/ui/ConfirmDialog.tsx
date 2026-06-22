"use client";

import { useEffect, useRef } from "react";
import { Button } from "./Button";

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	/** Renders the confirm button in warning-red — use for destructive actions. */
	destructive?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

/**
 * Minimal accessible confirmation modal. For destructive actions the
 * non-destructive button receives initial focus so an accidental Enter
 * dismisses the dialog instead of confirming.
 */
export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	destructive = false,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	const cancelRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!open) return;
		cancelRef.current?.focus();
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onCancel();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, onCancel]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="confirm-dialog-title"
		>
			<button
				type="button"
				className="absolute inset-0 cursor-default bg-pitch-black/70 backdrop-blur-sm"
				onClick={onCancel}
				aria-label="Cancel"
				tabIndex={-1}
			/>
			<div className="relative w-full max-w-sm animate-scale-in rounded-cards border border-charcoal-grey/70 bg-graphite p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]">
				<h2
					id="confirm-dialog-title"
					className="mb-2 text-body font-w590 text-porcelain"
				>
					{title}
				</h2>
				{description ? (
					<p className="mb-6 text-caption leading-relaxed text-storm-cloud">
						{description}
					</p>
				) : (
					<div className="mb-6" />
				)}

				<div className="flex justify-end gap-3">
					<Button ref={cancelRef} variant="ghost" onClick={onCancel}>
						{cancelLabel}
					</Button>
					{destructive ? (
						<button
							type="button"
							onClick={onConfirm}
							className="inline-flex h-12 items-center justify-center rounded-buttons bg-warning-red px-5 text-body font-w590 text-porcelain transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(255,77,79,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-warning-red focus-visible:ring-offset-2 focus-visible:ring-offset-pitch-black active:scale-[0.97]"
						>
							{confirmLabel}
						</button>
					) : (
						<Button variant="primary" onClick={onConfirm}>
							{confirmLabel}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
