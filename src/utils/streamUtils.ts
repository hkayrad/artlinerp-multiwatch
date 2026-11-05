import { Platform, StreamItem } from '../config/siteConfig';

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
 */
export function getParentDomain(): string {
  if (typeof window === 'undefined') return 'localhost';
  return window.location.hostname || 'localhost';
}
