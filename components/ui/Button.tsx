"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "navigation";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
	primary:
		"bg-neon-lime text-pitch-black transition-opacity hover:opacity-90 font-w590",
	secondary:
		"bg-transparent text-porcelain border border-charcoal-grey rounded-buttons transition-colors hover:bg-deep-slate focus:outline-none focus:ring-2 focus:ring-storm-cloud",
	ghost:
		"bg-transparent text-light-steel rounded-buttons transition-colors hover:bg-deep-slate focus:outline-none focus:ring-2 focus:ring-storm-cloud",
	navigation:
		"bg-transparent text-storm-cloud rounded-tags transition-colors hover:bg-deep-slate focus:outline-none",
};

const sizeStyles: Record<ButtonSize, string> = {
	sm: "h-10 px-4 text-sm",
	md: "h-12 px-5 text-body",
	lg: "h-14 px-6 text-body",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			variant = "primary",
			size = "md",
			fullWidth = false,
			className = "",
			disabled,
			type = "button",
			...props
		},
		ref,
	) => {
		const baseStyles =
			"inline-flex items-center justify-center gap-2 font-regular";
		const widthStyle = fullWidth ? "w-full" : "";
		const disabledStyle = disabled ? "opacity-50 cursor-not-allowed" : "";

		const combinedClassName = [
			baseStyles,
			variantStyles[variant],
			sizeStyles[size],
			widthStyle,
			disabledStyle,
			className,
		]
			.filter(Boolean)
			.join(" ");

		return (
			<button
				ref={ref}
				type={type}
				disabled={disabled}
				className={combinedClassName}
				{...props}
			/>
		);
	},
);

Button.displayName = "Button";
