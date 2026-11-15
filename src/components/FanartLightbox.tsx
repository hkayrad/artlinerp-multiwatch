import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink, Trash2 } from 'lucide-react';
import { FanartItem } from '../types/fanart';
import { FANART_VILLAGE_META, formatFanartDate } from '../utils/fanartMeta';
import { VillageEmblem } from './VillageEmblems';

interface FanartLightboxProps {
  item: FanartItem | null;
  hasPrev: boolean;
  hasNext: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDelete?: (item: FanartItem) => void;
}

export const FanartLightbox: React.FC<FanartLightboxProps> = ({
  item,
  hasPrev,
  hasNext,
  isAdmin,
  onClose,
  onPrev,
  onNext,
  onDelete,
}) => {
  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        onPrev();
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, hasPrev, hasNext, onClose, onPrev, onNext]);

  if (!item) return null;

  const villageMeta = FANART_VILLAGE_META[item.village] ?? FANART_VILLAGE_META.genel;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ninja-800/80 bg-ninja-950/70">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold shrink-0 ${villageMeta.badgeClass}`}
          >
            <VillageEmblem village={item.village === 'genel' ? 'all' : item.village} className="w-3 h-3" />
            {villageMeta.label}
          </span>
          <h2 className="text-sm sm:text-base font-bold text-slate-100 truncate">
            {item.title}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Orijinal boyutta aç"
            className="h-8 px-2.5 rounded-lg bg-ninja-900 hover:bg-ninja-800 border border-ninja-700 text-xs text-slate-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Orijinal</span>
          </a>

          {isAdmin && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(item)}
              title="Eseri sil"
              className="h-8 px-2.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-xs text-rose-300 inline-flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sil</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="h-8 w-8 rounded-lg bg-ninja-900 hover:bg-ninja-800 border border-ninja-700 text-slate-300 hover:text-white inline-flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Image Stage */}
      <div
        className="flex-1 min-h-0 relative flex items-center justify-center p-4 sm:p-8"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {hasPrev && (
          <button
            type="button"
            onClick={onPrev}
            aria-label="Önceki eser"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-ninja-900/90 hover:bg-ninja-800 border border-ninja-700 text-slate-100 flex items-center justify-center shadow-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <img
          src={item.url}
          alt={item.title}
          className="max-h-full max-w-full object-contain rounded-xl border border-ninja-800 shadow-2xl select-none"
        />

        {hasNext && (
          <button
            type="button"
            onClick={onNext}
            aria-label="Sonraki eser"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-ninja-900/90 hover:bg-ninja-800 border border-ninja-700 text-slate-100 flex items-center justify-center shadow-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-3 border-t border-ninja-800/80 bg-ninja-950/80">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="space-y-0.5 min-w-0">
            <div className="text-slate-200 font-semibold">
              Çizer: <span className="text-orange-400">{item.artist}</span>
            </div>
            {item.description && (
              <p className="text-slate-400 text-[11px] leading-relaxed">{item.description}</p>
            )}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {formatFanartDate(item.approvedAt || item.createdAt)}
            {item.width && item.height ? ` · ${item.width}×${item.height}` : ''}
          </div>
        </div>
      </div>
    </div>
  );
};
