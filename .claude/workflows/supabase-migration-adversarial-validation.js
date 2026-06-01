export const meta = {
	name: "supabase-migration-adversarial-validation",
	description: "Adversarial validation of Supabase migration implementation",
	phases: [
		{ title: "Review", detail: "Code review from multiple perspectives" },
		{ title: "Verify", detail: "Implementation verification and testing" },
		{ title: "Validate", detail: "Security and architecture validation" },
	],
};

phase("Review");
log("Starting adversarial code review...");

// Parallel review from different perspectives
const reviewResults = await parallel([
	() =>
		agent(
			`
Review the Supabase migration implementation for CORRECTNESS and BUGS.

Focus on these files:
- lib/supabase.ts
- lib/env.ts
- lib/transformers/question.ts
- lib/repository/QuizRepository.ts
- app/api/questions/route.ts
- app/api/auth/* routes
- app/api/quiz/progress/route.ts
- app/api/quiz/analytics/route.ts
- lib/utils/retry.ts
- components/ErrorBoundary.tsx
- components/ui/Paginator.tsx
- components/quiz/QuizContainer.tsx
- store/quizStore.ts
- scripts/migrate-json-to-supabase.ts
- supabase/migrations/20240531000000_initial_schema.sql

Check for:
- Logical bugs and edge cases
- Type safety issues
- Error handling gaps
- Race conditions
- Memory leaks
- Incorrect data transformations
- API contract violations

Return a detailed list of any bugs or issues found, with file names and line numbers.
`,
			{
				label: "review-correctness",
				agentType: "code-review-bugs-investigator",
			},
		),

	() =>
		agent(
			`
Review the Supabase migration implementation for SECURITY VULNERABILITIES.

Focus on:
- OWASP Top 10 vulnerabilities
- API key exposure risks
- SQL injection possibilities
- XSS vulnerabilities
- Authentication/authorization flaws
- Environment variable handling
- Data validation at boundaries

Check all API routes, authentication code, and data transformation logic.

Return any security concerns found with severity ratings (High/Medium/Low) and remediation steps.
`,
			{ label: "review-security", agentType: "code-review-owasp-investigator" },
		),

	() =>
		agent(
			`
Review the Supabase migration implementation for ARCHITECTURAL CONSISTENCY.

Focus on:
- Does the implementation follow the existing codebase patterns?
- Are there architectural drifts or inconsistencies?
- Does it follow the repository pattern correctly?
- Are separation of concerns maintained?
- Is the data flow clean and logical?

Compare the new Supabase implementation with the existing JSON-based approach and identify any architectural issues.

Return any architectural concerns or improvements needed.
`,
			{
				label: "review-architecture",
				agentType: "code-review-architecture-investigator",
			},
		),

	() =>
		agent(
			`
Review the Supabase migration implementation for PERFORMANCE ISSUES.

Focus on:
- Database query efficiency
- N+1 query problems
- Bundle size impact
- Memory usage patterns
- API route performance
- Pagination efficiency
- Retry logic effectiveness

Return any performance concerns with optimization recommendations.
`,
			{
				label: "review-performance",
				agentType: "code-review-hard-investigator",
			},
		),
]);

phase("Verify");
log("Synthesizing review findings...");

// Synthesize findings and identify critical issues
const synthesis = await agent(
	`
Synthesize the adversarial review findings and identify:

1. Critical issues that MUST be fixed before the app can work
2. Medium priority issues that should be fixed soon
3. Low priority improvements
4. False positives (issues that aren't actually problems)

Review findings:
${reviewResults
	.map(
		(r) => `
=== ${r.label} ===
${r}
`,
	)
	.join("\n")}

Return a structured summary with action items prioritized by severity.
`,
	{ label: "synthesize-findings" },
);

phase("Validate");
log("Final validation and testing recommendations...");

// Final validation
const validation = await agent(
	`
Based on the adversarial review, create a FINAL VALIDATION REPORT that includes:

1. Implementation Completeness Check
   - Are all 32 tasks from the plan completed?
   - Are all files created and correct?
   - Is the database schema complete?
   - Are API routes functional?

2. Integration Readiness Check
   - Can the app start without errors?
   - Are environment variables properly handled?
   - Is the data migration script ready?
   - Will the existing quiz components work with the new API?

3. Testing Recommendations
   - What manual tests should be run?
   - What edge cases need testing?
   - What's the rollback plan if issues arise?

4. Go/No-Go Recommendation
   - Is the implementation ready for production use?
   - What blockers remain?

Return a comprehensive validation report with clear recommendations.
`,
	{ label: "final-validation" },
);

log("═══════════════════════════════════════════════");
log("ADVERSARIAL VALIDATION COMPLETE");
log("═══════════════════════════════════════════════");

return {
  reviews: reviewResults,
  synthesis: synthesis,
  validation: validation,
  success: true
}
