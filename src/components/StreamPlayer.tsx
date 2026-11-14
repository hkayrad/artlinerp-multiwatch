import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCw,
  X,
  Maximize2,
  Headphones,
  Expand,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Users,
} from 'lucide-react';
import { StreamItem } from '../config/siteConfig';
import { LiveStatusInfo } from '../services/streamStatus';
import { getParentDomain } from '../utils/streamUtils';

interface StreamPlayerProps {
  stream: StreamItem;
  slotNumber?: number;
  liveStatus?: LiveStatusInfo;
  isMuted: boolean;
  isSolo: boolean;
  onToggleMute: (id: string) => void;
  onSoloAudio: (id: string) => void;
  onRemove: (id: string) => void;
  isFocused?: boolean;
  canFocus?: boolean;
  onFocus?: (id: string) => void;
  canMovePrev?: boolean;
  canMoveNext?: boolean;
  onMove?: (id: string, direction: 'prev' | 'next') => void;
  canDrag?: boolean;
  isAnyDragging?: boolean;
  isDraggingSelf?: boolean;
  isDropTarget?: boolean;
  onDragStartTile?: (id: string) => void;
  onDragEndTile?: () => void;
  onDragOverTile?: (id: string) => void;
  onDropTile?: (targetId: string, sourceId?: string) => void;
}

function loadTwitchScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Twitch?.Player) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://player.twitch.tv/js/embed/v1.js"]');
    if (existing) {
      if (window.Twitch?.Player) {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject());
      }
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://player.twitch.tv/js/embed/v1.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
}

export const StreamPlayer: React.FC<StreamPlayerProps> = React.memo(({
  stream,
  slotNumber,
  liveStatus,
  isMuted,
  isSolo,
  onToggleMute,
  onSoloAudio,
  onRemove,
  isFocused = false,
  canFocus = false,
  onFocus,
  canMovePrev = false,
  canMoveNext = false,
  onMove,
  canDrag = false,
  isAnyDragging = false,
  isDraggingSelf = false,
  isDropTarget = false,
  onDragStartTile,
  onDragEndTile,
  onDragOverTile,
  onDropTile,
}) => {
  const [reloadKey, setReloadKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const twitchPlayerRef = useRef<TwitchPlayerInstance | null>(null);

  const parentDomain = getParentDomain();
  const isKick = stream.platform === 'kick';

  // 1. Twitch: Official JS SDK for zero-refresh audio control
  useEffect(() => {
    if (stream.platform !== 'twitch' || !videoWrapperRef.current) return;

    let isCancelled = false;

    loadTwitchScript().then(() => {
      if (isCancelled || !videoWrapperRef.current || !window.Twitch?.Player) return;

      if (twitchPlayerRef.current) {
        try {
          twitchPlayerRef.current.destroy();
        } catch {
          // ignore
        }
        twitchPlayerRef.current = null;
      }

      videoWrapperRef.current.innerHTML = '';

      const player = new window.Twitch.Player(videoWrapperRef.current, {
        channel: stream.channel,
        parent: [parentDomain],
        muted: isMuted,
        autoplay: true,
        width: '100%',
        height: '100%',
      });

      twitchPlayerRef.current = player;
    }).catch(() => {});

    return () => {
      isCancelled = true;
      if (twitchPlayerRef.current) {
        try {
          twitchPlayerRef.current.destroy();
        } catch {
          // ignore
        }
        twitchPlayerRef.current = null;
      }
    };
  }, [stream.platform, stream.channel, parentDomain, reloadKey]);

  // Live update Twitch mute state without reload
  useEffect(() => {
    if (stream.platform === 'twitch' && twitchPlayerRef.current) {
      try {
        twitchPlayerRef.current.setMuted(isMuted);
      } catch {
        // ignore
      }
    }
  }, [isMuted, stream.platform]);

  // 2. Kick: Query param update for mute state
  const kickEmbedUrl = useMemo(() => {
    if (stream.platform !== 'kick') return '';
    return `https://player.kick.com/${encodeURIComponent(stream.channel)}?autoplay=true&muted=${isMuted ? 'true' : 'false'}`;
  }, [stream.platform, stream.channel, reloadKey, isMuted]);

  const handleReload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setReloadKey(prev => prev + 1);
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className="stream-tile w-full h-full min-h-0 min-w-0 flex items-center justify-center"
    >
      <div
        onDragOver={(e) => {
          if (!isAnyDragging || isDraggingSelf) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          onDragOverTile?.(stream.id);
        }}
        onDrop={(e) => {
          if (!isAnyDragging || isDraggingSelf) return;
          e.preventDefault();
          const sourceId = e.dataTransfer.getData('text/plain');
          onDropTile?.(stream.id, sourceId);
        }}
        className={`flex flex-col w-full h-full min-h-0 bg-ninja-950 border rounded-xl overflow-hidden shadow-lg transition-all duration-150 ${
          isDraggingSelf ? 'opacity-60 scale-[0.99]' : ''
        } ${
          isDropTarget
            ? 'ring-2 ring-sky-400 border-sky-400/70'
            : isFocused
            ? 'ring-2 ring-orange-500 border-orange-500/60'
            : isSolo
            ? 'ring-2 ring-emerald-500 border-emerald-500/60'
            : 'border-ninja-700/80 hover:border-ninja-600'
        }`}
      >
        {/* Always-visible Slim Control Bar (never swallowed by cross-origin iframes) */}
        <div
          draggable={canDrag}
          onDragStart={(e) => {
            if (!canDrag) return;
            e.dataTransfer.setData('text/plain', stream.id);
            e.dataTransfer.effectAllowed = 'move';
            onDragStartTile?.(stream.id);
          }}
          onDragEnd={() => onDragEndTile?.()}
          onClick={() => canFocus && onFocus?.(stream.id)}
          title={liveStatus?.title || stream.name || stream.channel}
          className={`h-8 px-2 bg-ninja-900 border-b border-ninja-700/80 flex items-center justify-between gap-2 shrink-0 select-none ${
            canDrag
              ? 'cursor-grab active:cursor-grabbing'
              : canFocus
              ? 'cursor-pointer'
              : ''
          }`}
        >
          {/* Left: Drag Handle + Slot + Platform + Streamer + Live/Viewers + Role */}
          <div className="flex items-center gap-1.5 min-w-0">
            {canDrag && (
              <GripVertical className="w-3 h-3 text-slate-500 shrink-0 hidden sm:inline" />
            )}
            {typeof slotNumber === 'number' && (
              <span
                className="hidden sm:inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded bg-ninja-800 text-[10px] font-bold text-slate-400 border border-ninja-700/80 shrink-0"
                title={`Klavye kısayolu: ${slotNumber} (Odakla) · Shift+${slotNumber} (Solo)`}
              >
                {slotNumber}
              </span>
            )}
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase shrink-0 ${
                isKick ? 'bg-kick text-black' : 'bg-twitch text-white'
              }`}
            >
              {stream.platform}
            </span>
            {liveStatus?.isLive && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"
                title="Canlı yayında"
              />
            )}
            <span className="font-semibold text-xs text-slate-100 truncate">
              {stream.name || stream.channel}
            </span>
            {liveStatus?.isLive && typeof liveStatus.viewers === 'number' && (
              <span className="tile-meta items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-ninja-800 text-slate-300 border border-ninja-700 shrink-0">
                <Users className="w-2.5 h-2.5 text-slate-400" />
                {liveStatus.viewers.toLocaleString('tr-TR')}
              </span>
            )}
            {stream.roleTag && (
              <span className="tile-meta text-[10px] px-1.5 py-0.5 rounded bg-ninja-800 text-slate-400 border border-ninja-700 truncate">
                {stream.roleTag}
              </span>
            )}
          </div>

          {/* Right: Stream Controls */}
          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            {onMove && (canMovePrev || canMoveNext) && (
              <div className="hidden xl:flex items-center bg-ninja-950 rounded-md border border-ninja-700/80">
                <button
                  type="button"
                  disabled={!canMovePrev}
                  onClick={() => onMove(stream.id, 'prev')}
                  title="Önceki sıraya taşı"
                  aria-label="Önceki sıraya taşı"
                  className="p-1 text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={!canMoveNext}
                  onClick={() => onMove(stream.id, 'next')}
                  title="Sonraki sıraya taşı"
                  aria-label="Sonraki sıraya taşı"
                  className="p-1 text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {canFocus && onFocus && (
              <button
                type="button"
                onClick={() => onFocus(stream.id)}
                title={
                  isFocused
                    ? 'Odaktan çık (Otomatik ızgaraya dön)'
                    : 'Bu yayına odaklan (Tiyatro modu - yayın kesilmez)'
                }
                aria-label={isFocused ? 'Odaktan çık' : 'Bu yayına odaklan'}
                className={`px-1.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 border transition-colors ${
                  isFocused
                    ? 'bg-orange-600 text-white border-orange-500'
                    : 'bg-ninja-950 text-slate-300 hover:text-orange-400 hover:bg-orange-500/10 border-ninja-700/80'
                }`}
              >
                {isFocused ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span className="tile-action-label">Odakta</span>
                  </>
                ) : (
                  <>
                    <Expand className="w-3.5 h-3.5" />
                    <span className="tile-action-label">Odak</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => onSoloAudio(stream.id)}
              title={
                isSolo
                  ? 'Tek Ses Aktif (Diğerleri susturuldu)'
                  : isKick
                  ? 'Sesi Yalnızca Buraya Ver (Kick için yayın anlık yenilenebilir)'
                  : 'Sesi Yalnızca Buraya Ver (Diğerlerini sustur)'
              }
              aria-label={isSolo ? 'Tek Sesi kapat' : 'Sesi Yalnızca Buraya Ver'}
              className={`px-1.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 border transition-colors ${
                isSolo
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                  : 'bg-ninja-950 text-slate-300 hover:text-white hover:bg-ninja-800 border-ninja-700/80'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="tile-action-label">{isSolo ? 'Tek Ses' : 'Solo'}</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleMute(stream.id)}
              title={
                isMuted
                  ? isKick
                    ? 'Sesi Aç (Kick kısıtlaması nedeniyle yenilenebilir; kesintisiz ses için player içi ses çubuğunu da kullanabilirsiniz)'
                    : 'Sesi Aç'
                  : isKick
                  ? 'Sesi Kapat (Kick kısıtlaması nedeniyle yenilenebilir; kesintisiz ses için player içi ses çubuğunu da kullanabilirsiniz)'
                  : 'Sesi Kapat'
              }
              className={`p-1 rounded-md border transition-colors ${
                isMuted
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25'
                  : 'bg-ninja-950 text-emerald-400 border-ninja-700/80 hover:bg-ninja-800'
              }`}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleReload}
              title="Yayını yenile"
              aria-label="Yayını yenile"
              className="p-1 rounded-md bg-ninja-950 hover:bg-ninja-800 text-slate-300 hover:text-white border border-ninja-700/80 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleFullscreen}
              title="Tam ekran"
              aria-label="Tam ekran"
              className="p-1 rounded-md bg-ninja-950 hover:bg-ninja-800 text-slate-300 hover:text-white border border-ninja-700/80 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onRemove(stream.id)}
              title="Yayını kaldır"
              aria-label="Yayını kaldır"
              className="p-1 rounded-md bg-ninja-950 hover:bg-rose-600 text-slate-300 hover:text-white border border-ninja-700/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Full-bleed Video Embed (fits exact remaining cell height so bottom player controls are never clipped) */}
        <div
          className={`relative flex-1 w-full min-h-0 bg-ninja-950 overflow-hidden ${
            isAnyDragging && !isDraggingSelf ? 'pointer-events-none' : ''
          }`}
        >
          {stream.platform === 'twitch' ? (
            <div
              ref={videoWrapperRef}
              className="w-full h-full absolute inset-0 [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
            />
          ) : (
            <iframe
              key={`${stream.channel}-${reloadKey}`}
              src={kickEmbedUrl}
              title={`${stream.platform} - ${stream.channel}`}
              className="w-full h-full border-0 absolute inset-0"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="eager"
            />
          )}

          {isDropTarget && (
            <div className="absolute inset-0 bg-sky-500/15 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
              <span className="px-3 py-1.5 rounded-full bg-ninja-950/90 border border-sky-400/70 text-sky-300 text-xs font-bold shadow-lg">
                Yer değiştirmek için bırakın
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
