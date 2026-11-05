import React from 'react';
import { StreamItem } from '../config/siteConfig';
import { StreamPlayer } from './StreamPlayer';
import { Tv, Sparkles } from 'lucide-react';

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
}) => {
  // Yayın yoksa boş durum ekranı
  if (streams.length === 0) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-ninja-900 border border-ninja-700/80 flex items-center justify-center shadow-2xl">
            <Tv className="w-10 h-10 text-orange-500" />
          </div>
          <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
        </div>

        <h2 className="text-2xl font-bold text-slate-100 mb-2 naruto-title">
          Aktif Yayın Bulunmuyor
        </h2>
        <p className="text-sm text-slate-400 max-w-md mb-8">
          İzlemek istediğiniz köyün POV yayınlarını tek tıkla yükleyebilir veya yayın listesinden karakter seçebilirsiniz.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onLoadVillage('konoha')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold transition-all hover:scale-105 active:scale-95"
          >
            <span>🍃</span>
            <span>Konohagakure POV'larını Yükle</span>
          </button>

          <button
            onClick={() => onLoadVillage('suna')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-semibold transition-all hover:scale-105 active:scale-95"
          >
            <span>⏳</span>
            <span>Sunagakure POV'larını Yükle</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-600/20"
          >
            <Tv className="w-4 h-4" />
            <span>Yayın Listesinden Seç</span>
          </button>
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

  // Fit-to-Screen Grid Dağılımı (Dikeyde taşmayı ve altta boşluk kalmasını engelleyen ızgara şablonu)
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

        // Her grid hücresi kendi sınırları içinde kalır ve içeriği orantılı ölçeklendirir
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
