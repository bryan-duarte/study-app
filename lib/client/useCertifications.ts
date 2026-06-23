"use client";

import { useEffect } from "react";
import { useCertificationStore } from "@/store/certificationStore";
import type { Certification } from "@/types/quiz";

async function fetchActiveCertifications(): Promise<Certification[]> {
	const res = await fetch("/api/certifications", { cache: "no-store" });
	if (!res.ok) throw new Error("certifications failed");
	const data = (await res.json()) as { certifications?: Certification[] };
	return data.certifications ?? [];
}

/**
 * Loads the active certifications into the store on mount and exposes the
 * current selection. The store auto-defaults the active cert to the first one
 * when nothing is persisted (today: SAA-C03, the only certification).
 */
export function useCertifications() {
	const certifications = useCertificationStore((s) => s.certifications);
	const activeCertificationId = useCertificationStore(
		(s) => s.activeCertificationId,
	);
	const setCertifications = useCertificationStore((s) => s.setCertifications);
	const setActiveCertification = useCertificationStore(
		(s) => s.setActiveCertification,
	);

	useEffect(() => {
		let cancelled = false;
		fetchActiveCertifications()
			.then((certs) => {
				if (!cancelled) setCertifications(certs);
			})
			.catch(() => {
				// Non-fatal: the selector falls back to the persisted/empty state.
			});
		return () => {
			cancelled = true;
		};
	}, [setCertifications]);

	const activeCertification =
		certifications.find((c) => c.id === activeCertificationId) ?? null;

	return {
		certifications,
		activeCertification,
		activeCertificationId,
		setActiveCertification,
	};
}
