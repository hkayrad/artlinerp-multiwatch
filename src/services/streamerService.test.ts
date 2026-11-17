import { describe, it, expect, vi, afterEach } from 'vitest';
import { ALL_CONFIG_STREAMS } from '../config/siteConfig';
import {
  fetchStreamers,
  normalizeStreamerList,
  parseStreamerChannelInput,
} from './streamerService';

describe('streamerService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseStreamerChannelInput', () => {
    it('preserves hyphens in Kick channel names and detects platform from URLs', () => {
      expect(parseStreamerChannelInput('kel-kesis', 'kick')).toEqual({
        channel: 'kel-kesis',
        platform: 'kick',
      });
      expect(parseStreamerChannelInput('https://kick.com/kel-kesis', 'twitch')).toEqual({
        channel: 'kel-kesis',
        platform: 'kick',
      });
      expect(parseStreamerChannelInput('https://www.twitch.tv/elraenn', 'kick')).toEqual({
        channel: 'elraenn',
        platform: 'twitch',
      });
      expect(parseStreamerChannelInput('@YoungTizan', 'kick')).toEqual({
        channel: 'YoungTizan',
        platform: 'kick',
      });
    });
  });

  describe('normalizeStreamerList', () => {
    it('accepts both wrapped { streams } objects and raw arrays while deduplicating channels', () => {
      const wrapped = normalizeStreamerList({
        streams: [
          {
            id: 'zade',
            name: 'Akio Akasaki',
            channel: 'zade',
            platform: 'kick',
            village: 'konoha',
            roleTag: 'Chunin',
          },
          {
            id: 'zade-dup',
            name: 'Duplicate',
            channel: 'ZADE',
            platform: 'kick',
            village: 'konoha',
          },
          {
            name: 'Invalid Missing Channel',
            channel: '',
          },
        ],
      });

      expect(wrapped).toEqual([
        {
          id: 'zade',
          name: 'Akio Akasaki',
          channel: 'zade',
          platform: 'kick',
          village: 'konoha',
          roleTag: 'Chunin',
          isDefaultActive: false,
        },
      ]);
    });

    it('sorts normalized streamers alphabetically by display name', () => {
      const sorted = normalizeStreamerList([
        { id: 'zennv', name: 'Zen Karatachi', channel: 'zennv', platform: 'kick', village: 'suna' },
        { id: 'zade', name: 'Akio Akasaki', channel: 'zade', platform: 'kick', village: 'konoha' },
        { id: 'efes', name: 'Huren Kurozane', channel: 'efes', platform: 'kick', village: 'suna' },
      ]);

      expect(sorted.map(s => s.name)).toEqual([
        'Akio Akasaki',
        'Huren Kurozane',
        'Zen Karatachi',
      ]);
    });
  });

  describe('fetchStreamers fallback chain', () => {
    it('returns API streamers when /api/streamers.php succeeds', async () => {
      const fetchMock = vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            streams: [
              {
                id: 'newbie',
                name: 'Yeni Ninja',
                channel: 'newbie',
                platform: 'kick',
                village: 'konoha',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
      vi.stubGlobal('fetch', fetchMock);

      const res = await fetchStreamers();
      expect(res.source).toBe('api');
      expect(res.streams).toHaveLength(1);
      expect(res.streams[0].channel).toBe('newbie');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('falls back to /streamers.json when PHP API is unavailable', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response('Bad Gateway', { status: 502 }))
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              streams: [
                {
                  id: 'static-one',
                  name: 'Static Ninja',
                  channel: 'staticone',
                  platform: 'twitch',
                  village: 'suna',
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      vi.stubGlobal('fetch', fetchMock);

      const res = await fetchStreamers();
      expect(res.source).toBe('static');
      expect(res.streams).toHaveLength(1);
      expect(res.streams[0].id).toBe('static-one');
    });

    it('falls back to bundled siteConfig streams when both API and static JSON fail', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
      vi.stubGlobal('fetch', fetchMock);

      const res = await fetchStreamers();
      expect(res.source).toBe('config');
      expect(res.streams).toEqual(ALL_CONFIG_STREAMS);
    });
  });
});
