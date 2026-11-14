import { StreamItem } from '../config/siteConfig';

export interface LiveStatusInfo {
  channel: string;
  isLive: boolean;
  title?: string;
  viewers?: number;
  thumbnail?: string;
  category?: string;
}

export interface FetchStatusOptions {
  force?: boolean;
}

// 30s in-memory cache
const cache = new Map<string, { data: LiveStatusInfo; timestamp: number }>();
const CACHE_DURATION_MS = 30 * 1000;

export function clearStreamStatusCache(): void {
  cache.clear();
}

function isDecapiUptimeLive(text: string): boolean {
  const lower = text.trim().toLowerCase();
  if (!lower) return false;
  if (lower.includes('offline') || lower.includes('no user') || lower.includes('error')) {
    return false;
  }
  return /\b(second|minute|hour|day)s?\b/.test(lower);
}

/**
 * Fetches live status for a single Kick or Twitch channel.
 */
export async function fetchChannelStatus(
  stream: StreamItem,
  options: FetchStatusOptions = {}
): Promise<LiveStatusInfo> {
  const channelLower = stream.channel.toLowerCase();
  const cacheKey = `${stream.platform}:${channelLower}`;
  const now = Date.now();

  if (!options.force) {
    const cached = cache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
      return cached.data;
    }
  }

  const defaultOffline: LiveStatusInfo = {
    channel: stream.channel,
    isLive: false,
  };

  if (stream.platform === 'kick') {
    try {
      const response = await fetch(
        `https://kick.com/api/v2/channels/${encodeURIComponent(channelLower)}`,
        {
          headers: { Accept: 'application/json' },
        }
      );

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

  // Twitch live check via DecAPI uptime endpoint with short timeout
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller
    ? globalThis.setTimeout(() => controller.abort(), 4500)
    : null;

  try {
    const response = await fetch(
      `https://decapi.me/twitch/uptime/${encodeURIComponent(channelLower)}`,
      controller ? { signal: controller.signal } : undefined
    );

    if (!response.ok) {
      return defaultOffline;
    }

    const text = await response.text();
    const isLive = isDecapiUptimeLive(text);

    if (!isLive) {
      cache.set(cacheKey, { data: defaultOffline, timestamp: now });
      return defaultOffline;
    }

    const result: LiveStatusInfo = {
      channel: stream.channel,
      isLive: true,
      thumbnail: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${encodeURIComponent(channelLower)}-640x360.jpg`,
    };

    cache.set(cacheKey, { data: result, timestamp: now });
    return result;
  } catch {
    return defaultOffline;
  } finally {
    if (timeoutId !== null) {
      globalThis.clearTimeout(timeoutId);
    }
  }
}

/**
 * Fetches live statuses for multiple channels concurrently.
 */
export async function fetchMultipleStreamStatuses(
  streams: StreamItem[],
  options: FetchStatusOptions = {}
): Promise<Record<string, LiveStatusInfo>> {
  const results = await Promise.allSettled(
    streams.map(async stream => {
      const status = await fetchChannelStatus(stream, options);
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
