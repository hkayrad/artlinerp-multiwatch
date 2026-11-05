import { describe, it, expect } from 'vitest';
import {
  parseChannelInput,
  serializeStreamsToQuery,
  deserializeStreamsFromQuery,
} from './streamUtils';
import { StreamItem } from '../config/siteConfig';

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
});
