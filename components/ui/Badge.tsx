import { forwardRef, type HTMLAttributes } from "react";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: BadgeVariant;
	size?: "sm" | "md";
}

const variantStyles: Record<BadgeVariant, string> = {
	success: "bg-forest-green/20 text-emerald border-forest-green/30",
	warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
	error: "bg-warning-red/20 text-warning-red border-warning-red/30",
	info: "bg-cyan-spark/20 text-cyan-spark border-cyan-spark/30",
	neutral: "bg-gunmetal text-storm-cloud border-muted-ash",
};

const sizeStyles: Record<NonNullable<BadgeProps["size"]>, string> = {
	sm: "text-caption px-1.5 py-0.5",
	md: "text-body px-2 py-1",
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
