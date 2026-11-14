import React, { useState } from 'react';
import { Tv, Play, Radio, Users, Plus } from 'lucide-react';
import { ALL_CONFIG_STREAMS, Platform, StreamItem, siteConfig } from '../config/siteConfig';
import { LiveStatusInfo } from '../services/streamStatus';
import { VillagePresetMode } from '../hooks/useMultiwatch';
import { getTheatreBand, parseChannelInput, sortStreamsLiveFirst } from '../utils/streamUtils';
import { StreamPlayer } from './StreamPlayer';
import { KonohaEmblem, SunaEmblem, VillageEmblem } from './VillageEmblems';

export type LayoutMode = 'auto' | '2x2' | 'theatre';

interface StreamGridProps {
  streams: StreamItem[];
  statuses: Record<string, LiveStatusInfo>;
  isStatusLoading: boolean;
  layoutMode: LayoutMode;
  mutedStreams: Set<string>;
  soloStreamId: string | null;
  focusedStreamId: string | null;
  onToggleMute: (id: string) => void;
  onSoloAudio: (id: string) => void;
  onRemoveStream: (id: string) => void;
  onFocusStream: (id: string, switchToTheatre?: boolean) => void;
  onMoveStream: (id: string, direction: 'prev' | 'next') => void;
  onSwapStreams?: (sourceId: string, targetId: string) => void;
  onOpenRoster: () => void;
  onLoadVillage: (villageId: 'konoha' | 'suna' | 'all', mode?: VillagePresetMode) => void;
  onAddStream: (stream: Omit<StreamItem, 'id'>) => void;
  onAddMultipleStreams: (streams: StreamItem[]) => void;
}

export const StreamGrid: React.FC<StreamGridProps> = ({
  streams,
  statuses,
  isStatusLoading,
  layoutMode,
  mutedStreams,
  soloStreamId,
  focusedStreamId,
  onToggleMute,
  onSoloAudio,
  onRemoveStream,
  onFocusStream,
  onMoveStream,
  onSwapStreams,
  onOpenRoster,
  onLoadVillage,
  onAddStream,
  onAddMultipleStreams,
}) => {
  const [draggingStreamId, setDraggingStreamId] = useState<string | null>(null);
  const [dragOverStreamId, setDragOverStreamId] = useState<string | null>(null);
  const [quickInput, setQuickInput] = useState('');
  const [quickPlatform, setQuickPlatform] = useState<Platform>('kick');

  const onlineStreams = sortStreamsLiveFirst(
    ALL_CONFIG_STREAMS.filter(s => statuses[s.id]?.isLive),
    statuses
  );
  const konohaLiveCount = siteConfig.villages.konoha.streams.filter(s => statuses[s.id]?.isLive).length;
  const sunaLiveCount = siteConfig.villages.suna.streams.filter(s => statuses[s.id]?.isLive).length;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseChannelInput(quickInput, quickPlatform);
    if (!parsed.channel) return;
    onAddStream({
      name: parsed.channel,
      channel: parsed.channel,
      platform: parsed.platform,
      village: 'diger',
      roleTag: 'Özel Kanal',
    });
    setQuickInput('');
  };

  // Empty State: Live Showcase & Smart Presets
  if (streams.length === 0) {
    return (
      <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 select-none">
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
          {onlineStreams.length > 0 ? (
            <section className="space-y-4">
              {/* Section Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-ninja-700/70">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                    </span>
                    <h1 className="text-lg sm:text-2xl font-bold text-slate-100 naruto-title">
                      Şu Anda Canlı Yayında
                    </h1>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-ninja-800 text-slate-300 border border-ninja-700">
                      {onlineStreams.length} POV
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Aktif sunucu yayıncıları listeleniyor. İzlemek istediğiniz açıları seçin veya tümünü başlatın.
                  </p>
                </div>

                {onlineStreams.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onAddMultipleStreams(onlineStreams)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-600/20 transition-colors shrink-0"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Tüm Canlıları İzle ({onlineStreams.length})</span>
                  </button>
                )}
              </div>

              {/* Live Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {onlineStreams.map(stream => {
                  const status = statuses[stream.id];
                  const isKonoha = stream.village === 'konoha';

                  return (
                    <button
                      key={stream.id}
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
                      className="group text-left bg-ninja-900 border border-ninja-700/80 hover:border-orange-500/70 rounded-xl overflow-hidden flex flex-col transition-colors focus-visible:ring-2 focus-visible:ring-orange-500"
                    >
                      <div className="relative aspect-video w-full bg-ninja-950 overflow-hidden">
                        {status?.thumbnail ? (
                          <img
                            src={status.thumbnail}
                            alt={stream.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-ninja-950">
                            <Radio className="w-7 h-7 text-rose-500/60" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 flex items-center justify-center transition-colors">
                          <span className="opacity-0 group-hover:opacity-100 px-3 py-1.5 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-opacity">
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Aç</span>
                          </span>
                        </div>

                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-extrabold tracking-wider uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            CANLI
                          </span>
                          {typeof status?.viewers === 'number' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/80 text-slate-200 font-mono text-[10px] font-semibold border border-white/10">
                              <Users className="w-3 h-3 text-slate-400" />
                              {status.viewers.toLocaleString('tr-TR')}
                            </span>
                          )}
                        </div>

                        <div className="absolute top-2 right-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              stream.platform === 'kick'
                                ? 'bg-kick text-black'
                                : 'bg-twitch text-white'
                            }`}
                          >
                            {stream.platform}
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 flex-1 w-full flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={isKonoha ? 'text-emerald-400' : 'text-amber-400'}>
                              <VillageEmblem village={stream.village} className="w-3.5 h-3.5" />
                            </span>
                            <span className="font-bold text-sm text-slate-100 truncate">
                              {stream.name}
                            </span>
                            {stream.roleTag && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-ninja-800 text-slate-400 border border-ninja-700 font-medium truncate">
                                {stream.roleTag}
                              </span>
                            )}
                          </div>

                          {status?.title && (
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {status.title}
                            </p>
                          )}
                        </div>

                        <div className="w-full py-2 px-3 rounded-lg bg-ninja-800 group-hover:bg-orange-600 text-slate-100 group-hover:text-white border border-ninja-700 group-hover:border-orange-500 font-semibold text-xs flex items-center justify-center gap-2 transition-colors">
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>İzlemeye Başla</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="py-10 px-4 rounded-2xl bg-ninja-900 border border-ninja-700/80 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-ninja-800 border border-ninja-700 flex items-center justify-center mb-4">
                <Tv className="w-6 h-6 text-orange-400" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-100 naruto-title mb-1.5">
                {isStatusLoading
                  ? 'Yayıncı Durumları Kontrol Ediliyor...'
                  : 'Şu Anda Aktif Canlı Yayın Bulunmuyor'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md">
                Aşağıdan özel bir kanal linki ekleyebilir, köy listelerini yükleyebilir veya sol kadrodan yayıncı seçebilirsiniz.
              </p>
            </section>
          )}

          {/* Quick Custom Channel Bar + Village Actions */}
          <div className="space-y-4 pt-4 border-t border-ninja-700/70">
            <form
              onSubmit={handleQuickAdd}
              className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2.5 rounded-xl bg-ninja-900 border border-ninja-700/80"
            >
              <button
                type="button"
                onClick={() => setQuickPlatform(prev => (prev === 'kick' ? 'twitch' : 'kick'))}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold uppercase shrink-0 transition-colors ${
                  quickPlatform === 'kick'
                    ? 'bg-kick text-black'
                    : 'bg-twitch text-white'
                }`}
                title="Varsayılan platformu değiştir (link yapıştırırsanız otomatik algılanır)"
              >
                {quickPlatform}
              </button>
              <input
                type="text"
                value={quickInput}
                onChange={e => setQuickInput(e.target.value)}
                placeholder="Özel kanal ekle: kick.com/kanal, twitch.tv/kanal veya @kullanici"
                className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg bg-ninja-950 border border-ninja-700/80 focus:border-orange-500 text-xs text-slate-100 placeholder-slate-500 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!quickInput.trim()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold shrink-0 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Kanalı Aç</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onLoadVillage('konoha', konohaLiveCount > 0 ? 'live' : 'all')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold text-xs transition-colors"
                >
                  <KonohaEmblem className="w-3.5 h-3.5" />
                  <span>
                    {konohaLiveCount > 0
                      ? `Konoha Canlı (${konohaLiveCount})`
                      : `Konoha Tümü (${siteConfig.villages.konoha.streams.length})`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onLoadVillage('suna', sunaLiveCount > 0 ? 'live' : 'all')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-semibold text-xs transition-colors"
                >
                  <SunaEmblem className="w-3.5 h-3.5" />
                  <span>
                    {sunaLiveCount > 0
                      ? `Suna Canlı (${sunaLiveCount})`
                      : `Suna Tümü (${siteConfig.villages.suna.streams.length})`}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={onOpenRoster}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-ninja-800 hover:bg-ninja-700 border border-ninja-700 text-slate-200 font-semibold text-xs transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-orange-400" />
                <span>Tüm Yayıncı Kadrosunu Aç</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const count = streams.length;

  const effectiveMainId =
    focusedStreamId && streams.some(s => s.id === focusedStreamId)
      ? focusedStreamId
      : streams[0]?.id;

  const theatreBand = getTheatreBand(count);

  const isTheatreMulti = layoutMode === 'theatre' && count > 1;
  let containerGridClass = '';
  const isScrollableGrid = layoutMode === 'auto' && count > 6;

  if (layoutMode === '2x2') {
    if (count === 1) {
      containerGridClass = 'grid-cols-1 grid-rows-1';
    } else if (count === 2) {
      containerGridClass = 'grid-cols-1 sm:grid-cols-2 grid-rows-2 sm:grid-rows-1';
    } else {
      containerGridClass = 'grid-cols-1 sm:grid-cols-2 grid-rows-4 sm:grid-rows-2';
    }
  } else if (!isTheatreMulti) {
    if (count === 1) {
      containerGridClass = 'grid-cols-1 grid-rows-1';
    } else if (count === 2) {
      containerGridClass = 'grid-cols-1 lg:grid-cols-2 grid-rows-2 lg:grid-rows-1';
    } else if (count === 3) {
      containerGridClass = 'grid-cols-1 md:grid-cols-3 grid-rows-3 md:grid-rows-1';
    } else if (count === 4) {
      containerGridClass = 'grid-cols-1 sm:grid-cols-2 grid-rows-4 sm:grid-rows-2';
    } else if (count <= 6) {
      containerGridClass = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 grid-rows-6 sm:grid-rows-3 md:grid-rows-2';
    } else {
      containerGridClass = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[minmax(200px,1fr)]';
    }
  }

  return (
    <div
      data-theatre-band={isTheatreMulti ? theatreBand : undefined}
      className={`flex-1 h-full w-full min-h-0 min-w-0 grid gap-2 p-2 ${
        isTheatreMulti
          ? 'theatre-grid'
          : `${containerGridClass} ${
              isScrollableGrid ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'
            }`
      }`}
    >
      {streams.map((stream, index) => {
        const isMain = layoutMode === 'theatre' && stream.id === effectiveMainId;

        let itemClass = 'h-full w-full min-h-0 min-w-0 flex items-center justify-center';

        if (count === 1) {
          itemClass += ' col-span-1 row-span-1 max-w-6xl mx-auto order-none';
        } else if (isTheatreMulti) {
          itemClass += isMain ? ' order-first theatre-main' : ' order-none theatre-sec';
        } else {
          itemClass += ' col-span-1 row-span-1 order-none';
        }

        return (
          <div key={stream.id} className={itemClass}>
            <StreamPlayer
              stream={stream}
              slotNumber={count > 1 && index < 9 ? index + 1 : undefined}
              liveStatus={statuses[stream.id] ?? statuses[stream.channel.toLowerCase()]}
              isMuted={mutedStreams.has(stream.id)}
              isSolo={soloStreamId === stream.id}
              onToggleMute={onToggleMute}
              onSoloAudio={onSoloAudio}
              onRemove={onRemoveStream}
              isFocused={isMain}
              canFocus={count > 1}
              onFocus={(id) => onFocusStream(id, true)}
              canMovePrev={layoutMode !== 'theatre' && index > 0}
              canMoveNext={layoutMode !== 'theatre' && index < count - 1}
              onMove={layoutMode !== 'theatre' ? onMoveStream : undefined}
              canDrag={count > 1 && Boolean(onSwapStreams)}
              isAnyDragging={draggingStreamId !== null}
              isDraggingSelf={draggingStreamId === stream.id}
              isDropTarget={
                draggingStreamId !== null &&
                draggingStreamId !== stream.id &&
                dragOverStreamId === stream.id
              }
              onDragStartTile={(id) => {
                setDraggingStreamId(id);
                setDragOverStreamId(null);
              }}
              onDragEndTile={() => {
                setDraggingStreamId(null);
                setDragOverStreamId(null);
              }}
              onDragOverTile={(id) => {
                if (draggingStreamId && draggingStreamId !== id) {
                  setDragOverStreamId(id);
                }
              }}
              onDropTile={(targetId, transferredSourceId) => {
                const sourceId = transferredSourceId || draggingStreamId;
                if (sourceId && sourceId !== targetId) {
                  onSwapStreams?.(sourceId, targetId);
                }
                setDraggingStreamId(null);
                setDragOverStreamId(null);
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
