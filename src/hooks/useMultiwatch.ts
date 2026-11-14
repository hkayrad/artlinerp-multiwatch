import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ALL_CONFIG_STREAMS, StreamItem, siteConfig } from '../config/siteConfig';
import { LayoutMode } from '../components/StreamGrid';
import {
  hydrateStreamsFromQuery,
  selectVillagePresetStreams,
  serializeStreamsToQuery,
} from '../utils/streamUtils';
import { ToastMessage } from '../components/Toast';
import { useLiveStatus } from './useLiveStatus';

export type VillagePresetMode = 'live' | 'all';

interface MultiwatchHistoryState {
  streamsQuery: string;
  activeVillage: 'konoha' | 'suna' | 'all' | 'custom';
  layoutMode: LayoutMode;
  focusedStreamId: string | null;
}

function getDefaultStreams(): StreamItem[] {
  const defaultVillage = siteConfig.defaultVillage;
  if (defaultVillage === 'konoha') {
    return siteConfig.villages.konoha.streams.filter(s => s.isDefaultActive);
  }
  if (defaultVillage === 'suna') {
    return siteConfig.villages.suna.streams.filter(s => s.isDefaultActive);
  }
  return ALL_CONFIG_STREAMS.filter(s => s.isDefaultActive);
}

export function useMultiwatch() {
  const { statuses, isLoading: isStatusLoading, refresh: refreshStatuses } = useLiveStatus();

  const [streams, setStreams] = useState<StreamItem[]>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const streamsQuery = searchParams.get('streams');
      if (streamsQuery) {
        const hydrated = hydrateStreamsFromQuery(streamsQuery, ALL_CONFIG_STREAMS);
        if (hydrated.length > 0) return hydrated;
      }
    }

    return getDefaultStreams();
  });

  const [activeVillage, setActiveVillage] = useState<'konoha' | 'suna' | 'all' | 'custom'>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('streams')) return 'custom';
    }
    return siteConfig.defaultVillage;
  });

  const [layoutMode, setLayoutModeState] = useState<LayoutMode>(siteConfig.defaultLayout);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRosterOpen, setIsRosterOpen] = useState<boolean>(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= 768
  );
  const [focusedStreamId, setFocusedStreamId] = useState<string | null>(null);

  const setLayoutMode = useCallback((mode: LayoutMode) => {
    if (mode === '2x2' && streams.length > 4) {
      return;
    }
    setLayoutModeState(mode);
  }, [streams.length]);

  useEffect(() => {
    if (layoutMode === '2x2' && streams.length > 4) {
      setLayoutModeState('auto');
    }
  }, [layoutMode, streams.length]);

  // Audio state
  const [mutedStreams, setMutedStreams] = useState<Set<string>>(() => {
    const initialMuted = new Set<string>();
    streams.slice(1).forEach(s => initialMuted.add(s.id));
    return initialMuted;
  });
  const [soloStreamId, setSoloStreamId] = useState<string | null>(() => streams[0]?.id || null);

  // Toast state with clean timer ref
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    const id = Date.now().toString();
    setToast({ id, message, type });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(curr => (curr?.id === id ? null : curr));
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Browser history sync (pushState on navigation changes + popstate for Back/Forward)
  const hasInitializedHistoryRef = useRef(false);
  const isApplyingPopstateRef = useRef(false);
  const streamsRef = useRef(streams);
  streamsRef.current = streams;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const queryString = serializeStreamsToQuery(streams);
    const nextUrl = queryString
      ? `${window.location.pathname}?streams=${queryString}`
      : window.location.pathname;

    const snapshot: MultiwatchHistoryState = {
      streamsQuery: queryString,
      activeVillage,
      layoutMode,
      focusedStreamId,
    };

    if (!hasInitializedHistoryRef.current) {
      hasInitializedHistoryRef.current = true;
      window.history.replaceState(snapshot, '', nextUrl);
      return;
    }

    if (isApplyingPopstateRef.current) {
      isApplyingPopstateRef.current = false;
      return;
    }

    const prevState = window.history.state as MultiwatchHistoryState | null;
    if (
      prevState &&
      prevState.streamsQuery === snapshot.streamsQuery &&
      prevState.activeVillage === snapshot.activeVillage &&
      prevState.layoutMode === snapshot.layoutMode &&
      prevState.focusedStreamId === snapshot.focusedStreamId
    ) {
      return;
    }

    window.history.pushState(snapshot, '', nextUrl);
  }, [streams, activeVillage, layoutMode, focusedStreamId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (event: PopStateEvent) => {
      isApplyingPopstateRef.current = true;

      const searchParams = new URLSearchParams(window.location.search);
      const streamsQuery = searchParams.get('streams') || '';
      const state = event.state as MultiwatchHistoryState | null;

      const restoredStreams = streamsQuery
        ? hydrateStreamsFromQuery(streamsQuery, ALL_CONFIG_STREAMS, streamsRef.current)
        : state && state.streamsQuery === ''
        ? []
        : getDefaultStreams();

      const restoredLayout = state?.layoutMode ?? siteConfig.defaultLayout;
      const safeLayout =
        restoredLayout === '2x2' && restoredStreams.length > 4 ? 'auto' : restoredLayout;

      setStreams(restoredStreams);
      setActiveVillage(
        state?.activeVillage ?? (streamsQuery ? 'custom' : siteConfig.defaultVillage)
      );
      setLayoutModeState(safeLayout);
      setFocusedStreamId(state?.focusedStreamId ?? null);

      setMutedStreams(prevMuted => {
        const nextMuted = new Set<string>();
        let hasUnmuted = false;
        restoredStreams.forEach(s => {
          const wasOpen = streamsRef.current.some(curr => curr.id === s.id);
          if (wasOpen) {
            if (prevMuted.has(s.id)) {
              nextMuted.add(s.id);
            } else {
              hasUnmuted = true;
            }
          } else if (hasUnmuted) {
            nextMuted.add(s.id);
          } else {
            hasUnmuted = true;
          }
        });
        return nextMuted;
      });
      setSoloStreamId(prevSolo =>
        prevSolo && restoredStreams.some(s => s.id === prevSolo) ? prevSolo : null
      );
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Smart Village Preset selection ('live' loads only live streams; 'all' loads every registered stream)
  const selectVillage = useCallback((
    village: 'konoha' | 'suna' | 'all',
    mode: VillagePresetMode = 'live'
  ) => {
    const pool: StreamItem[] =
      village === 'konoha'
        ? siteConfig.villages.konoha.streams
        : village === 'suna'
        ? siteConfig.villages.suna.streams
        : [
            ...siteConfig.villages.konoha.streams,
            ...siteConfig.villages.suna.streams,
          ];

    const newStreams = selectVillagePresetStreams(pool, statuses, mode);
    const villageLabel =
      village === 'konoha'
        ? 'Konohagakure'
        : village === 'suna'
        ? 'Sunagakure'
        : 'Tüm köyler';

    if (mode === 'live' && newStreams.length === 0) {
      if (isStatusLoading) {
        showToast('Canlı yayın durumları kontrol ediliyor, lütfen bekleyin.', 'info');
      } else {
        showToast(`${villageLabel} için şu anda canlı yayın yok. Menüden "Tüm Kayıtlılar"ı açabilirsiniz.`, 'info');
      }
      return;
    }

    setActiveVillage(village);
    setStreams(newStreams);
    if (newStreams.length > 4) {
      setLayoutModeState(curr => (curr === '2x2' ? 'auto' : curr));
    }

    const muted = new Set<string>();
    newStreams.slice(1).forEach(s => muted.add(s.id));
    setMutedStreams(muted);
    setSoloStreamId(newStreams[0]?.id || null);
    setFocusedStreamId(newStreams[0]?.id || null);

    showToast(
      mode === 'live'
        ? `${villageLabel}: ${newStreams.length} canlı POV yüklendi`
        : `${villageLabel}: ${newStreams.length} kayıtlı POV yüklendi`
    );
  }, [statuses, isStatusLoading, showToast]);

  // Add single stream
  const addStream = useCallback((item: Omit<StreamItem, 'id'>) => {
    const exists = streams.some(
      s => s.channel.toLowerCase() === item.channel.toLowerCase() && s.platform === item.platform
    );

    if (exists) {
      showToast(`"${item.name}" zaten ekranda açık`, 'info');
      return;
    }

    const newId = `${item.platform}-${item.channel}-${Date.now()}`;
    const newStream: StreamItem = {
      ...item,
      id: newId,
    };

    setStreams(prev => [...prev, newStream]);
    if (streams.length + 1 > 4) {
      setLayoutModeState(curr => (curr === '2x2' ? 'auto' : curr));
    }

    // Mute newly added stream if there are already unmuted streams so audio doesn't clash
    if (streams.length > 0) {
      setMutedStreams(prev => {
        const next = new Set(prev);
        next.add(newId);
        return next;
      });
    } else {
      setSoloStreamId(newId);
      setFocusedStreamId(newId);
    }

    setActiveVillage('custom');
    showToast(`"${item.name}" yayına eklendi`);
  }, [streams, showToast]);

  // Load multiple streams at once (e.g. "Watch All Live")
  const addMultipleStreams = useCallback((items: StreamItem[]) => {
    if (items.length === 0) return;
    setStreams(items);
    if (items.length > 4) {
      setLayoutModeState(curr => (curr === '2x2' ? 'auto' : curr));
    }
    const muted = new Set<string>();
    items.slice(1).forEach(s => muted.add(s.id));
    setMutedStreams(muted);
    setSoloStreamId(items[0]?.id || null);
    setFocusedStreamId(items[0]?.id || null);
    setActiveVillage('custom');
    showToast(`${items.length} canlı yayın ekrana yüklendi`);
  }, [showToast]);

  // Remove stream
  const removeStream = useCallback((id: string) => {
    setStreams(prev => prev.filter(s => s.id !== id));
    setMutedStreams(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setSoloStreamId(prev => (prev === id ? null : prev));
    setFocusedStreamId(prev => (prev === id ? null : prev));
  }, []);

  // Clear all streams
  const clearAllStreams = useCallback(() => {
    setStreams([]);
    setMutedStreams(new Set());
    setSoloStreamId(null);
    setFocusedStreamId(null);
    setActiveVillage('custom');
    showToast('Tüm yayınlar temizlendi', 'info');
  }, [showToast]);

  // Focus or unfocus stream (toggles Theatre mode when clicking an already-focused stream)
  const focusStream = useCallback((id: string, switchToTheatre = true) => {
    const currentMainId =
      focusedStreamId && streams.some(s => s.id === focusedStreamId)
        ? focusedStreamId
        : streams[0]?.id;

    if (layoutMode === 'theatre' && currentMainId === id) {
      setLayoutMode('auto');
      setFocusedStreamId(null);
      return;
    }

    setFocusedStreamId(id);
    if (switchToTheatre) {
      setLayoutMode('theatre');
    }
  }, [layoutMode, focusedStreamId, streams, setLayoutMode]);

  // Swap two stream positions without unmounting iframes (used for reordering)
  const moveStream = useCallback((id: string, direction: 'prev' | 'next') => {
    setStreams(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'prev' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[targetIdx]] = [copy[targetIdx], copy[idx]];
      return copy;
    });
  }, []);

  // Toggle single stream mute
  const toggleMute = useCallback((id: string) => {
    setMutedStreams(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setSoloStreamId(null);
  }, []);

  // Solo audio
  const soloAudio = useCallback((id: string) => {
    if (soloStreamId === id) {
      setSoloStreamId(null);
      return;
    }

    setSoloStreamId(id);
    const nextMuted = new Set<string>();
    streams.forEach(s => {
      if (s.id !== id) {
        nextMuted.add(s.id);
      }
    });
    setMutedStreams(nextMuted);
    const target = streams.find(s => s.id === id);
    showToast(`Ses yalnızca "${target?.name || 'seçili yayın'}" kanalına verildi`);
  }, [soloStreamId, streams, showToast]);

  // Mute all
  const muteAll = useCallback(() => {
    const allIds = new Set(streams.map(s => s.id));
    setMutedStreams(allIds);
    setSoloStreamId(null);
    showToast('Tüm yayınların sesi kapatıldı');
  }, [streams, showToast]);

  // Unmute all
  const unmuteAll = useCallback(() => {
    setMutedStreams(new Set());
    setSoloStreamId(null);
    showToast('Tüm yayınların sesi açıldı');
  }, [showToast]);

  // Share link
  const shareLink = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => {
        showToast('URL kopyalandı!');
      },
      () => {
        showToast('URL kopyalanamadı, lütfen adres çubuğundan kopyalayın.', 'error');
      }
    );
  }, [showToast]);

  const existingStreamChannels = useMemo(() => {
    return new Set(streams.map(s => s.channel.toLowerCase()));
  }, [streams]);

  const isAllMuted = useMemo(() => {
    return streams.length > 0 && streams.every(s => mutedStreams.has(s.id));
  }, [streams, mutedStreams]);

  return {
    streams,
    statuses,
    isStatusLoading,
    refreshStatuses,
    activeVillage,
    layoutMode,
    isChatOpen,
    isRosterOpen,
    mutedStreams,
    soloStreamId,
    focusedStreamId,
    toast,
    existingStreamChannels,
    isAllMuted,
    setLayoutMode,
    setIsChatOpen,
    setIsRosterOpen,
    setFocusedStreamId,
    focusStream,
    moveStream,
    setToast,
    selectVillage,
    addStream,
    addMultipleStreams,
    removeStream,
    clearAllStreams,
    toggleMute,
    soloAudio,
    muteAll,
    unmuteAll,
    shareLink,
  };
}
