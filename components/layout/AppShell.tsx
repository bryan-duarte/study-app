"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import BottomNav from "./BottomNav";

/**
 * Client shell that wraps page content: renders the route-aware mobile bottom
 * nav and reserves matching bottom space so content is never clipped behind it.
 * The bar (and its space reservation) are dropped on /quiz, which runs in focus
 * mode with its own fixed action bar.
 *
 * The reservation (5.5rem + safe-area) clears the floating nav pill: its bottom
 * offset (~0.875rem) + height (~3.5rem) plus a little breathing room. Removed at
 * `sm` where the bar is hidden.
 *
 * `relative z-[1]` lifts page content above the fixed dot-grid texture
 * (body::before, z-index 0). This replaces the old global `body > *` rule,
 * which also clobbered the navs' fixed/sticky positioning (see globals.css).
 *
 * NOTE: this wrapper creates a stacking context, so any full-screen overlay
 * (modal/drawer/toast) rendered inside page content must portal to
 * document.body (e.g. createPortal, as ConfirmDialog does) — otherwise its
 * z-index is clamped within this context and it paints *under* the z-40
 * BottomNav sibling on nav-visible routes.
 */
export default function AppShell({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const hideBottomNav = pathname === "/quiz";

	return (
		<>
			<div
				className={cn(
					"relative z-[1] flex flex-1 flex-col",
					!hideBottomNav &&
						"pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-0",
				)}
			>
				{children}
			</div>
			{!hideBottomNav && <BottomNav />}
		</>
	);
}
