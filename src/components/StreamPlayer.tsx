import React, { useState, useMemo } from 'react';
import { Volume2, VolumeX, RotateCw, X, Maximize2, Headphones, Expand } from 'lucide-react';
import { StreamItem } from '../config/siteConfig';
import { getParentDomain } from '../utils/streamUtils';

interface StreamPlayerProps {
  stream: StreamItem;
  isMuted: boolean;
  isSolo: boolean;
  onToggleMute: (id: string) => void;
  onSoloAudio: (id: string) => void;
  onRemove: (id: string) => void;
  isFocused?: boolean;
  onFocus?: (id: string) => void;
}

export const StreamPlayer: React.FC<StreamPlayerProps> = React.memo(({
  stream,
  isMuted,
  isSolo,
  onToggleMute,
  onSoloAudio,
  onRemove,
  isFocused = false,
  onFocus,
}) => {
  const [reloadKey, setReloadKey] = useState(0);
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const parentDomain = getParentDomain();

  // Platform iframe URL üretimi (ses durumu değiştiğinde player güncellenir)
  const embedUrl = useMemo(() => {
    if (stream.platform === 'twitch') {
      return `https://player.twitch.tv/?channel=${encodeURIComponent(stream.channel)}&parent=${parentDomain}&muted=${isMuted ? 'true' : 'false'}&autoplay=true`;
    }
    // Kick embed player
    return `https://player.kick.com/${encodeURIComponent(stream.channel)}?autoplay=true&muted=${isMuted ? 'true' : 'false'}`;
  }, [stream.platform, stream.channel, parentDomain, reloadKey, isMuted]);

  const handleReload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setReloadKey(prev => prev + 1);
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  const isKick = stream.platform === 'kick';

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsControlsVisible(true)}
      onMouseLeave={() => setIsControlsVisible(false)}
      className="w-full h-full max-w-full max-h-full flex items-center justify-center p-0.5"
    >
      <div
        className={`group relative flex flex-col bg-ninja-900 border rounded-xl overflow-hidden shadow-lg transition-all duration-200 w-full h-full max-w-full max-h-full ${
          isFocused
            ? 'ring-2 ring-orange-500 border-orange-500/50 shadow-orange-500/20'
            : isSolo
            ? 'ring-2 ring-emerald-500 border-emerald-500/50 shadow-emerald-500/20'
            : 'border-ninja-700/60 hover:border-ninja-600'
        }`}
        style={{ aspectRatio: '16 / 9' }}
      >
        {/* Stream Bar / Header */}
        <div
          onClick={() => onFocus?.(stream.id)}
          className={`flex items-center justify-between px-2.5 py-1.5 bg-ninja-900/95 backdrop-blur-md border-b border-ninja-700/60 z-10 shrink-0 transition-opacity duration-200 select-none cursor-pointer ${
            isControlsVisible ? 'opacity-100' : 'opacity-90 sm:opacity-80'
          }`}
        >
          {/* Sol Taraf: Platform Rozeti, İsim ve Rol */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase flex items-center gap-1 ${
                isKick
                  ? 'bg-kick text-black font-extrabold shadow-sm shadow-kick/30'
                  : 'bg-twitch text-white font-bold shadow-sm shadow-twitch/30'
              }`}
            >
              {stream.platform}
            </span>

            <div className="flex items-center gap-1.5 truncate">
              <span className="font-semibold text-xs sm:text-sm text-slate-100 truncate">
                {stream.name || stream.channel}
              </span>
              {stream.roleTag && (
                <span className="hidden sm:inline-block text-[11px] px-1.5 py-0.5 rounded bg-ninja-800 text-slate-400 border border-ninja-700/60 font-medium truncate">
                  {stream.roleTag}
                </span>
              )}
            </div>
          </div>

          {/* Sağ Taraf: Kontroller */}
          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            {/* Tiyatro modunda ana ekrana al butonu (Odaklanmamışsa) */}
            {!isFocused && onFocus && (
              <button
                onClick={() => onFocus(stream.id)}
                title="Tiyatroda Ana Ekrana Al (Yayın kesilmez)"
                className="p-1.5 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
              >
                <Expand className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Tek Ses (Solo Audio) */}
            <button
              onClick={() => onSoloAudio(stream.id)}
              title={isSolo ? "Tek Ses Aktif (Diğerleri susturuldu)" : "Sesi Yalnızca Buraya Ver (Diğerlerini sustur)"}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                isSolo
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-ninja-800'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">{isSolo ? 'Tek Ses' : 'Solo'}</span>
            </button>

            {/* Ses Aç / Kapa */}
            <button
              onClick={() => onToggleMute(stream.id)}
              title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
              className={`p-1.5 rounded-lg transition-colors ${
                isMuted
                  ? 'text-rose-400 hover:bg-rose-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-ninja-800'
              }`}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            {/* Yenile */}
            <button
              onClick={handleReload}
              title="Yayını Yenile (Donarsa tıkla)"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-ninja-800 rounded-lg transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Tam Ekran */}
            <button
              onClick={handleFullscreen}
              title="Bu Yayını Tam Ekran Yap"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-ninja-800 rounded-lg transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Kapat */}
            <button
              onClick={() => onRemove(stream.id)}
              title="Yayını Kaldır"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video Container (16:9 ratio, fills remaining height) */}
        <div className="relative flex-1 w-full h-full min-h-0 bg-ninja-950 overflow-hidden">
          <iframe
            key={`${stream.channel}-${reloadKey}`}
            src={embedUrl}
            title={`${stream.platform} - ${stream.channel}`}
            className="w-full h-full border-0 absolute inset-0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="eager"
          />
        </div>
      </div>
    </div>
  );
});

