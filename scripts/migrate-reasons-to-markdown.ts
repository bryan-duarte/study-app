/**
 * Migration Script: Convert plain-text reasoning to optimized markdown
 *
 * This script converts existing plain-text reasoning fields in the questions
 * table to optimized markdown format for better readability.
 *
 * Usage:
 *   npx tsx scripts/migrate-reasons-to-markdown.ts
 *   npx tsx scripts/migrate-reasons-to-markdown.ts --write
 */

import { createClient } from "@supabase/supabase-js";

interface JsonbOption {
	id: string;
	description: string;
	is_correct: boolean;
	reasoning: string;
}

interface Question {
	id: string;
	title: string;
	type: string;
	options: JsonbOption[];
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error("❌ Missing Supabase credentials");
	console.error(
		"Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
	);
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Convert plain text to optimized markdown
 * Rules:
 * - Split into paragraphs (2-3 sentences max)
 * - Wrap code references in backticks
 * - Format lists with bullets
 * - Add section headers for complex explanations
 */
function convertToMarkdown(text: string): string {
	if (!text || text.trim().length === 0) {
		return text;
	}

	// Split into sentences
	const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

	const paragraphs: string[] = [];
	let currentParagraph: string[] = [];

	// Common AWS service names and technical terms
	const technicalTerms = [
		"EC2",
		"S3",
		"RDS",
		"Lambda",
		"IAM",
		"VPC",
		"CloudFormation",
		"CloudWatch",
		"DynamoDB",
		"EBS",
		"ELB",
		"ALB",
		"NLB",
		"API Gateway",
		"SNS",
		"SQS",
		"Kinesis",
		"ECS",
		"EKS",
		"Fargate",
		"Route 53",
		"ACM",
		"WAF",
		"Shield",
		"CloudFront",
		"Elasticache",
		"RDS Proxy",
		"DMS",
		"S3 Glacier",
		"EFS",
		"FSx",
	];

	for (const sentence of sentences) {
		// Format technical terms with backticks
		let withCodeFormatting = sentence.trim();
		for (const term of technicalTerms) {
			const regex = new RegExp(`\\b${term}\\b`, "gi");
			withCodeFormatting = withCodeFormatting.replace(regex, "`$&`");
		}

		currentParagraph.push(withCodeFormatting);

		// Start new paragraph after 2-3 sentences or on structural breaks
		if (
			currentParagraph.length >= 2 &&
			/(?:The |This |In |For |However |Therefore |Additionally )/.test(sentence)
		) {
			paragraphs.push(currentParagraph.join(" "));
			currentParagraph = [];
		}
	}

	// Add remaining sentences
	if (currentParagraph.length > 0) {
		paragraphs.push(currentParagraph.join(" "));
	}

	// Join paragraphs with double line breaks
	return paragraphs.join("\n\n");
}

/**
 * Add structure to complex explanations
 */
function addStructure(markdown: string): string {
	// If explanation is long (>200 chars), add sections
	if (markdown.length > 200) {
		const lines = markdown.split("\n");
		let result = "";
		let hasAddedKeyPoints = false;
		let hasAddedAdditionalInfo = false;

		for (const line of lines) {
			const lowerLine = line.toLowerCase();

			// Add section header before key points or examples
			if (
				(lowerLine.includes("key") || lowerLine.includes("important")) &&
				!hasAddedKeyPoints
			) {
				result += "\n### Key Points\n\n";
				hasAddedKeyPoints = true;
			} else if (
				(lowerLine.includes("example") ||
					lowerLine.includes("note") ||
					lowerLine.includes("remember")) &&
				!hasAddedAdditionalInfo
			) {
				result += "\n### Additional Info\n\n";
				hasAddedAdditionalInfo = true;
			}

			result += line + "\n";
		}

		return result.trim();
	}

	return markdown;
}

/**
 * Process a single question's reasoning fields
 */
function processQuestion(question: Question): Question {
	return {
		...question,
		options: question.options.map((option) => ({
			...option,
			reasoning: addStructure(convertToMarkdown(option.reasoning)),
		})),
	};
}

/**
 * Main migration function
 */
async function migrateQuestions(dryRun = true) {
	console.log(`🔄 Running migration (dry run: ${dryRun})`);

	// Fetch all questions
	const { data: questions, error } = await supabase
		.from("questions")
		.select("*");

	if (error) {
		console.error("❌ Error fetching questions:", error);
		process.exit(1);
	}

	console.log(`📦 Found ${questions.length} questions`);

	// Process each question
	const processed = questions.map(processQuestion);

	// Show sample of changes
	console.log("\n📝 Sample changes:");
	console.log("--- Before ---");
	console.log(questions[0].options[0].reasoning);
	console.log("\n--- After ---");
	console.log(processed[0].options[0].reasoning);

	if (dryRun) {
		console.log("\n⚠️  Dry run complete. Run with --write to apply changes.");
		return;
	}

	// Apply changes
	console.log("\n💾 Writing to database...");

	let successCount = 0;
	let errorCount = 0;

	for (const question of processed) {
		const { error } = await supabase
			.from("questions")
			.update({ options: question.options })
			.eq("id", question.id);

		if (error) {
			console.error(`❌ Error updating question ${question.id}:`, error);
			errorCount++;
		} else {
			successCount++;
		}
	}

	console.log(
		`✅ Migration complete! ${successCount} questions updated, ${errorCount} errors.`,
	);
}

// CLI interface
const args = process.argv.slice(2);
const dryRun = !args.includes("--write");

migrateQuestions(dryRun);
