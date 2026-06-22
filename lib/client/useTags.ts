"use client";

import { useEffect, useState, useCallback } from "react";
import type { TagWithCount } from "@/types/quiz";

/**
 * Fetches the current user's tags with question counts.
 *
 * Intended to be used at the PAGE level (Explorer filter bar, management
 * page) so the tag list is fetched once and shared with many cards, rather
 * than re-fetched per TagSelector.
 */
export function useTags() {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tags?withCounts=true", { cache: "no-store" });
      if (!res.ok) throw new Error("tags failed");
      const data = (await res.json()) as { tags: TagWithCount[] };
      setTags(data.tags);
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

  return { tags, loading, error, reload };
}
