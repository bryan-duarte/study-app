"use client";

import {
	useEffect,
	useId,
	useRef,
	useState,
	type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { GraduationCap, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCertifications } from "@/lib/client/useCertifications";

/**
 * Active-certification indicator that happens to be selectable.
 *
 * With a single certification today it reads as "your current certification";
 * the moment a second cert is inserted it becomes a real picker with zero code
 * changes. Writes flow into the certification store, which every data consumer
 * (quiz start, history, stats, export) reads.
 */
export default function CertificationSelector({
	className,
}: {
	className?: string;
}) {
	const { certifications, activeCertification, setActiveCertification } =
		useCertifications();
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
	const listboxId = useId();

	const hasOptions = certifications.length > 0;
	const activeIndex = certifications.findIndex(
		(cert) => cert.id === activeCertification?.id,
	);

	useEffect(() => {
		if (!open) return;

		const handlePointerDown = (event: MouseEvent) => {
			const clickedOutside =
				containerRef.current !== null &&
				!containerRef.current.contains(event.target as Node);
			if (clickedOutside) setOpen(false);
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setOpen(false);
				triggerRef.current?.focus();
			}
		};

		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [open]);

	// On open, move focus into the list at the active option (or the first),
	// completing the WAI-ARIA listbox contract the roles advertise.
	useEffect(() => {
		if (!open) return;
		const index = activeIndex >= 0 ? activeIndex : 0;
		optionRefs.current[index]?.focus();
	}, [open, activeIndex]);

	const primaryLabel = activeCertification?.name ?? "Certification";
	const examCode = activeCertification?.examCode ?? null;

	const handleSelect = (id: string) => {
		setActiveCertification(id);
		setOpen(false);
		triggerRef.current?.focus();
	};

	const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
		if (!hasOptions) return;
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			setOpen(true); // focus moves to the active option via the open effect
		}
	};

	// Roving focus across the real option buttons while the list is open.
	const handleListKeyDown = (event: ReactKeyboardEvent<HTMLUListElement>) => {
		const count = certifications.length;
		if (count === 0) return;
		const current = optionRefs.current.findIndex(
			(el) => el === document.activeElement,
		);
		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				optionRefs.current[current < 0 ? 0 : (current + 1) % count]?.focus();
				break;
			case "ArrowUp":
				event.preventDefault();
				optionRefs.current[
					current <= 0 ? count - 1 : current - 1
				]?.focus();
				break;
			case "Home":
				event.preventDefault();
				optionRefs.current[0]?.focus();
				break;
			case "End":
				event.preventDefault();
				optionRefs.current[count - 1]?.focus();
				break;
			case "Tab":
				setOpen(false); // let focus leave naturally, but close the list
				break;
		}
	};

	return (
		<div ref={containerRef} className={cn("relative", className)}>
			<button
				ref={triggerRef}
				type="button"
				onClick={() => hasOptions && setOpen((v) => !v)}
				onKeyDown={handleTriggerKeyDown}
				disabled={!hasOptions}
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={open ? listboxId : undefined}
				aria-label={`Active certification: ${primaryLabel}. Tap to change.`}
				className="inline-flex h-11 w-full items-center gap-2.5 rounded-cards border border-charcoal-grey bg-graphite/70 px-3 text-left backdrop-blur-sm transition-colors hover:border-muted-ash focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-lime focus-visible:ring-offset-2 focus-visible:ring-offset-pitch-black disabled:cursor-default sm:w-auto"
			>
				<span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-cards bg-neon-lime/15 text-neon-lime">
					<GraduationCap className="h-4 w-4" strokeWidth={2.25} />
				</span>
				<span className="flex min-w-0 flex-col">
					<span className="text-caption font-w510 uppercase tracking-[0.12em] text-fog-grey">
						Certification
					</span>
					<span className="truncate text-body font-w590 text-porcelain">
						{primaryLabel}
					</span>
				</span>
				{examCode && (
					<span className="flex-shrink-0 rounded-badges border border-neon-lime/40 bg-neon-lime/10 px-1.5 py-0.5 font-mono text-caption text-neon-lime">
						{examCode}
					</span>
				)}
				{hasOptions && (
					<ChevronDown
						className={cn(
							"ml-auto h-4 w-4 flex-shrink-0 text-storm-cloud transition-transform sm:ml-1",
							open && "rotate-180",
						)}
						strokeWidth={2}
					/>
				)}
			</button>

			{open && hasOptions && (
				<ul
					id={listboxId}
					role="listbox"
					aria-label="Choose a certification"
					onKeyDown={handleListKeyDown}
					className="animate-slide-down absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-cards border border-charcoal-grey bg-deep-slate shadow-[var(--shadow-xl)] sm:min-w-[280px]"
				>
					{certifications.map((cert, index) => {
						const isActive = cert.id === activeCertification?.id;
						return (
							<li key={cert.id}>
								<button
									ref={(el) => {
										optionRefs.current[index] = el;
									}}
									type="button"
									role="option"
									aria-selected={isActive}
									tabIndex={-1}
									onClick={() => handleSelect(cert.id)}
									className={cn(
										"flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-graphite/70 focus:outline-none focus-visible:bg-graphite/70",
										isActive && "bg-graphite/50",
									)}
								>
									<span className="flex min-w-0 flex-col">
										<span className="truncate text-body font-w510 text-porcelain">
											{cert.name}
										</span>
										{cert.examCode && (
											<span className="font-mono text-caption text-storm-cloud">
												{cert.examCode}
											</span>
										)}
									</span>
									{isActive && (
										<Check
											className="ml-auto h-4 w-4 flex-shrink-0 text-neon-lime"
											strokeWidth={2.5}
										/>
									)}
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
