import { useState, useEffect, useCallback, useMemo } from 'react';
import { StreamItem, siteConfig } from '../config/siteConfig';
import { LayoutMode } from '../components/StreamGrid';
import { deserializeStreamsFromQuery, serializeStreamsToQuery } from '../utils/streamUtils';
import { ToastMessage } from '../components/Toast';

export function useMultiwatch() {
  const [streams, setStreams] = useState<StreamItem[]>(() => {
    // 1. URL'de streams parametresi var mı kontrol et
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const streamsQuery = searchParams.get('streams');
      if (streamsQuery) {
        const parsed = deserializeStreamsFromQuery(streamsQuery);
        if (parsed.length > 0) {
          return parsed.map((item, index) => {
            // Konfigürasyondan isim/etiket eşleşmesi varsa al
            const matched = [
              ...siteConfig.villages.konoha.streams,
              ...siteConfig.villages.suna.streams,
            ].find(
              s => s.channel.toLowerCase() === item.channel.toLowerCase() && s.platform === item.platform
            );

            return {
              id: `${item.platform}-${item.channel}-${index}`,
              name: matched?.name || item.channel,
              channel: item.channel,
              platform: item.platform,
              village: matched?.village || 'diger',
              roleTag: matched?.roleTag,
            };
          });
        }
      }
    }

    // 2. URL boşsa varsayılan köyün aktif yayınlarını yükle
    const defaultVillage = siteConfig.defaultVillage;
    if (defaultVillage === 'konoha') {
      return siteConfig.villages.konoha.streams.filter(s => s.isDefaultActive);
    } else if (defaultVillage === 'suna') {
      return siteConfig.villages.suna.streams.filter(s => s.isDefaultActive);
    } else {
      return [
        ...siteConfig.villages.konoha.streams.filter(s => s.isDefaultActive),
        ...siteConfig.villages.suna.streams.filter(s => s.isDefaultActive),
      ];
    }
  });

  const [activeVillage, setActiveVillage] = useState<'konoha' | 'suna' | 'all' | 'custom'>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('streams')) return 'custom';
    }
    return siteConfig.defaultVillage;
  });

  const [layoutMode, setLayoutMode] = useState<LayoutMode>(siteConfig.defaultLayout);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [focusedStreamId, setFocusedStreamId] = useState<string | null>(null);

  // Ses Durumu
  const [mutedStreams, setMutedStreams] = useState<Set<string>>(() => {
    // İlk yayından sonrakileri varsayılan olarak sustur (ses kaosu olmaması için)
    const initialMuted = new Set<string>();
    streams.slice(1).forEach(s => initialMuted.add(s.id));
    return initialMuted;
  });
  const [soloStreamId, setSoloStreamId] = useState<string | null>(() => streams[0]?.id || null);

  // Bildirim Toastı
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast(curr => (curr?.id === id ? null : curr));
    }, 3500);
  }, []);

  // URL'i yayın listesi değiştikçe senkronize et
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const queryString = serializeStreamsToQuery(streams);
    const newUrl = queryString
      ? `${window.location.pathname}?streams=${queryString}`
      : window.location.pathname;

    window.history.replaceState(null, '', newUrl);
  }, [streams]);

  // Köy Seçimi (Konoha, Suna veya Tümü)
  const selectVillage = useCallback((village: 'konoha' | 'suna' | 'all') => {
    setActiveVillage(village);
    let newStreams: StreamItem[] = [];

    if (village === 'konoha') {
      newStreams = siteConfig.villages.konoha.streams;
    } else if (village === 'suna') {
      newStreams = siteConfig.villages.suna.streams;
    } else {
      newStreams = [
        ...siteConfig.villages.konoha.streams,
        ...siteConfig.villages.suna.streams,
      ];
    }

    setStreams(newStreams);
    // İlk hariç diğerlerini sustur
    const muted = new Set<string>();
    newStreams.slice(1).forEach(s => muted.add(s.id));
    setMutedStreams(muted);
    setSoloStreamId(newStreams[0]?.id || null);
    setFocusedStreamId(newStreams[0]?.id || null);

    showToast(
      village === 'konoha'
        ? '🍃 Konohagakure POV yayınları yüklendi'
        : village === 'suna'
        ? '⏳ Sunagakure POV yayınları yüklendi'
        : '⚔️ Tüm köylerin POV yayınları yüklendi'
    );
  }, [showToast]);

  // Yeni Yayın Ekle
  const addStream = useCallback((item: Omit<StreamItem, 'id'>) => {
    const newId = `${item.platform}-${item.channel}-${Date.now()}`;
    const newStream: StreamItem = {
      ...item,
      id: newId,
    };

    setStreams(prev => {
      const updated = [...prev, newStream];
      return updated;
    });

    // Yeni eklenen yayını sustur (mevcut sesi bölmesin)
    setMutedStreams(prev => {
      const next = new Set(prev);
      next.add(newId);
      return next;
    });

    setActiveVillage('custom');
    showToast(`"${newStream.name}" yayına eklendi`);
  }, [showToast]);

  // Yayın Kaldır
  const removeStream = useCallback((id: string) => {
    setStreams(prev => prev.filter(s => s.id !== id));
    setMutedStreams(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (soloStreamId === id) setSoloStreamId(null);
    if (focusedStreamId === id) setFocusedStreamId(null);
  }, [soloStreamId, focusedStreamId]);

  // Tümünü Kaldır
  const clearAllStreams = useCallback(() => {
    setStreams([]);
    setMutedStreams(new Set());
    setSoloStreamId(null);
    setFocusedStreamId(null);
    setActiveVillage('custom');
    showToast('Tüm yayınlar temizlendi', 'info');
  }, [showToast]);

  // Ses Değiştir (Tekil Mute)
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

  // Tek Ses Modu (Solo Audio)
  const soloAudio = useCallback((id: string) => {
    if (soloStreamId === id) {
      // Zaten solo ise solo moddan çık
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

  // Tümünü Sustur
  const muteAll = useCallback(() => {
    const allIds = new Set(streams.map(s => s.id));
    setMutedStreams(allIds);
    setSoloStreamId(null);
    showToast('Tüm yayınların sesi kapatıldı');
  }, [streams, showToast]);

  // Tümünün Sesini Aç
  const unmuteAll = useCallback(() => {
    setMutedStreams(new Set());
    setSoloStreamId(null);
    showToast('Tüm yayınların sesi açıldı');
  }, [showToast]);

  // Paylaşım Bağlantısını Panoya Kopyala
  const shareLink = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => {
        showToast('✅ Discord bağlantısı kopyalandı! Doğrudan sohbete yapıştırabilirsiniz.');
      },
      () => {
        showToast('Bağlantı kopyalanamadı, lütfen URL çubuğundan kopyalayın.', 'error');
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
    activeVillage,
    layoutMode,
    isChatOpen,
    isAddModalOpen,
    mutedStreams,
    soloStreamId,
    focusedStreamId,
    toast,
    existingStreamChannels,
    isAllMuted,
    setLayoutMode,
    setIsChatOpen,
    setIsAddModalOpen,
    setFocusedStreamId,
    setToast,
    selectVillage,
    addStream,
    removeStream,
    clearAllStreams,
    toggleMute,
    soloAudio,
    muteAll,
    unmuteAll,
    shareLink,
  };
}
