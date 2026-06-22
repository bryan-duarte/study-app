"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cloud, Home, Compass, History, BarChart3 } from "lucide-react";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/history", label: "Explorer", icon: Compass },
  { href: "/sessions", label: "Sessions", icon: History },
  { href: "/insights", label: "Insights", icon: BarChart3 },
];

/**
 * Slim top navigation for the secondary "explore your progress" screens
 * and the quiz results page. Intentionally hidden on the home hero and the
 * active quiz flow so those keep their full-bleed layouts.
 */
export default function AppNav() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/quiz") return null;

  return (
    <header className="sticky top-0 z-30 border-b border-charcoal-grey/70 bg-pitch-black/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-cards bg-neon-lime text-pitch-black">
            <Cloud className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="hidden text-body font-w590 text-porcelain sm:inline">
            AWS Quiz
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-buttons px-3 py-1.5 text-caption font-w510 transition-colors sm:text-body ${
                  active
                    ? "bg-deep-slate text-porcelain"
                    : "text-storm-cloud hover:bg-deep-slate/60 hover:text-porcelain"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
