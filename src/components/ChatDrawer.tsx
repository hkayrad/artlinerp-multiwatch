import React, { useState } from 'react';
import { X, MessageSquare, ExternalLink } from 'lucide-react';
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

  if (!isOpen) return null;

  // Aktif yayın yoksa
  if (streams.length === 0) {
    return (
      <aside className="w-80 md:w-96 bg-ninja-900 border-l border-ninja-700/70 flex flex-col shrink-0 select-none">
        <div className="flex items-center justify-between p-3 border-b border-ninja-800">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>Canlı Sohbet</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-ninja-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 text-sm">
          <span>Sohbetini görüntülemek için en az bir yayın ekleyin.</span>
        </div>
      </aside>
    );
  }

  // Seçili akışı bul veya ilkini seç
  const currentStream = streams.find(s => s.id === selectedStreamId) || streams[0];
  const parentDomain = getParentDomain();

  const getChatUrl = () => {
    if (currentStream.platform === 'twitch') {
      return `https://www.twitch.tv/embed/${encodeURIComponent(currentStream.channel)}/chat?parent=${parentDomain}&darkpopout=true`;
    }
    // Kick Canlı Sohbet Gömme (chat.kick.cx - Gerçek web chat arayüzü)
    return `https://chat.kick.cx/embed/${encodeURIComponent(currentStream.channel)}`;
  };

  const getPopoutUrl = () => {
    if (currentStream.platform === 'twitch') {
      return `https://www.twitch.tv/popout/${encodeURIComponent(currentStream.channel)}/chat`;
    }
    return `https://kick.com/popout/${encodeURIComponent(currentStream.channel)}/chat`;
  };

  return (
    <aside className="w-full md:w-80 xl:w-96 bg-ninja-900 border-l border-ninja-700/70 flex flex-col shrink-0 z-20 shadow-2xl">
      {/* Başlık ve Kapat Butonu */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-ninja-800 bg-ninja-900">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-sm text-slate-200">Canlı Sohbet</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded bg-ninja-800 text-slate-400 border border-ninja-700">
            {currentStream.platform.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <a
            href={getPopoutUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title="Sohbeti Ayrı Açılır Pencerede Aç (Kendi hesabınızla yazışmak için)"
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-ninja-800 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            title="Sohbeti Gizle"
            className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-ninja-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Yayın Sekmeleri */}
      <div className="flex items-center gap-1 p-1.5 bg-ninja-950 border-b border-ninja-800 overflow-x-auto select-none">
        {streams.map(stream => {
          const isSelected = stream.id === currentStream.id;
          return (
            <button
              key={stream.id}
              onClick={() => setSelectedStreamId(stream.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-ninja-800 text-slate-100 border border-ninja-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-ninja-900'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  stream.platform === 'kick' ? 'bg-kick' : 'bg-twitch'
                }`}
              />
              <span className="truncate max-w-[100px]">{stream.name || stream.channel}</span>
            </button>
          );
        })}
      </div>

      {/* Sohbet Iframe */}
      <div className="flex-1 w-full bg-ninja-950 relative min-h-[300px]">
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
