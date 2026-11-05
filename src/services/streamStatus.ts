import { StreamItem } from '../config/siteConfig';

export interface LiveStatusInfo {
  channel: string;
  isLive: boolean;
  title?: string;
  viewers?: number;
  thumbnail?: string;
  category?: string;
}

// Bellekte 30 saniyelik hafif önbellek
const cache = new Map<string, { data: LiveStatusInfo; timestamp: number }>();
const CACHE_DURATION_MS = 30 * 1000;

/**
 * Tekil bir kanalın canlı yayın durumunu kontrol eder.
 */
export async function fetchChannelStatus(stream: StreamItem): Promise<LiveStatusInfo> {
  const cacheKey = `${stream.platform}:${stream.channel.toLowerCase()}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }

  // Varsayılan çevrimdışı durumu
  const defaultOffline: LiveStatusInfo = {
    channel: stream.channel,
    isLive: false,
  };

  if (stream.platform === 'kick') {
    try {
      const response = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(stream.channel.toLowerCase())}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return defaultOffline;
      }

      const json = await response.json();
      const livestream = json?.livestream;
      const isLive = Boolean(livestream && livestream.is_live);

      const result: LiveStatusInfo = {
        channel: stream.channel,
        isLive,
        title: livestream?.session_title || undefined,
        viewers: typeof livestream?.viewer_count === 'number' ? livestream.viewer_count : undefined,
        thumbnail: livestream?.thumbnail?.url || undefined,
        category: livestream?.categories?.[0]?.name || undefined,
      };

      cache.set(cacheKey, { data: result, timestamp: now });
      return result;
    } catch {
      return defaultOffline;
    }
  }

  // Twitch için varsayılan fallback
  return defaultOffline;
}

/**
 * Birden fazla yayının canlı durumunu eşzamanlı sorgular.
 */
export async function fetchMultipleStreamStatuses(
  streams: StreamItem[]
): Promise<Record<string, LiveStatusInfo>> {
  const results = await Promise.allSettled(
    streams.map(async stream => {
      const status = await fetchChannelStatus(stream);
      return { id: stream.id, status };
    })
  );

  const statusMap: Record<string, LiveStatusInfo> = {};
  results.forEach(res => {
    if (res.status === 'fulfilled') {
      statusMap[res.value.id] = res.value.status;
      statusMap[res.value.status.channel.toLowerCase()] = res.value.status;
    }
  });

  return statusMap;
}
