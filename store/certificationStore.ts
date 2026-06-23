import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Certification } from "@/types/quiz";

/**
 * Single source of truth for the active certification.
 *
 * The selector writes `activeCertificationId`; every consumer (quiz start,
 * history, stats, export, home greeting) reads it. Only the active id is
 * persisted — the certification list is re-fetched from /api/certifications on
 * load (via useCertifications) to avoid serving stale cert metadata.
 */
interface CertificationState {
	activeCertificationId: string | null;
	certifications: Certification[];
	setActiveCertification: (id: string) => void;
	/** Replace the list; default the active cert to the first one when the
	 *  stored id is missing or no longer present. */
	setCertifications: (certifications: Certification[]) => void;
}

function resolveActiveId(
	current: string | null,
	certifications: Certification[],
): string | null {
	const currentStillExists =
		current !== null && certifications.some((c) => c.id === current);
	if (currentStillExists) return current;
	return certifications[0]?.id ?? null;
}

export const useCertificationStore = create<CertificationState>()(
	persist(
		(set, get) => ({
			activeCertificationId: null,
			certifications: [],

			setActiveCertification: (id) => {
				set({ activeCertificationId: id });
			},

			setCertifications: (certifications) => {
				set({
					certifications,
					activeCertificationId: resolveActiveId(
						get().activeCertificationId,
						certifications,
					),
				});
			},
		}),
		{
			name: "certification-storage",
			// Persist only the chosen cert; the list is always fetched fresh.
			partialize: (state) => ({
				activeCertificationId: state.activeCertificationId,
			}),
		},
	),
);
