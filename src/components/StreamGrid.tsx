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

  // Tiyatro / Odak Modu: 1 ana yayın büyük, diğerleri yanda veya altta
  if (layoutMode === 'theatre') {
    const mainStream = streams.find(s => s.id === focusedStreamId) || streams[0];
    const sideStreams = streams.filter(s => s.id !== mainStream.id);

    return (
      <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 overflow-y-auto">
        {/* Ana Büyük Yayın */}
        <div className="flex-1 min-h-[50vh] flex flex-col">
          <StreamPlayer
            stream={mainStream}
            isMuted={mutedStreams.has(mainStream.id)}
            isSolo={soloStreamId === mainStream.id}
            onToggleMute={onToggleMute}
            onSoloAudio={onSoloAudio}
            onRemove={onRemoveStream}
            isFocused={true}
            onFocus={onFocusStream}
          />
        </div>

        {/* Yan Thumbnail Yayınlar */}
        {sideStreams.length > 0 && (
          <div className="w-full lg:w-80 xl:w-96 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto shrink-0 pb-2 lg:pb-0">
            {sideStreams.map(stream => (
              <div key={stream.id} className="min-w-[260px] lg:min-w-0">
                <StreamPlayer
                  stream={stream}
                  isMuted={mutedStreams.has(stream.id)}
                  isSolo={soloStreamId === stream.id}
                  onToggleMute={onToggleMute}
                  onSoloAudio={onSoloAudio}
                  onRemove={onRemoveStream}
                  isFocused={false}
                  onFocus={onFocusStream}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Sabit 2x2 Izgara Modu
  if (layoutMode === '2x2') {
    return (
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 overflow-y-auto content-start auto-rows-fr">
        {streams.map(stream => (
          <StreamPlayer
            key={stream.id}
            stream={stream}
            isMuted={mutedStreams.has(stream.id)}
            isSolo={soloStreamId === stream.id}
            onToggleMute={onToggleMute}
            onSoloAudio={onSoloAudio}
            onRemove={onRemoveStream}
            isFocused={focusedStreamId === stream.id}
            onFocus={onFocusStream}
          />
        ))}
      </div>
    );
  }

  // Dinamik Otomatik Izgara (Auto Mode)
  const count = streams.length;
  let gridColsClass = 'grid-cols-1';

  if (count === 2) {
    gridColsClass = 'grid-cols-1 lg:grid-cols-2';
  } else if (count === 3) {
    gridColsClass = 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
  } else if (count === 4) {
    gridColsClass = 'grid-cols-1 sm:grid-cols-2';
  } else if (count >= 5 && count <= 6) {
    gridColsClass = 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';
  } else if (count >= 7) {
    gridColsClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4';
  }

  return (
    <div
      className={`flex-1 grid ${gridColsClass} gap-3 p-3 overflow-y-auto content-start auto-rows-fr`}
    >
      {streams.map(stream => (
        <StreamPlayer
          key={stream.id}
          stream={stream}
          isMuted={mutedStreams.has(stream.id)}
          isSolo={soloStreamId === stream.id}
          onToggleMute={onToggleMute}
          onSoloAudio={onSoloAudio}
          onRemove={onRemoveStream}
          isFocused={focusedStreamId === stream.id}
          onFocus={onFocusStream}
        />
      ))}
    </div>
  );
};
