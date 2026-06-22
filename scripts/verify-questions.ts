/**
 * Verify the Supabase questions table faithfully matches public/questions.json.
 * Connects with the service-role key, fetches all rows, and checks:
 *   - row count == source count
 *   - every option has a uuid id; every question has >=1 correct option; type valid
 *   - content fidelity via MULTISET equality of canonical keys (handles duplicate
 *     questions that share identical option text, e.g. Yes/No style)
 *
 * Usage: npx tsx scripts/verify-questions.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";
config({ path: resolve(process.cwd(), ".env.local") });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function main() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) {
		console.error("Missing Supabase env vars");
		process.exit(1);
	}
	const { createClient } = await import("@supabase/supabase-js");
	const supabase = createClient(url, key);

	const source = JSON.parse(
		readFileSync(resolve(process.cwd(), "public", "questions.json"), "utf8"),
	) as Array<{
		type: string;
		title: string;
		options: Array<{ description: string; is_correct: boolean; reasoning: string }>;
	}>;

	const { data: db, error } = await supabase.from("questions").select("type,title,options");
	if (error) {
		console.error("Fetch failed:", error);
		process.exit(1);
	}

	let problems = 0;
	const report = (m: string) => {
		problems++;
		console.error("  ✗ " + m);
	};

	if (db!.length !== source.length)
		report(`count mismatch: db=${db!.length} source=${source.length}`);

	// structural checks
	let badId = 0,
		noCorrect = 0,
		badType = 0,
		badShape = 0;
	for (const q of db! as Array<any>) {
		if (!["single-option", "multi-option"].includes(q.type)) badType++;
		if (!Array.isArray(q.options)) {
			report(`question has non-array options: ${(q.title || "").slice(0, 40)}`);
			continue;
		}
		if (!q.options.some((o: any) => o.is_correct === true)) noCorrect++;
		for (const o of q.options) {
			if (typeof o.id !== "string" || !UUID.test(o.id)) badId++;
			if (
				typeof o.description !== "string" ||
				typeof o.is_correct !== "boolean" ||
				typeof o.reasoning !== "string"
			)
				badShape++;
		}
	}
	if (badId) report(`${badId} options missing/invalid uuid id`);
	if (badType) report(`${badType} questions with invalid type`);
	if (noCorrect) report(`${noCorrect} questions with no correct option`);
	if (badShape) report(`${badShape} options with wrong field shape`);

	// content fidelity: multiset equality of canonical keys (ignores random option ids)
	const canon = (q: any) =>
		JSON.stringify({
			type: q.type,
			title: q.title,
			options: q.options
				.map((o: any) => ({
					description: o.description,
					is_correct: o.is_correct,
					reasoning: o.reasoning,
				}))
				.sort((a: any, b: any) => (a.description < b.description ? -1 : 1)),
		});
	const tally = (arr: any[]) => {
		const m = new Map<string, number>();
		for (const x of arr) m.set(canon(x), (m.get(canon(x)) ?? 0) + 1);
		return m;
	};
	const srcCounts = tally(source as any[]);
	const dbCounts = tally(db as any[]);
	let missing = 0,
		extra = 0;
	for (const [k, v] of srcCounts) if ((dbCounts.get(k) ?? 0) < v) missing += v - (dbCounts.get(k) ?? 0);
	for (const [k, v] of dbCounts) if ((srcCounts.get(k) ?? 0) < v) extra += v - (srcCounts.get(k) ?? 0);
	if (missing) report(`${missing} source questions not faithfully present in DB`);
	if (extra) report(`${extra} DB questions not matching any source question`);

	const srcDistinct = srcCounts.size;
	const dupQuestions = source.length - srcDistinct;

	console.log("\n=== Verification ===");
	console.log(`source questions   : ${source.length}`);
	console.log(`db questions        : ${db!.length}`);
	console.log(`distinct (by canon) : ${srcDistinct}  (duplicates in source: ${dupQuestions})`);
	console.log(`multiset missing    : ${missing}`);
	console.log(`multiset extra      : ${extra}`);
	console.log(`options w/o uuid    : ${badId}`);
	console.log(`questions no-correct: ${noCorrect}`);
	console.log(
		problems === 0
			? "\n✅ VERIFICATION PASSED — DB faithfully matches source."
			: `\n❌ ${problems} problem(s).`,
	);
	process.exit(problems === 0 ? 0 : 2);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
