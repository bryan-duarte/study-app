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
		"bg-neon-lime text-pitch-black font-w590 rounded-buttons hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(228,242,34,0.35),0_10px_30px_-8px_rgba(228,242,34,0.55)] focus-visible:ring-2 focus-visible:ring-neon-lime focus-visible:ring-offset-2 focus-visible:ring-offset-pitch-black",
	secondary:
		"bg-transparent text-porcelain border border-charcoal-grey rounded-buttons hover:bg-deep-slate hover:border-muted-ash hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-storm-cloud",
	ghost:
		"bg-transparent text-light-steel rounded-buttons hover:bg-deep-slate hover:text-porcelain focus-visible:ring-2 focus-visible:ring-storm-cloud",
	navigation:
		"bg-transparent text-storm-cloud rounded-tags hover:bg-deep-slate hover:text-porcelain",
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
			"inline-flex items-center justify-center gap-2 font-regular select-none transition-all duration-200 ease-out active:scale-[0.97] focus:outline-none";
		const widthStyle = fullWidth ? "w-full" : "";
		const disabledStyle = disabled
			? "opacity-50 cursor-not-allowed pointer-events-none"
			: "";

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
