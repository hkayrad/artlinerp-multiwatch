import { describe, it, expect } from 'vitest';
import {
  FANART_MAX_BYTES,
  filterFanartItems,
  validateFanartFile,
} from './fanartService';
import { parseAppRoute, routeToPath } from '../hooks/useAppRoute';
import { FanartItem } from '../types/fanart';

describe('fanartService helpers', () => {
  describe('validateFanartFile', () => {
    it('accepts valid PNG/JPG/WEBP/GIF files under 8 MB', () => {
      expect(validateFanartFile({ type: 'image/png', size: 1024 * 500 })).toBeNull();
      expect(validateFanartFile({ type: 'image/jpeg', size: 2 * 1024 * 1024 })).toBeNull();
      expect(validateFanartFile({ type: 'image/webp', size: 1024 })).toBeNull();
      expect(validateFanartFile({ type: 'image/gif', size: 1024 })).toBeNull();
    });

    it('rejects unsupported file types such as SVG or PDF', () => {
      expect(validateFanartFile({ type: 'image/svg+xml', size: 512 })).not.toBeNull();
      expect(validateFanartFile({ type: 'application/pdf', size: 512 })).not.toBeNull();
    });

    it('rejects empty files and files exceeding 8 MB', () => {
      expect(validateFanartFile({ type: 'image/png', size: 0 })).not.toBeNull();
      expect(validateFanartFile({ type: 'image/png', size: FANART_MAX_BYTES + 1 })).not.toBeNull();
    });
  });

  describe('filterFanartItems', () => {
    const sample: FanartItem[] = [
      {
        id: '1',
        filename: 'hokage.png',
        url: '/uploads/fanart/hokage.png',
        title: 'Indra Uchiha Portresi',
        artist: '@artist_konoha',
        village: 'konoha',
        description: '7. Hokage cizimi',
        createdAt: '2026-11-15T10:00:00Z',
        uploadedBy: 'admin',
      },
      {
        id: '2',
        filename: 'kazekage.webp',
        url: '/uploads/fanart/kazekage.webp',
        title: 'Col Firtinasi',
        artist: 'kum_cizeri',
        village: 'suna',
        createdAt: '2026-11-15T11:00:00Z',
        uploadedBy: 'visitor',
      },
      {
        id: '3',
        filename: 'duel.jpg',
        url: '/uploads/fanart/duel.jpg',
        title: 'Vadi Savasi',
        artist: '@artlinefan',
        village: 'genel',
        createdAt: '2026-11-15T12:00:00Z',
        uploadedBy: 'admin',
      },
    ];

    it('filters by village tag', () => {
      expect(filterFanartItems(sample, 'konoha', '').map(i => i.id)).toEqual(['1']);
      expect(filterFanartItems(sample, 'suna', '').map(i => i.id)).toEqual(['2']);
      expect(filterFanartItems(sample, 'genel', '').map(i => i.id)).toEqual(['3']);
      expect(filterFanartItems(sample, 'all', '').map(i => i.id)).toEqual(['1', '2', '3']);
    });

    it('filters by search query across title, artist, and description', () => {
      expect(filterFanartItems(sample, 'all', 'indra').map(i => i.id)).toEqual(['1']);
      expect(filterFanartItems(sample, 'all', 'kum_cizeri').map(i => i.id)).toEqual(['2']);
      expect(filterFanartItems(sample, 'all', 'hokage').map(i => i.id)).toEqual(['1']);
      expect(filterFanartItems(sample, 'suna', 'indra')).toEqual([]);
    });
  });
});

describe('useAppRoute path helpers', () => {
  it('parses root, /fanart, and /admin including trailing slashes', () => {
    expect(parseAppRoute('/')).toBe('multiwatch');
    expect(parseAppRoute('/fanart')).toBe('fanart');
    expect(parseAppRoute('/fanart/')).toBe('fanart');
    expect(parseAppRoute('/admin')).toBe('admin');
    expect(parseAppRoute('/admin/')).toBe('admin');
    expect(parseAppRoute('/unknown')).toBe('multiwatch');
  });

  it('maps routes back to canonical paths', () => {
    expect(routeToPath('multiwatch')).toBe('/');
    expect(routeToPath('fanart')).toBe('/fanart');
    expect(routeToPath('admin')).toBe('/admin');
  });
});
