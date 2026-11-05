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

  // 12 Sütunlu Dengeli ve Orantılı Izgara Kapsayıcısı
  const containerAlignmentClass = count === 1 ? 'content-center' : 'content-start';

  return (
    /**
     * 12 Sütunlu Izgara (Grid-12):
     * - 1 Yayın: Ortalanmış, ekran yüksekliğine tam oturan dengeli sinematik boyut.
     * - 2 Yayın: Tiyatro modunda %67 - %33 mükemmel orantı; Otomatikte eşit %50 / %50.
     * - 3 Yayın: Tiyatro modunda ana ekran yüksekliği ile yan 2 ekranın toplam yüksekliği pikseli pikseline eşit.
     * - 4 Yayın: Tiyatro modunda ana ekran ile yan 3 ekran tam eşit; Otomatikte simetrik 2x2.
     * Tüm yayınlar tek kapsayıcıda kalarak düzen geçişlerinde ASLA yeniden yüklenmez.
     */
    <div
      className={`flex-1 grid grid-cols-12 gap-3 p-3 sm:p-4 overflow-y-auto ${containerAlignmentClass} transition-all duration-300`}
    >
      {streams.map(stream => {
        const isMain = layoutMode === 'theatre' && stream.id === effectiveMainId;

        let itemClass = 'w-full transition-all duration-200';

        if (count === 1) {
          // Tek Yayın: Ekranda orantılı, aşırı taşmayan ve tam ortalanmış görünüm
          itemClass += ' col-span-12 max-w-5xl mx-auto order-none';
        } else if (layoutMode === 'theatre') {
          // TİYATRO DÜZENİ ORANTILARI:
          if (count === 2) {
            if (isMain) {
              // 2 Yayında: %67 Ana Ekran (8 Kolon), %33 Yan Ekran (4 Kolon)
              itemClass += ' order-first col-span-12 lg:col-span-8';
            } else {
              itemClass += ' order-none col-span-12 lg:col-span-4';
            }
          } else if (count === 3) {
            if (isMain) {
              // 3 Yayında: Ana ekran 8 kolon & 2 satır. Yan 2 ekran (4'er kolon) tam ana ekran yüksekliğine denk gelir.
              itemClass += ' order-first col-span-12 lg:col-span-8 lg:row-span-2';
            } else {
              itemClass += ' order-none col-span-12 lg:col-span-4';
            }
          } else {
            // 4 ve üzeri yayında: Ana ekran 9 kolon & 3 satır (%75). Yan ekranlar 3 kolon (%25).
            if (isMain) {
              itemClass += ' order-first col-span-12 lg:col-span-9 lg:row-span-3';
            } else {
              itemClass += ' order-none col-span-12 lg:col-span-3';
            }
          }
        } else if (layoutMode === '2x2') {
          // 2x2 Sabit Izgara: Eşit %50 / %50 (6 kolon)
          itemClass += ' col-span-12 sm:col-span-6 order-none';
        } else {
          // OTOMATİK MOD DENGELİ DAĞILIM:
          if (count === 2) {
            // 2 Yayın: Eşit %50 / %50 (Masaüstünde yan yana)
            itemClass += ' col-span-12 lg:col-span-6 order-none';
          } else if (count === 3) {
            // 3 Yayın: Eşit %33.3 (Masaüstünde 3 sütun)
            itemClass += ' col-span-12 md:col-span-6 lg:col-span-4 order-none';
          } else if (count === 4) {
            // 4 Yayın: Simetrik 2x2
            itemClass += ' col-span-12 sm:col-span-6 order-none';
          } else if (count >= 5 && count <= 6) {
            // 5-6 Yayın: Dengeli 3x2
            itemClass += ' col-span-12 sm:col-span-6 lg:col-span-4 order-none';
          } else {
            // 7+ Yayın: 4 sütunlu dağılım
            itemClass += ' col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3 order-none';
          }
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
