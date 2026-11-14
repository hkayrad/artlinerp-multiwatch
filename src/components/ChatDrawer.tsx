import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, MessageSquare, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { StreamItem } from '../config/siteConfig';
import { getParentDomain } from '../utils/streamUtils';

interface ChatDrawerProps {
  isOpen: boolean;
  streams: StreamItem[];
  onClose: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  streams,
  onClose,
}) => {
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedStreamId && !streams.some(s => s.id === selectedStreamId)) {
      setSelectedStreamId(streams[0]?.id ?? null);
    }
  }, [streams, selectedStreamId]);

  const updateScrollButtons = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const rafId = window.requestAnimationFrame(updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [isOpen, streams, updateScrollButtons]);

  if (!isOpen) return null;

  if (streams.length === 0) {
    return (
      <aside className="fixed inset-0 z-40 md:relative md:inset-auto md:z-auto w-full md:w-80 xl:w-96 min-h-0 overflow-hidden bg-ninja-900 border-l border-ninja-700/80 flex flex-col shrink-0 select-none animate-slide-in-right">
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-ninja-700/80 bg-ninja-950/60 shrink-0">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>Canlı Sohbet</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-ninja-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 text-xs">
          <span>Sohbetini görüntülemek için en az bir yayın ekleyin.</span>
        </div>
      </aside>
    );
  }

  const currentStream = streams.find(s => s.id === selectedStreamId) || streams[0];
  const parentDomain = getParentDomain();

  const getChatUrl = () => {
    if (currentStream.platform === 'twitch') {
      return `https://www.twitch.tv/embed/${encodeURIComponent(currentStream.channel)}/chat?parent=${parentDomain}&darkpopout=true`;
    }
    return `https://chat.kick.cx/embed/${encodeURIComponent(currentStream.channel)}`;
  };

  const getPopoutUrl = () => {
    if (currentStream.platform === 'twitch') {
      return `https://www.twitch.tv/popout/${encodeURIComponent(currentStream.channel)}/chat`;
    }
    return `https://kick.com/popout/${encodeURIComponent(currentStream.channel)}/chat`;
  };

  const handleTabsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = tabsRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      updateScrollButtons();
    }
  };

  const scrollTabsBy = (delta: number) => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <aside className="fixed inset-0 z-40 md:relative md:inset-auto md:z-auto w-full md:w-80 xl:w-96 min-h-0 overflow-hidden bg-ninja-900 border-l border-ninja-700/80 flex flex-col shrink-0 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-ninja-700/80 bg-ninja-950/60 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-sm text-slate-100">Canlı Sohbet</span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-ninja-800 text-slate-300 border border-ninja-700 uppercase">
            {currentStream.platform}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <a
            href={getPopoutUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title="Sohbeti ayrı pencerede aç"
            aria-label="Sohbeti ayrı pencerede aç"
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-ninja-800 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            title="Sohbeti gizle (C)"
            aria-label="Sohbeti gizle"
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-ninja-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Channel Tabs */}
      <div className="flex items-center gap-1 p-1.5 bg-ninja-950 border-b border-ninja-700/80 select-none shrink-0">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollTabsBy(-140)}
            title="Sola kaydır"
            className="p-1 rounded bg-ninja-900 hover:bg-ninja-800 text-slate-300 hover:text-white border border-ninja-700 shrink-0 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}

        <div
          ref={tabsRef}
          onWheel={handleTabsWheel}
          onScroll={updateScrollButtons}
          className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto pb-0.5"
        >
          {streams.map(stream => {
            const isSelected = stream.id === currentStream.id;
            return (
              <button
                key={stream.id}
                type="button"
                onClick={(e) => {
                  setSelectedStreamId(stream.id);
                  e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
                }}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap border transition-colors ${
                  isSelected
                    ? 'bg-ninja-800 text-white border-orange-500/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-ninja-900'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    stream.platform === 'kick' ? 'bg-kick' : 'bg-twitch'
                  }`}
                />
                <span className="truncate max-w-[120px]">{stream.name || stream.channel}</span>
              </button>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollTabsBy(140)}
            title="Sağa kaydır"
            className="p-1 rounded bg-ninja-900 hover:bg-ninja-800 text-slate-300 hover:text-white border border-ninja-700 shrink-0 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Chat Iframe */}
      <div className="flex-1 w-full min-h-0 bg-ninja-950 relative">
        <iframe
          key={`${currentStream.platform}-${currentStream.channel}`}
          src={getChatUrl()}
          title={`Sohbet - ${currentStream.channel}`}
          className="w-full h-full border-0 absolute inset-0"
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </aside>
  );
};
