import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Play, Check, X, RefreshCw, Users, Radio } from 'lucide-react';
import { StreamItem } from '../config/siteConfig';
import { LiveStatusInfo } from '../services/streamStatus';
import { sortStreamsLiveFirst } from '../utils/streamUtils';
import { VillageEmblem } from './VillageEmblems';

interface LiveQuickSwitchProps {
  allConfigStreams: StreamItem[];
  activeStreams: StreamItem[];
  statuses: Record<string, LiveStatusInfo>;
  isLoading: boolean;
  onRefresh: () => void;
  onAddStream: (stream: Omit<StreamItem, 'id'>) => void;
  onRemoveStream: (id: string) => void;
  onAddMultipleStreams: (streams: StreamItem[]) => void;
  onOpenRoster: () => void;
}

export const LiveQuickSwitch: React.FC<LiveQuickSwitchProps> = ({
  allConfigStreams,
  activeStreams,
  statuses,
  isLoading,
  onRefresh,
  onAddStream,
  onRemoveStream,
  onAddMultipleStreams,
  onOpenRoster,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const liveStreams = sortStreamsLiveFirst(
    allConfigStreams.filter(s => statuses[s.id]?.isLive),
    statuses
  );

  const activeMap = new Map<string, string>();
  activeStreams.forEach(s => {
    activeMap.set(`${s.platform}:${s.channel.toLowerCase()}`, s.id);
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-semibold transition-colors ${
          isOpen
            ? 'bg-ninja-800 border-orange-500/60 text-slate-100'
            : liveStreams.length > 0
            ? 'bg-ninja-800/80 hover:bg-ninja-800 border-ninja-700 text-slate-200'
            : 'bg-ninja-900 hover:bg-ninja-800 border-ninja-700/80 text-slate-400'
        }`}
        title="Canlı yayıncıları hızlıca aç veya değiştir"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          {liveStreams.length > 0 && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              liveStreams.length > 0 ? 'bg-rose-500' : 'bg-slate-500'
            }`}
          />
        </span>
        <span className="font-mono text-[11px]">
          {isLoading && liveStreams.length === 0
            ? '...'
            : `${liveStreams.length} Canlı`}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="fixed sm:absolute left-2 right-2 sm:left-0 sm:right-auto top-12 sm:top-full mt-1.5 sm:w-96 bg-ninja-900 border border-ninja-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          {/* Popover Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-ninja-700/80 bg-ninja-950/60">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-xs font-bold text-slate-100">
                Canlı Yayınlar ({liveStreams.length})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {liveStreams.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    onAddMultipleStreams(liveStreams);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-semibold transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Tümünü Aç</span>
                </button>
              )}
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                title="Canlı durumları yenile"
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-ninja-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Live List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {liveStreams.length === 0 ? (
              <div className="py-6 px-4 text-center">
                <p className="text-xs text-slate-400 mb-3">
                  {isLoading
                    ? 'Yayıncı durumları kontrol ediliyor...'
                    : 'Şu anda aktif canlı yayın algılanmadı.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenRoster();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-ninja-800 hover:bg-ninja-700 border border-ninja-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  Tüm Yayın Listesini Aç
                </button>
              </div>
            ) : (
              liveStreams.map(stream => {
                const key = `${stream.platform}:${stream.channel.toLowerCase()}`;
                const activeId = activeMap.get(key);
                const isAdded = Boolean(activeId);
                const status = statuses[stream.id];
                const isKonoha = stream.village === 'konoha';

                return (
                  <div
                    key={stream.id}
                    className={`flex items-center justify-between gap-2.5 p-2 rounded-lg border transition-colors ${
                      isAdded
                        ? 'bg-ninja-800/80 border-orange-500/40'
                        : 'bg-ninja-950/50 border-transparent hover:border-ninja-700 hover:bg-ninja-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                          isKonoha
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}
                      >
                        <VillageEmblem village={stream.village} className="w-3.5 h-3.5" />
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-100 truncate">
                            {stream.name}
                          </span>
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              stream.platform === 'kick' ? 'bg-kick' : 'bg-twitch'
                            }`}
                            title={stream.platform}
                          />
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="font-mono truncate">@{stream.channel}</span>
                          {typeof status?.viewers === 'number' && (
                            <span className="flex items-center gap-0.5 font-mono text-slate-300 shrink-0">
                              <Users className="w-2.5 h-2.5 text-slate-400" />
                              {status.viewers.toLocaleString('tr-TR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isAdded ? (
                      <button
                        type="button"
                        onClick={() => activeId && onRemoveStream(activeId)}
                        className="group shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/15 hover:bg-rose-500/15 text-emerald-400 hover:text-rose-400 border border-emerald-500/30 hover:border-rose-500/30 transition-colors"
                      >
                        <Check className="w-3 h-3 group-hover:hidden" />
                        <X className="w-3 h-3 hidden group-hover:inline" />
                        <span className="group-hover:hidden">Açık</span>
                        <span className="hidden group-hover:inline">Kaldır</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          onAddStream({
                            name: stream.name,
                            channel: stream.channel,
                            platform: stream.platform,
                            village: stream.village,
                            roleTag: stream.roleTag,
                          })
                        }
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-colors"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Ekle</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Popover Footer */}
          <div className="px-3 py-2 border-t border-ninja-700/80 bg-ninja-950/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>{activeStreams.length} yayın aktif</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenRoster();
              }}
              className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
            >
              Tüm Kadro →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
