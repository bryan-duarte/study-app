"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, TrendingUp, Telescope, History, Tags } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Labels/icons mirror AppNav so the mobile and desktop navs stay in sync.
// Icons are chosen for context over convention: Telescope = "Explorer",
// TrendingUp = "Insights", History (clock-rewind) = past "Sessions".
const TABS = [
	{ href: "/", label: "Home", icon: House },
	{ href: "/insights", label: "Insights", icon: TrendingUp },
	{ href: "/history", label: "Explorer", icon: Telescope },
	{ href: "/sessions", label: "Sessions", icon: History },
	{ href: "/tags", label: "Tags", icon: Tags },
] as const;

/**
 * Floating mobile tab bar — a full-width glass bar that spans the viewport with
 * a 16px side gutter (`px-4`) and a small bottom gap, rather than a compact
 * centered pill. Mobile only (`sm:hidden`); desktop keeps the top AppNav.
 * Visibility per route is owned by AppShell (hidden on /quiz to avoid colliding
 * with the quiz's own fixed action bar).
 *
 * Interaction model: inactive tabs are icon-only circles; the active tab widens
 * into a pill that reveals its label, so the current location always reads
 * clearly without five permanent text labels. The active tint is a low-opacity
 * Live Wire (`bg-neon-lime/12`) — NOT a solid fill — because DESIGN.md reserves
 * the single filled-chartreuse CTA per viewport for the primary action.
 *
 * Each target is 44px tall, clearing the accessibility minimum; the safe-area
 * inset lifts the whole pill above the iOS home indicator.
 */
export default function BottomNav() {
	const pathname = usePathname();

	return (
		<nav
			aria-label="Primary"
			className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-40 flex justify-center px-4 sm:hidden"
		>
			<ul className="flex w-full items-center justify-between gap-1 rounded-pill border border-muted-ash/60 bg-graphite/80 p-1.5 shadow-xl backdrop-blur-xl">
				{TABS.map(({ href, label, icon: Icon }) => {
					const isActive =
						href === "/" ? pathname === "/" : pathname.startsWith(href);
					return (
						<li key={href}>
							<Link
								href={href}
								aria-current={isActive ? "page" : undefined}
								aria-label={label}
								className={cn(
									"group flex h-11 select-none touch-manipulation items-center justify-center gap-2 rounded-pill outline-none transition-all duration-300 ease-out focus-visible:ring-2 focus-visible:ring-neon-lime",
									isActive
										? "bg-neon-lime/12 px-4 text-neon-lime"
										: "w-11 text-storm-cloud hover:text-porcelain active:scale-90",
								)}
							>
								<Icon
									className="h-5 w-5 flex-shrink-0"
									strokeWidth={isActive ? 2.4 : 2}
									aria-hidden
								/>
								{isActive && (
									<span className="text-caption font-w590 leading-none">
										{label}
									</span>
								)}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
