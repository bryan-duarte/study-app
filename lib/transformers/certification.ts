/**
 * Certification transformer: Supabase snake_case row → app camelCase.
 * Mirrors lib/transformers/question.ts.
 */

import type { Database } from "@/types/supabase-generated";
import type { Certification } from "@/types/quiz";

type CertificationRow = Database["public"]["Tables"]["certifications"]["Row"];

export function transformCertification(row: CertificationRow): Certification {
	return {
		id: row.id,
		name: row.name,
		slug: row.slug,
		examCode: row.exam_code,
		provider: row.provider,
		description: row.description,
		isActive: row.is_active,
		sortOrder: row.sort_order,
	};
}
