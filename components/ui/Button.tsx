"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "navigation";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	fullWidth?: boolean;
}

// Elevation follows DESIGN.md: no outer drop shadows. The primary pill gets an
// inset top "beveled-LED" highlight; outlined variants get a hairline inset.
const variantStyles: Record<ButtonVariant, string> = {
	primary:
		"bg-neon-lime text-pitch-black font-w510 rounded-buttons shadow-[inset_0_2.5px_0_-2px_rgba(255,255,255,0.35)] hover:brightness-[1.07] focus-visible:ring-2 focus-visible:ring-neon-lime focus-visible:ring-offset-2 focus-visible:ring-offset-pitch-black",
	secondary:
		"bg-transparent text-porcelain border border-muted-ash rounded-buttons shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.08)] hover:bg-deep-slate hover:border-gunmetal focus-visible:ring-2 focus-visible:ring-storm-cloud",
	ghost:
		"bg-transparent text-light-steel rounded-buttons hover:bg-deep-slate hover:text-porcelain focus-visible:ring-2 focus-visible:ring-storm-cloud",
	navigation:
		"bg-transparent text-storm-cloud rounded-tags hover:bg-deep-slate hover:text-porcelain",
};

const sizeStyles: Record<ButtonSize, string> = {
	sm: "h-10 px-5 text-sm",
	md: "h-12 px-6 text-body",
	lg: "h-14 px-7 text-body",
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
