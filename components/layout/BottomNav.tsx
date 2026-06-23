"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, Compass, History, Tag } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Labels and icons mirror AppNav so the mobile and desktop navs stay in sync
// (e.g. "Explorer" → /history, "Sessions" → /sessions with the History icon).
const TABS = [
	{ href: "/", label: "Home", icon: Home },
	{ href: "/insights", label: "Insights", icon: BarChart3 },
	{ href: "/history", label: "Explorer", icon: Compass },
	{ href: "/sessions", label: "Sessions", icon: History },
	{ href: "/tags", label: "Tags", icon: Tag },
] as const;

/**
 * Persistent mobile tab bar — the app-like primary navigation. Mobile only
 * (`sm:hidden`); desktop/tablet keep the top AppNav. Visibility per route is
 * owned by AppShell (hidden on /quiz to avoid colliding with the quiz's own
 * fixed action bar). Fixed to the viewport bottom; the safe-area inset clears
 * the iOS home indicator. Each tab fills the full 64px bar height, so every
 * tap target comfortably exceeds the 44px accessibility minimum.
 */
export default function BottomNav() {
	const pathname = usePathname();

	return (
		<nav
			aria-label="Primary"
			className="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal-grey/70 bg-pitch-black/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
		>
			<ul className="mx-auto flex h-16 max-w-md items-stretch justify-around px-1">
				{TABS.map(({ href, label, icon: Icon }) => {
					const isActive =
						href === "/" ? pathname === "/" : pathname.startsWith(href);
					return (
						<li key={href} className="flex-1">
							<Link
								href={href}
								aria-current={isActive ? "page" : undefined}
								className={cn(
									"group relative flex h-full select-none touch-manipulation flex-col items-center justify-center gap-1 rounded-cards text-caption font-w510 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neon-lime",
									isActive
										? "text-neon-lime"
										: "text-storm-cloud hover:text-porcelain",
								)}
							>
								{/* "You are here" accent flush to the bar's top edge */}
								<span
									aria-hidden
									className={cn(
										"absolute top-0 h-0.5 w-7 rounded-pill bg-neon-lime transition-all duration-300 ease-out",
										isActive
											? "scale-x-100 opacity-100"
											: "scale-x-0 opacity-0",
									)}
								/>
								{/* Icon in a pill that tints on active and squishes on press */}
								<span
									className={cn(
										"flex h-8 w-8 items-center justify-center rounded-pill transition-all duration-200 ease-out group-active:scale-90",
										isActive
											? "bg-neon-lime/12"
											: "group-active:bg-porcelain/5",
									)}
								>
									<Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
								</span>
								<span className="leading-none">{label}</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
