/**
 * Error Boundary Component
 * Catches React errors and displays a fallback UI with retry functionality
 */

"use client";

import { Component, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class QuizErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
		};
	}

	static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Quiz Error Boundary caught an error:", error, errorInfo);
	}

	handleReset = () => {
		this.setState({
			hasError: false,
			error: null,
		});
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="flex items-center justify-center min-h-screen bg-pitch-black">
					<div className="bg-elevated-surface border border-white/10 rounded-lg p-8 max-w-md">
						<h2 className="text-xl font-semibold text-white mb-4">
							Something went wrong
						</h2>

						{this.state.error && (
							<p className="text-body text-white/70 mb-6">
								{this.state.error.message}
							</p>
						)}

						<div className="flex gap-4">
							<button
								onClick={this.handleReset}
								className="bg-neon-lime text-black px-4 py-2 rounded hover:opacity-90 transition-opacity"
							>
								Try Again
							</button>
							<button
								onClick={() => (window.location.href = "/")}
								className="bg-white/10 text-white px-4 py-2 rounded hover:bg-white/20 transition-colors"
							>
								Go Home
							</button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
