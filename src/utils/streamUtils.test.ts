import { describe, it, expect } from 'vitest';
import {
  parseChannelInput,
  serializeStreamsToQuery,
  deserializeStreamsFromQuery,
  hydrateStreamsFromQuery,
  sortStreamsLiveFirst,
  selectVillagePresetStreams,
} from './streamUtils';
import { StreamItem } from '../config/siteConfig';
import type { LiveStatusInfo } from '../services/streamStatus';

describe('streamUtils', () => {
  describe('parseChannelInput', () => {
    it('parses raw username with default platform', () => {
      const result = parseChannelInput('elraenn', 'twitch');
      expect(result).toEqual({ channel: 'elraenn', platform: 'twitch' });
    });

    it('parses raw username with kick as default platform', () => {
      const result = parseChannelInput('jrokez', 'kick');
      expect(result).toEqual({ channel: 'jrokez', platform: 'kick' });
    });

    it('detects twitch URL automatically', () => {
      const result = parseChannelInput('https://www.twitch.tv/artlinehokage', 'kick');
      expect(result).toEqual({ channel: 'artlinehokage', platform: 'twitch' });
    });

    it('detects kick URL automatically', () => {
      const result = parseChannelInput('https://kick.com/artlinekazekage', 'twitch');
      expect(result).toEqual({ channel: 'artlinekazekage', platform: 'kick' });
    });

    it('handles username with leading @ symbol', () => {
      const result = parseChannelInput('@teststreamer', 'twitch');
      expect(result).toEqual({ channel: 'teststreamer', platform: 'twitch' });
    });
  });

  describe('serializeStreamsToQuery & deserializeStreamsFromQuery', () => {
    it('accurately serializes and deserializes multiple streams', () => {
      const original: StreamItem[] = [
        {
          id: '1',
          name: 'Hokage',
          channel: 'hokage_ch',
          platform: 'twitch',
          village: 'konoha',
        },
        {
          id: '2',
          name: 'Kazekage',
          channel: 'kazekage_ch',
          platform: 'kick',
          village: 'suna',
        },
      ];

      const query = serializeStreamsToQuery(original);
      expect(query).toBe('t:hokage_ch,k:kazekage_ch');

      const restored = deserializeStreamsFromQuery(query);
      expect(restored).toEqual([
        { channel: 'hokage_ch', platform: 'twitch' },
        { channel: 'kazekage_ch', platform: 'kick' },
      ]);
    });

    it('handles empty query string safely', () => {
      expect(deserializeStreamsFromQuery('')).toEqual([]);
      expect(serializeStreamsToQuery([])).toBe('');
    });
  });

  describe('sortStreamsLiveFirst & selectVillagePresetStreams', () => {
    const sampleStreams: StreamItem[] = [
      { id: 's1', name: 'Offline One', channel: 'off1', platform: 'kick', village: 'konoha' },
      { id: 's2', name: 'Live Low', channel: 'low', platform: 'twitch', village: 'konoha' },
      { id: 's3', name: 'Live High', channel: 'high', platform: 'kick', village: 'konoha' },
    ];

    const statuses: Record<string, LiveStatusInfo> = {
      s1: { channel: 'off1', isLive: false },
      s2: { channel: 'low', isLive: true, viewers: 15 },
      s3: { channel: 'high', isLive: true, viewers: 120 },
    };

    it('sorts live streams before offline streams by descending viewer count', () => {
      const sorted = sortStreamsLiveFirst(sampleStreams, statuses);
      expect(sorted.map(s => s.id)).toEqual(['s3', 's2', 's1']);
    });

    it('selectVillagePresetStreams returns only live streams in live mode', () => {
      const liveOnly = selectVillagePresetStreams(sampleStreams, statuses, 'live');
      expect(liveOnly.map(s => s.id)).toEqual(['s3', 's2']);
    });

    it('selectVillagePresetStreams returns all streams in all mode', () => {
      const all = selectVillagePresetStreams(sampleStreams, statuses, 'all');
      expect(all.map(s => s.id)).toEqual(['s1', 's2', 's3']);
    });
  });

  describe('hydrateStreamsFromQuery', () => {
    const config: StreamItem[] = [
      { id: 'arthasfyre', name: 'Indra Uchiha', channel: 'arthasfyre', platform: 'kick', village: 'konoha', roleTag: 'Hokage' },
    ];

    it('matches config streams and preserves existing stream IDs across history navigation', () => {
      const existing: StreamItem[] = [
        { id: 'custom-id-1', name: 'Custom Stream', channel: 'someone', platform: 'twitch', village: 'diger' },
      ];

      const hydrated = hydrateStreamsFromQuery('k:arthasfyre,t:someone', config, existing);
      expect(hydrated).toHaveLength(2);
      expect(hydrated[0]).toEqual(config[0]);
      expect(hydrated[1]).toEqual(existing[0]);
    });

    it('creates fallback items for unknown channels', () => {
      const hydrated = hydrateStreamsFromQuery('t:newstreamer', config);
      expect(hydrated).toEqual([
        {
          id: 'twitch-newstreamer',
          name: 'newstreamer',
          channel: 'newstreamer',
          platform: 'twitch',
          village: 'diger',
        },
      ]);
    });
  });
});
