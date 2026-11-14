import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchChannelStatus,
  fetchMultipleStreamStatuses,
  clearStreamStatusCache,
} from './streamStatus';
import { StreamItem } from '../config/siteConfig';

describe('streamStatus', () => {
  const kickStream: StreamItem = {
    id: 'kick-test',
    name: 'Test Kick',
    channel: 'TestKick',
    platform: 'kick',
    village: 'konoha',
  };

  const twitchStream: StreamItem = {
    id: 'twitch-test',
    name: 'Test Twitch',
    channel: 'TestTwitch',
    platform: 'twitch',
    village: 'suna',
  };

  beforeEach(() => {
    clearStreamStatusCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses live Kick channel metadata and caches for subsequent non-forced calls', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        livestream: {
          is_live: true,
          session_title: 'Konoha Patrol',
          viewer_count: 84,
          thumbnail: { url: 'https://example.com/thumb.jpg' },
          categories: [{ name: "Garry's Mod" }],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = await fetchChannelStatus(kickStream);
    expect(first).toEqual({
      channel: 'TestKick',
      isLive: true,
      title: 'Konoha Patrol',
      viewers: 84,
      thumbnail: 'https://example.com/thumb.jpg',
      category: "Garry's Mod",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Non-forced call hits 30s cache
    const second = await fetchChannelStatus(kickStream);
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Forced call bypasses cache
    await fetchChannelStatus(kickStream, { force: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns offline safely when Kick fetch fails or returns non-ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const res = await fetchChannelStatus(kickStream);
    expect(res).toEqual({ channel: 'TestKick', isLive: false });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const errRes = await fetchChannelStatus(kickStream, { force: true });
    expect(errRes).toEqual({ channel: 'TestKick', isLive: false });
  });

  it('detects live vs offline Twitch channels via DecAPI uptime text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '1 hour, 12 minutes',
      })
    );

    const liveRes = await fetchChannelStatus(twitchStream);
    expect(liveRes.isLive).toBe(true);
    expect(liveRes.thumbnail).toContain('live_user_testtwitch');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'testtwitch is offline',
      })
    );

    const offlineRes = await fetchChannelStatus(twitchStream, { force: true });
    expect(offlineRes).toEqual({ channel: 'TestTwitch', isLive: false });
  });

  it('aggregates multiple stream statuses keyed by id and lowercase channel', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ livestream: { is_live: false } }),
      })
    );

    const map = await fetchMultipleStreamStatuses([kickStream]);
    expect(map['kick-test']).toEqual({ channel: 'TestKick', isLive: false });
    expect(map['testkick']).toEqual({ channel: 'TestKick', isLive: false });
  });
});
