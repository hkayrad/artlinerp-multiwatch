import { Platform, StreamItem } from '../config/siteConfig';
import type { LiveStatusInfo } from '../services/streamStatus';

/**
 * URL veya kullanıcı adı girdisini platform ve kanal adına ayrıştırır.
 * Desteklenen formatlar:
 * - "elraenn" -> varsayılan platformla eşleşir
 * - "twitch.tv/elraenn", "https://www.twitch.tv/elraenn"
 * - "kick.com/elraenn", "https://kick.com/elraenn"
 */
export function parseChannelInput(
  input: string,
  defaultPlatform: Platform = 'twitch'
): { channel: string; platform: Platform } {
  const trimmed = input.trim().replace(/^@/, '');

  // Twitch URL eşleşmesi
  const twitchMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]{3,30})/i);
  if (twitchMatch) {
    return { channel: twitchMatch[1].toLowerCase(), platform: 'twitch' };
  }

  // Kick URL eşleşmesi
  const kickMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?kick\.com\/([a-zA-Z0-9_]{3,30})/i);
  if (kickMatch) {
    return { channel: kickMatch[1].toLowerCase(), platform: 'kick' };
  }

  // Sadece kullanıcı adı verilmişse
  const cleanUsername = trimmed.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
  return {
    channel: cleanUsername,
    platform: defaultPlatform,
  };
}

/**
 * Yayın listesini URL arama parametresine dönüştürür.
 * Format: "t:streamer1,k:streamer2" veya "twitch:streamer1,kick:streamer2"
 */
export function serializeStreamsToQuery(streams: StreamItem[]): string {
  if (streams.length === 0) return '';
  return streams
    .map(s => `${s.platform === 'twitch' ? 't' : 'k'}:${s.channel}`)
    .join(',');
}

/**
 * URL arama parametresinden yayın listesini çözer.
 */
export function deserializeStreamsFromQuery(query: string): { channel: string; platform: Platform }[] {
  if (!query) return [];
  const parts = query.split(',');
  const results: { channel: string; platform: Platform }[] = [];

  for (const part of parts) {
    const [prefix, rawChannel] = part.split(':');
    if (!prefix || !rawChannel) continue;

    const channel = rawChannel.trim().toLowerCase();
    if (!channel) continue;

    const platform: Platform = (prefix === 't' || prefix === 'twitch') ? 'twitch' : 'kick';
    results.push({ channel, platform });
  }

  return results;
}

/**
 * Mevcut alan adını Twitch parent parametresi için hazırlar.
 * Twitch IP adreslerini (örn: 127.0.0.1) kabul etmez, localhost veya geçerli alan adı gerektirir.
 */
export function getParentDomain(): string {
  if (typeof window === 'undefined') return 'localhost';
  const hostname = window.location.hostname;
  if (!hostname || hostname === '127.0.0.1') return 'localhost';
  return hostname;
}

/**
 * Hydrates StreamItem objects from a serialized query string, matching known
 * config streams and preserving existing stream IDs to avoid iframe reloads.
 */
export function hydrateStreamsFromQuery(
  query: string,
  configStreams: StreamItem[],
  existingStreams: StreamItem[] = []
): StreamItem[] {
  const parsed = deserializeStreamsFromQuery(query);
  if (parsed.length === 0) return [];

  return parsed.map((item) => {
    const channelLower = item.channel.toLowerCase();

    const existing = existingStreams.find(
      s => s.channel.toLowerCase() === channelLower && s.platform === item.platform
    );
    if (existing) return existing;

    const matched = configStreams.find(
      s => s.channel.toLowerCase() === channelLower && s.platform === item.platform
    );
    if (matched) return matched;

    return {
      id: `${item.platform}-${channelLower}`,
      name: item.channel,
      channel: item.channel,
      platform: item.platform,
      village: 'diger',
    };
  });
}

/**
 * Sorts streams so live channels appear first (highest viewer count first),
 * preserving original order for offline channels.
 */
export function sortStreamsLiveFirst(
  streams: StreamItem[],
  statuses: Record<string, LiveStatusInfo>
): StreamItem[] {
  return [...streams].sort((a, b) => {
    const aLive = Boolean(statuses[a.id]?.isLive);
    const bLive = Boolean(statuses[b.id]?.isLive);
    if (aLive !== bLive) return aLive ? -1 : 1;
    if (aLive && bLive) {
      const aViewers = statuses[a.id]?.viewers ?? 0;
      const bViewers = statuses[b.id]?.viewers ?? 0;
      return bViewers - aViewers;
    }
    return 0;
  });
}

/**
 * Filters a village's stream list according to preset mode ('live' vs 'all').
 */
export function selectVillagePresetStreams(
  streams: StreamItem[],
  statuses: Record<string, LiveStatusInfo>,
  mode: 'live' | 'all'
): StreamItem[] {
  if (mode === 'all') return streams;
  const live = streams.filter(s => statuses[s.id]?.isLive);
  return sortStreamsLiveFirst(live, statuses);
}

/**
 * Moves a stream one slot backward or forward without mutating the original array.
 */
export function moveStreamByDirection(
  streams: StreamItem[],
  id: string,
  direction: 'prev' | 'next'
): StreamItem[] {
  const idx = streams.findIndex(s => s.id === id);
  if (idx === -1) return streams;
  const targetIdx = direction === 'prev' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= streams.length) return streams;
  const copy = [...streams];
  [copy[idx], copy[targetIdx]] = [copy[targetIdx], copy[idx]];
  return copy;
}

/**
 * Swaps two streams by ID without mutating the original array.
 */
export function swapStreamsById(
  streams: StreamItem[],
  sourceId: string,
  targetId: string
): StreamItem[] {
  if (sourceId === targetId) return streams;
  const sourceIdx = streams.findIndex(s => s.id === sourceId);
  const targetIdx = streams.findIndex(s => s.id === targetId);
  if (sourceIdx === -1 || targetIdx === -1) return streams;
  const copy = [...streams];
  [copy[sourceIdx], copy[targetIdx]] = [copy[targetIdx], copy[sourceIdx]];
  return copy;
}

export type TheatreBand = '2' | '3' | '4' | '5' | '6-7' | '8-9' | '10+';

/**
 * Maps multi-stream count to container-query Theatre mode band.
 */
export function getTheatreBand(count: number): TheatreBand {
  if (count <= 2) return '2';
  if (count === 3) return '3';
  if (count === 4) return '4';
  if (count === 5) return '5';
  if (count <= 7) return '6-7';
  if (count <= 9) return '8-9';
  return '10+';
}
