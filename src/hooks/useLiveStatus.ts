import { useState, useEffect, useCallback } from 'react';
import { StreamItem, siteConfig } from '../config/siteConfig';
import { fetchMultipleStreamStatuses, LiveStatusInfo } from '../services/streamStatus';

export function useLiveStatus() {
  const [statuses, setStatuses] = useState<Record<string, LiveStatusInfo>>({});
  const [isLoading, setIsLoading] = useState(true);

  const checkStatuses = useCallback(async () => {
    const allConfigStreams: StreamItem[] = [
      ...siteConfig.villages.konoha.streams,
      ...siteConfig.villages.suna.streams,
    ];

    try {
      const results = await fetchMultipleStreamStatuses(allConfigStreams);
      setStatuses(results);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatuses();

    // 45 saniyede bir durumu arka planda güncelle
    const interval = setInterval(() => {
      checkStatuses();
    }, 45 * 1000);

    return () => clearInterval(interval);
  }, [checkStatuses]);

  return {
    statuses,
    isLoading,
    refresh: checkStatuses,
  };
}
