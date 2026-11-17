import { useState, useEffect, useCallback } from 'react';
import { StreamItem } from '../config/siteConfig';
import { fetchMultipleStreamStatuses, LiveStatusInfo } from '../services/streamStatus';

export function useLiveStatus(rosterStreams: StreamItem[], extraStreams: StreamItem[] = []) {
  const [statuses, setStatuses] = useState<Record<string, LiveStatusInfo>>({});
  const [isLoading, setIsLoading] = useState(true);

  const checkStatuses = useCallback(async (force = false) => {
    if (force) {
      setIsLoading(true);
    }

    // Deduplicate roster streams + any active custom streams
    const seen = new Set<string>();
    const combined: StreamItem[] = [];
    for (const s of [...rosterStreams, ...extraStreams]) {
      const key = `${s.platform}:${s.channel.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(s);
      }
    }

    try {
      const results = await fetchMultipleStreamStatuses(combined, { force });
      setStatuses(results);
    } finally {
      setIsLoading(false);
    }
  }, [rosterStreams, extraStreams]);

  useEffect(() => {
    checkStatuses(false);

    // Background refresh every 45s
    const interval = setInterval(() => {
      checkStatuses(false);
    }, 45 * 1000);

    return () => clearInterval(interval);
  }, [checkStatuses]);

  const refresh = useCallback(() => checkStatuses(true), [checkStatuses]);

  return {
    statuses,
    isLoading,
    refresh,
  };
}
