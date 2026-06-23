"use client";

import { useEffect, useState, useCallback } from "react";
import type { StatsResponse } from "@/types/quiz";
import { useCertificationStore } from "@/store/certificationStore";

/** Fetches aggregate study stats (mastery, streak, due, per-domain, trend)
 *  scoped to the active certification. */
export function useStats() {
  const activeCertificationId = useCertificationStore(
    (s) => s.activeCertificationId,
  );
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const query = activeCertificationId
        ? `?certification_id=${encodeURIComponent(activeCertificationId)}`
        : "";
      const res = await fetch(`/api/quiz/stats${query}`, { cache: "no-store" });
      if (!res.ok) throw new Error("stats failed");
      setStats((await res.json()) as StatsResponse);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [activeCertificationId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { stats, loading, error, reload };
}
