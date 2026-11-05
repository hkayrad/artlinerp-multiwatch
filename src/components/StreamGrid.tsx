import React from 'react';
import { StreamItem } from '../config/siteConfig';
import { StreamPlayer } from './StreamPlayer';
import { Tv, Plus, Sparkles } from 'lucide-react';

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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
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
          İzlemek istediğiniz köyün POV yayınlarını tek tıkla yükleyebilir veya özel bir Twitch / Kick kanalı ekleyebilirsiniz.
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
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-ninja-800 hover:bg-ninja-700 border border-ninja-600 text-slate-200 font-semibold transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 text-orange-400" />
            <span>Özel Yayın Ekle</span>
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

  // Kapsayıcı CSS Grid sınıflarını belirle
  let containerGridClass = 'grid-cols-1';

  if (layoutMode === 'theatre') {
    if (count === 1) {
      containerGridClass = 'grid-cols-1';
    } else {
      // Tiyatro Modu: Masaüstünde 4 sütunlu ızgara (3 sütun ana yayın, 1 sütun yan yayınlar)
      containerGridClass = 'grid-cols-1 lg:grid-cols-4 items-start auto-rows-max';
    }
  } else if (layoutMode === '2x2') {
    containerGridClass = 'grid-cols-1 md:grid-cols-2 auto-rows-fr';
  } else {
    // Otomatik Mod (Auto Mode)
    if (count === 2) {
      containerGridClass = 'grid-cols-1 lg:grid-cols-2 auto-rows-fr';
    } else if (count === 3) {
      containerGridClass = 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-fr';
    } else if (count === 4) {
      containerGridClass = 'grid-cols-1 sm:grid-cols-2 auto-rows-fr';
    } else if (count >= 5 && count <= 6) {
      containerGridClass = 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr';
    } else if (count >= 7) {
      containerGridClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-fr';
    } else {
      containerGridClass = 'grid-cols-1 auto-rows-fr';
    }
  }

  // Tiyatro modunda ana yayının kaç satır kaplayacağını belirle
  const mainRowSpanClass =
    count === 2
      ? 'lg:row-span-1'
      : count === 3
      ? 'lg:row-span-2'
      : 'lg:row-span-3';

  return (
    /**
     * ÖNEMLİ: Tarayıcılarda (Chrome, Firefox, Safari) iframe öğeleri DOM ağacında
     * başka bir kapsayıcıya (div) taşındığında veya unmount edildiğinde otomatik olarak yeniden yüklenir (reload).
     * Düzen değiştirildiğinde (Auto -> Tiyatro) veya Tiyatro modunda yayınların yeri değiştiğinde
     * yayınların kesilmemesi / yeniden yüklenmemesi için tüm StreamPlayer öğeleri
     * TEK BİR SABİT KAP (persistent container) içinde tutulur ve sadece CSS Grid / order sınıfları değiştirilir.
     */
    <div
      className={`flex-1 grid ${containerGridClass} gap-3 p-3 overflow-y-auto content-start transition-all duration-300`}
    >
      {streams.map(stream => {
        const isMain = layoutMode === 'theatre' && stream.id === effectiveMainId;

        // Her yayın öğesinin CSS Grid ve sıralama sınıfları
        let itemClass = 'w-full transition-all duration-200';

        if (layoutMode === 'theatre') {
          if (isMain) {
            itemClass += ` order-first ${count > 1 ? `lg:col-span-3 ${mainRowSpanClass}` : 'col-span-1'}`;
          } else {
            itemClass += ' order-none lg:col-span-1';
          }
        } else {
          itemClass += ' col-span-1 order-none';
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
