import React from 'react';
import { StreamItem, siteConfig } from '../config/siteConfig';
import { StreamPlayer } from './StreamPlayer';
import { Tv, Play, Radio, Users, Sparkles } from 'lucide-react';
import { useLiveStatus } from '../hooks/useLiveStatus';

export type LayoutMode = 'auto' | '2x2' | 'theatre';

interface StreamGridProps {
  streams: StreamItem[];
  layoutMode: LayoutMode;
  mutedStreams: Set<string>;
  soloStreamId: string | null;
  focusedStreamId: string | null;
  onToggleMute: (id: string) => void;
  onSoloAudio: (id: string) => void;
  onRemoveStream: (id: string) => void;
  onFocusStream: (id: string) => void;
  onOpenAddModal: () => void;
  onLoadVillage: (villageId: 'konoha' | 'suna') => void;
  onAddStream?: (stream: Omit<StreamItem, 'id'>) => void;
  onAddMultipleStreams?: (streams: StreamItem[]) => void;
}

export const StreamGrid: React.FC<StreamGridProps> = ({
  streams,
  layoutMode,
  mutedStreams,
  soloStreamId,
  focusedStreamId,
  onToggleMute,
  onSoloAudio,
  onRemoveStream,
  onFocusStream,
  onOpenAddModal,
  onLoadVillage,
  onAddStream,
  onAddMultipleStreams,
}) => {
  const { statuses, isLoading } = useLiveStatus();

  const allConfigStreams: StreamItem[] = [
    ...siteConfig.villages.konoha.streams,
    ...siteConfig.villages.suna.streams,
  ];

  // Canlı (Online) olan sunucu yayıncılarını filtrele
  const onlineStreams = allConfigStreams.filter(s => statuses[s.id]?.isLive);

  // Yayın yoksa boş durum & Canlı Yayıncı Önerileri ekranı
  if (streams.length === 0) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto select-none">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center">
          {/* Canlı Yayıncılar Varsa Öne Çıkar */}
          {onlineStreams.length > 0 ? (
            <div className="w-full mb-8">
              {/* Canlı Başlık ve Sayı Rozeti */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 naruto-title">
                  Şu Anda Canlı Yayında Olan POV'lar
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-lg mx-auto">
                Sunucuda aktif yayında olan karakterler algılandı. Aşağıdaki kartlardan dilediğinizi tek tıkla izlemeye başlayabilirsiniz.
              </p>

              {/* Canlı Yayın Kartları Grid'i */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6 text-left">
                {onlineStreams.map(stream => {
                  const status = statuses[stream.id];
                  const isKonoha = stream.village === 'konoha';

                  return (
                    <div
                      key={stream.id}
                      className="group relative bg-ninja-900 border border-orange-500/40 hover:border-orange-500 rounded-2xl overflow-hidden shadow-xl hover:shadow-orange-500/10 transition-all flex flex-col"
                    >
                      {/* Canlı Önizleme Thumbnail / Başlık Alanı */}
                      <div className="relative aspect-video w-full bg-ninja-950 overflow-hidden">
                        {status?.thumbnail ? (
                          <img
                            src={status.thumbnail}
                            alt={stream.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ninja-950 to-ninja-900">
                            <Radio className="w-8 h-8 text-rose-500/60 animate-pulse" />
                          </div>
                        )}

                        {/* Canlı & İzleyici Rozeti */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            CANLI
                          </span>
                          {typeof status?.viewers === 'number' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-slate-200 text-[10px] font-semibold border border-white/10">
                              <Users className="w-3 h-3 text-slate-400" />
                              {status.viewers.toLocaleString('tr-TR')}
                            </span>
                          )}
                        </div>

                        {/* Platform Rozeti */}
                        <div className="absolute top-2 right-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              stream.platform === 'kick'
                                ? 'bg-kick text-black'
                                : 'bg-twitch text-white'
                            }`}
                          >
                            {stream.platform}
                          </span>
                        </div>
                      </div>

                      {/* Bilgiler ve Buton */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs">{isKonoha ? '🍃' : '⏳'}</span>
                            <span className="font-bold text-sm text-slate-100 truncate">
                              {stream.name}
                            </span>
                            {stream.roleTag && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-ninja-800 text-slate-400 border border-ninja-700 font-medium truncate">
                                {stream.roleTag}
                              </span>
                            )}
                          </div>

                          {status?.title && (
                            <p className="text-xs text-slate-300 line-clamp-2 font-medium mb-3">
                              {status.title}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            if (onAddStream) {
                              onAddStream({
                                name: stream.name,
                                channel: stream.channel,
                                platform: stream.platform,
                                village: stream.village,
                                roleTag: stream.roleTag,
                              });
                            }
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 transition-all active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>İzlemeye Başla</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tüm Canlı Yayınları Birlikte Aç Butonu */}
              {onlineStreams.length > 1 && onAddMultipleStreams && (
                <div className="mb-8">
                  <button
                    onClick={() => onAddMultipleStreams(onlineStreams)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-orange-600/25 transition-all hover:scale-105 active:scale-95 mx-auto"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Tüm Canlı Yayınları Aç ({onlineStreams.length} Yayın)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Eğer Hiç Canlı Yayın Yoksa */
            <div className="mb-6">
              <div className="relative mb-4 mx-auto w-16 h-16 rounded-2xl bg-ninja-900 border border-ninja-700/80 flex items-center justify-center shadow-2xl">
                <Tv className="w-8 h-8 text-orange-500" />
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[10px]">
                  <Sparkles className="w-3 h-3" />
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2 naruto-title">
                {isLoading ? 'Yayıncı Durumları Kontrol Ediliyor...' : 'Şu Anda Aktif Canlı Yayın Bulunmuyor'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6">
                Aşağıdaki butonları kullanarak köylerin kayıtlı POV yayınlarını açabilir veya yayın listesinden seçim yapabilirsiniz.
              </p>
            </div>
          )}

          {/* Alt Hızlı Köy ve Liste Butonları */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4 border-t border-ninja-800/80 w-full">
            <button
              onClick={() => onLoadVillage('konoha')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold text-xs transition-all hover:scale-105 active:scale-95"
            >
              <span>🍃</span>
              <span>Konoha POV'larını Yükle</span>
            </button>

            <button
              onClick={() => onLoadVillage('suna')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-semibold text-xs transition-all hover:scale-105 active:scale-95"
            >
              <span>⏳</span>
              <span>Suna POV'larını Yükle</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ninja-800 hover:bg-ninja-700 border border-ninja-600 text-slate-200 font-semibold text-xs transition-all hover:scale-105 active:scale-95"
            >
              <Tv className="w-3.5 h-3.5 text-orange-400" />
              <span>Tüm Yayın Listesini Gör</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const count = streams.length;

  // Tiyatro modunda odaklanmış yayını belirle (yoksa ilk yayın)
  const effectiveMainId =
    focusedStreamId && streams.some(s => s.id === focusedStreamId)
      ? focusedStreamId
      : streams[0]?.id;

  // Fit-to-Screen Grid Dağılımı
  let containerGridClass = '';

  if (layoutMode === 'theatre') {
    if (count === 1) {
      containerGridClass = 'grid-cols-1 grid-rows-1';
    } else if (count === 2) {
      containerGridClass = 'grid-cols-1 lg:grid-cols-12 grid-rows-2 lg:grid-rows-1';
    } else if (count === 3) {
      containerGridClass = 'grid-cols-1 lg:grid-cols-12 grid-rows-3 lg:grid-rows-2';
    } else {
      containerGridClass = 'grid-cols-1 lg:grid-cols-12 grid-rows-4 lg:grid-rows-3';
    }
  } else if (layoutMode === '2x2') {
    containerGridClass = 'grid-cols-1 sm:grid-cols-2 grid-rows-4 sm:grid-rows-2';
  } else {
    // Otomatik Mod (Auto):
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
      containerGridClass = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
    }
  }

  return (
    <div
      className={`flex-1 h-full w-full min-h-0 min-w-0 grid ${containerGridClass} gap-2 sm:gap-3 p-2 sm:p-3 overflow-hidden transition-all duration-300`}
    >
      {streams.map(stream => {
        const isMain = layoutMode === 'theatre' && stream.id === effectiveMainId;

        let itemClass = 'h-full w-full min-h-0 min-w-0 flex items-center justify-center transition-all duration-200';

        if (count === 1) {
          itemClass += ' col-span-1 row-span-1 max-w-6xl mx-auto order-none';
        } else if (layoutMode === 'theatre') {
          if (count === 2) {
            if (isMain) {
              itemClass += ' order-first col-span-1 lg:col-span-8 row-span-1';
            } else {
              itemClass += ' order-none col-span-1 lg:col-span-4 row-span-1';
            }
          } else if (count === 3) {
            if (isMain) {
              itemClass += ' order-first col-span-1 lg:col-span-8 row-span-1 lg:row-span-2';
            } else {
              itemClass += ' order-none col-span-1 lg:col-span-4 row-span-1';
            }
          } else {
            if (isMain) {
              itemClass += ' order-first col-span-1 lg:col-span-9 row-span-1 lg:row-span-3';
            } else {
              itemClass += ' order-none col-span-1 lg:col-span-3 row-span-1';
            }
          }
        } else if (layoutMode === '2x2') {
          itemClass += ' col-span-1 row-span-1 order-none';
        } else {
          itemClass += ' col-span-1 row-span-1 order-none';
        }

        return (
          <div key={stream.id} className={itemClass}>
            <StreamPlayer
              stream={stream}
              isMuted={mutedStreams.has(stream.id)}
              isSolo={soloStreamId === stream.id}
              onToggleMute={onToggleMute}
              onSoloAudio={onSoloAudio}
              onRemove={onRemoveStream}
              isFocused={isMain}
              onFocus={onFocusStream}
            />
          </div>
        );
      })}
    </div>
  );
};
