import { forwardRef, type HTMLAttributes } from "react";

type CardVariant = "default" | "elevated" | "nested";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
	variant?: CardVariant;
	padding?: "none" | "sm" | "md" | "lg";
}

// Surfaces are distinguished by tonal stacking + an inset hairline highlight,
// never by outer drop shadows (DESIGN.md elevation rule).
const variantStyles: Record<NonNullable<CardProps["variant"]>, string> = {
	default:
		"bg-graphite rounded-cards border border-charcoal-grey/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
	elevated:
		"bg-deep-slate rounded-t-xl border border-charcoal-grey/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
	nested: "bg-pitch-black rounded-cards border border-charcoal-grey/50",
};

const paddingStyles: Record<NonNullable<CardProps["padding"]>, string> = {
	none: "",
	sm: "p-2",
	md: "p-3",
	lg: "p-6",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
	(
		{ variant = "default", padding = "md", className = "", children, ...props },
		ref,
	) => {
		const baseStyles = variantStyles[variant];
		const combinedClassName = [baseStyles, paddingStyles[padding], className]
			.filter(Boolean)
			.join(" ");

		return (
			<div ref={ref} className={combinedClassName} {...props}>
				{children}
			</div>
		);
	},
);

Card.displayName = "Card";

export const CardHeader = forwardRef<
	HTMLHeadingElement,
	HTMLAttributes<HTMLHeadingElement>
>(({ className = "", ...props }, ref) => (
	<h3
		ref={ref}
		className={`text-heading font-w510 text-porcelain mb-2 ${className}`}
		{...props}
	/>
));

CardHeader.displayName = "CardHeader";

export const CardBody = forwardRef<
	HTMLDivElement,
	HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
	<div
		ref={ref}
		className={`text-body font-regular text-light-steel ${className}`}
		{...props}
	/>
));

CardBody.displayName = "CardBody";

export const CardFooter = forwardRef<
	HTMLDivElement,
	HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
	<div
		ref={ref}
		className={`mt-4 pt-4 border-t border-charcoal-grey ${className}`}
		{...props}
	/>
));

CardFooter.displayName = "CardFooter";
