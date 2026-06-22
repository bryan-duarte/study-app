"use client";

import { useEffect, useState, useCallback } from "react";
import type { StatsResponse } from "@/types/quiz";

/** Fetches aggregate study stats (mastery, streak, due, per-domain, trend). */
export function useStats() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quiz/stats", { cache: "no-store" });
      if (!res.ok) throw new Error("stats failed");
      setStats((await res.json()) as StatsResponse);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { stats, loading, error, reload };
}
