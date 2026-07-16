"use client";

import { useCallback, useEffect, useState } from "react";
import { getIdentityId } from "@/lib/device";
import type { ProgressSnapshot } from "@/lib/progress";

export function useProgress(identityKey?: string) {
  const [data, setData] = useState<ProgressSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    void identityKey;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/stats/overview?deviceId=${encodeURIComponent(getIdentityId())}`, { cache: "no-store" });
      if (!response.ok) throw new Error("progress request failed");
      setData(await response.json());
    } catch {
      setError("We couldn't load your progress right now.");
    } finally {
      setLoading(false);
    }
  }, [identityKey]);

  useEffect(() => {
    const timer = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);
  return { data, loading, error, refresh };
}
