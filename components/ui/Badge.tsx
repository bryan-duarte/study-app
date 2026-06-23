import { forwardRef, type HTMLAttributes } from "react";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: BadgeVariant;
	size?: "sm" | "md";
}

const variantStyles: Record<BadgeVariant, string> = {
	success: "bg-emerald/15 text-emerald border-emerald/30",
	warning: "bg-amber-400/15 text-amber-300 border-amber-400/30",
	error: "bg-warning-red/15 text-warning-red border-warning-red/30",
	info: "bg-signal-violet/15 text-signal-violet border-signal-violet/30",
	neutral: "bg-gunmetal/50 text-storm-cloud border-muted-ash",
};

const sizeStyles: Record<NonNullable<BadgeProps["size"]>, string> = {
	sm: "text-caption px-2 py-0.5 tracking-[0.01em]",
	md: "text-body px-2.5 py-1",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
	({ variant = "neutral", size = "md", className = "", ...props }, ref) => {
		const baseStyles =
			"inline-flex items-center font-regular rounded-badges border";
		const combinedClassName = [
			baseStyles,
			variantStyles[variant],
			sizeStyles[size],
			className,
		]
			.filter(Boolean)
			.join(" ");

		return <span ref={ref} className={combinedClassName} {...props} />;
	},
);

Badge.displayName = "Badge";
