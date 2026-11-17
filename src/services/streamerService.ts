import { ALL_CONFIG_STREAMS, Platform, StreamItem } from '../config/siteConfig';
import { compareStreamNames } from '../utils/streamUtils';

export type StreamerVillage = StreamItem['village'];

export interface StreamerInput {
  name: string;
  channel: string;
  platform: Platform;
  village: StreamerVillage;
  roleTag?: string;
  isDefaultActive?: boolean;
}

export interface StreamerLoadResult {
  streams: StreamItem[];
  source: 'api' | 'static' | 'config';
}

export interface StreamerMutationResult {
  item?: StreamItem;
  deleted?: string;
  streams: StreamItem[];
}

const VALID_PLATFORMS = new Set<Platform>(['kick', 'twitch']);
const VALID_VILLAGES = new Set<StreamerVillage>(['konoha', 'suna', 'diger']);

export function parseStreamerChannelInput(
  input: string,
  defaultPlatform: Platform = 'kick'
): { channel: string; platform: Platform } {
  const trimmed = input.trim().replace(/^@/, '');

  const twitchMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_-]{2,40})/i);
  if (twitchMatch) {
    return { channel: twitchMatch[1], platform: 'twitch' };
  }

  const kickMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?kick\.com\/([a-zA-Z0-9_-]{2,40})/i);
  if (kickMatch) {
    return { channel: kickMatch[1], platform: 'kick' };
  }

  const clean = trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
  return {
    channel: clean,
    platform: defaultPlatform,
  };
}

export function normalizeStreamerList(raw: unknown): StreamItem[] {
  const candidateList = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && 'streams' in raw && Array.isArray((raw as { streams: unknown }).streams)
    ? (raw as { streams: unknown[] }).streams
    : null;

  if (!candidateList) return [];

  const result: StreamItem[] = [];
  const seenKeys = new Set<string>();
  const seenIds = new Set<string>();

  for (const entry of candidateList) {
    if (!entry || typeof entry !== 'object') continue;
    const rec = entry as Record<string, unknown>;

    const name = typeof rec.name === 'string' ? rec.name.trim() : '';
    const channel = typeof rec.channel === 'string' ? rec.channel.trim() : '';
    if (!name || !channel) continue;

    const rawPlatform = typeof rec.platform === 'string' ? rec.platform.trim().toLowerCase() : 'kick';
    const platform: Platform = VALID_PLATFORMS.has(rawPlatform as Platform)
      ? (rawPlatform as Platform)
      : 'kick';

    const rawVillage = typeof rec.village === 'string' ? rec.village.trim().toLowerCase() : 'diger';
    const village: StreamerVillage = VALID_VILLAGES.has(rawVillage as StreamerVillage)
      ? (rawVillage as StreamerVillage)
      : 'diger';

    let id =
      typeof rec.id === 'string' && rec.id.trim()
        ? rec.id.trim()
        : `${platform}-${channel.toLowerCase()}`;

    const channelKey = `${platform}:${channel.toLowerCase()}`;
    if (seenKeys.has(channelKey)) continue;
    if (seenIds.has(id)) {
      id = `${platform}-${channel.toLowerCase()}`;
    }
    if (seenIds.has(id)) continue;

    seenKeys.add(channelKey);
    seenIds.add(id);

    const roleTag = typeof rec.roleTag === 'string' && rec.roleTag.trim() ? rec.roleTag.trim() : undefined;
    const isDefaultActive = Boolean(rec.isDefaultActive);

    const item: StreamItem = {
      id,
      name,
      channel,
      platform,
      village,
      isDefaultActive,
    };
    if (roleTag) {
      item.roleTag = roleTag;
    }
    result.push(item);
  }

  return result.sort(compareStreamNames);
}

async function parseJsonOrNull(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestStreamerApi(
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
  query?: string
): Promise<StreamerMutationResult> {
  const url = query ? `/api/streamers.php?${query}` : '/api/streamers.php';
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await parseJsonOrNull(response);

  if (!response.ok) {
    const serverMessage =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `Sunucu hatası (${response.status})`;
    throw new Error(serverMessage);
  }

  if (!payload || typeof payload !== 'object' || !('streams' in payload)) {
    throw new Error('Sunucudan geçersiz yayıncı listesi yanıtı alındı.');
  }

  const typed = payload as { item?: StreamItem; deleted?: string; streams: unknown };
  return {
    item: typed.item,
    deleted: typed.deleted,
    streams: normalizeStreamerList(typed.streams),
  };
}

export async function fetchStreamers(): Promise<StreamerLoadResult> {
  try {
    const apiRes = await fetch('/api/streamers.php', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (apiRes.ok) {
      const data = await parseJsonOrNull(apiRes);
      if (data && typeof data === 'object' && 'streams' in data && Array.isArray((data as { streams: unknown }).streams)) {
        return {
          streams: normalizeStreamerList(data),
          source: 'api',
        };
      }
    }
  } catch {
    // Fall back to static JSON when PHP API is unavailable
  }

  try {
    const staticRes = await fetch('/streamers.json', {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (staticRes.ok) {
      const data = await parseJsonOrNull(staticRes);
      const normalized = normalizeStreamerList(data);
      if (normalized.length > 0) {
        return {
          streams: normalized,
          source: 'static',
        };
      }
    }
  } catch {
    // Fall back to bundled defaults
  }

  return {
    streams: ALL_CONFIG_STREAMS,
    source: 'config',
  };
}

export async function createStreamer(input: StreamerInput): Promise<StreamerMutationResult> {
  return requestStreamerApi('POST', input);
}

export async function updateStreamer(
  id: string,
  input: Partial<StreamerInput>
): Promise<StreamerMutationResult> {
  return requestStreamerApi('PATCH', { id, ...input });
}

export async function deleteStreamer(id: string): Promise<StreamerMutationResult> {
  return requestStreamerApi('DELETE', { id }, `id=${encodeURIComponent(id)}`);
}
