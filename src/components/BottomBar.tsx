import React from 'react';
import { VolumeX, Volume2, Trash2, LayoutGrid, LayoutTemplate, Share2 } from 'lucide-react';
import { LayoutMode } from './StreamGrid';

interface BottomBarProps {
  streamCount: number;
  layoutMode: LayoutMode;
  isAllMuted: boolean;
  onChangeLayout: (mode: LayoutMode) => void;
  onMuteAll: () => void;
  onUnmuteAll: () => void;
  onClearAll: () => void;
  onShareLink: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  streamCount,
  layoutMode,
  isAllMuted,
  onChangeLayout,
  onMuteAll,
  onUnmuteAll,
  onClearAll,
  onShareLink,
}) => {
  return (
    <footer className="bg-ninja-900/90 backdrop-blur-md border-t border-ninja-700/60 px-4 py-2 z-20 select-none">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Sol Taraf: Aktif Yayın Bilgisi */}
        <div className="flex items-center gap-2 text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-slate-300">
            {streamCount} Canlı POV Yayını
          </span>
        </div>

        {/* Orta: Hızlı Ses ve Düzen Butonları */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Tümünü Sustur / Sesi Aç */}
          {isAllMuted ? (
            <button
              onClick={onUnmuteAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-ninja-800 hover:bg-ninja-700 text-emerald-400 border border-ninja-700 font-medium transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sesleri Aç</span>
            </button>
          ) : (
            <button
              onClick={onMuteAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-ninja-800 hover:bg-rose-500/10 text-rose-400 border border-ninja-700 font-medium transition-colors"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tümünü Sustur</span>
            </button>
          )}

          {/* Düzen Seçenekleri */}
          <div className="flex items-center bg-ninja-950 p-0.5 rounded-lg border border-ninja-800">
            <button
              onClick={() => onChangeLayout('auto')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                layoutMode === 'auto'
                  ? 'bg-ninja-800 text-orange-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span className="hidden sm:inline">Otomatik</span>
            </button>

            <button
              onClick={() => onChangeLayout('2x2')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                layoutMode === '2x2'
                  ? 'bg-ninja-800 text-orange-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="font-mono text-[11px] font-bold">2x2</span>
            </button>

            <button
              onClick={() => onChangeLayout('theatre')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                layoutMode === 'theatre'
                  ? 'bg-ninja-800 text-orange-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutTemplate className="w-3 h-3" />
              <span className="hidden sm:inline">Tiyatro</span>
            </button>
          </div>
        </div>

        {/* Sağ Taraf: Temizle ve Paylaş */}
        <div className="flex items-center gap-2">
          {streamCount > 0 && (
            <button
              onClick={onClearAll}
              title="Tüm yayınları ekrandan kaldır"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Temizle</span>
            </button>
          )}

          <button
            onClick={onShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 font-semibold transition-colors active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Discord için Kopyala</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
