import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Share2,
  LayoutGrid,
  LayoutTemplate,
  Disc as DiscordIcon,
  ExternalLink,
  Users,
  Volume2,
  VolumeX,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react';
import { StreamItem, siteConfig } from '../config/siteConfig';
import { LiveStatusInfo } from '../services/streamStatus';
import { VillagePresetMode } from '../hooks/useMultiwatch';
import { LayoutMode } from './StreamGrid';
import { KonohaEmblem, SunaEmblem, AllVillagesEmblem } from './VillageEmblems';
import { LiveQuickSwitch } from './LiveQuickSwitch';

interface HeaderProps {
  activeVillage: 'konoha' | 'suna' | 'all' | 'custom';
  streams: StreamItem[];
  allConfigStreams: StreamItem[];
  statuses: Record<string, LiveStatusInfo>;
  isStatusLoading: boolean;
  layoutMode: LayoutMode;
  isChatOpen: boolean;
  isRosterOpen: boolean;
  isAllMuted: boolean;
  onRefreshStatuses: () => void;
  onSelectVillage: (village: 'konoha' | 'suna' | 'all', mode?: VillagePresetMode) => void;
  onAddStream: (stream: Omit<StreamItem, 'id'>) => void;
  onRemoveStream: (id: string) => void;
  onAddMultipleStreams: (streams: StreamItem[]) => void;
  onChangeLayout: (layout: LayoutMode) => void;
  onMuteAll: () => void;
  onUnmuteAll: () => void;
  onClearAll: () => void;
  onToggleChat: () => void;
  onToggleRoster: () => void;
  onShareLink: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeVillage,
  streams,
  allConfigStreams,
  statuses,
  isStatusLoading,
  layoutMode,
  isChatOpen,
  isRosterOpen,
  isAllMuted,
  onRefreshStatuses,
  onSelectVillage,
  onAddStream,
  onRemoveStream,
  onAddMultipleStreams,
  onChangeLayout,
  onMuteAll,
  onUnmuteAll,
  onClearAll,
  onToggleChat,
  onToggleRoster,
  onShareLink,
}) => {
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [copiedDiscord, setCopiedDiscord] = useState(false);

  const presetMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const streamCount = streams.length;
  const is2x2Disabled = streamCount > 4;
  const konohaLiveCount = siteConfig.villages.konoha.streams.filter(s => statuses[s.id]?.isLive).length;
  const sunaLiveCount = siteConfig.villages.suna.streams.filter(s => statuses[s.id]?.isLive).length;
  const totalLiveCount = konohaLiveCount + sunaLiveCount;

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (presetMenuRef.current && !presetMenuRef.current.contains(e.target as Node)) {
        setIsPresetMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPresetMenuOpen(false);
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleCopyDiscord = () => {
    navigator.clipboard?.writeText(siteConfig.creatorDiscord);
    setCopiedDiscord(true);
    window.setTimeout(() => setCopiedDiscord(false), 2000);
  };

  return (
    <header className="h-12 bg-ninja-900 border-b border-ninja-700/80 sticky top-0 z-30 select-none shrink-0">
      <div className="h-full max-w-[1920px] mx-auto px-2.5 sm:px-3.5 flex items-center justify-between gap-2">
        {/* Left: Brand & Live Quick-Switch */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (streamCount > 0) onClearAll();
            }}
            title={streamCount > 0 ? 'Ana ekrana dön' : siteConfig.serverName}
            className={`flex items-center gap-2 shrink-0 rounded-lg transition-opacity ${
              streamCount > 0 ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'
            }`}
          >
            <img
              src={siteConfig.serverLogo}
              alt={siteConfig.serverName}
              className="w-7 h-7 object-contain rounded-lg bg-ninja-950 border border-orange-500/40 p-0.5"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="hidden sm:inline font-bold text-sm text-slate-100 naruto-title tracking-wide">
              Artline
            </span>
          </button>

          <div className="h-4 w-px bg-ninja-700/70 hidden sm:block" />

          <LiveQuickSwitch
            allConfigStreams={allConfigStreams}
            activeStreams={streams}
            statuses={statuses}
            isLoading={isStatusLoading}
            onRefresh={onRefreshStatuses}
            onAddStream={onAddStream}
            onRemoveStream={onRemoveStream}
            onAddMultipleStreams={onAddMultipleStreams}
            onOpenRoster={onToggleRoster}
          />
        </div>

        {/* Center: Smart Village Presets */}
        <div ref={presetMenuRef} className="relative flex items-center">
          <div className="flex items-center gap-0.5 bg-ninja-950 p-0.5 rounded-lg border border-ninja-700/80">
            <button
              type="button"
              onClick={() => onSelectVillage('konoha', 'live')}
              title="Konohagakure canlı POV yayınlarını aç"
              className={`flex items-center gap-1.5 h-7 px-2 sm:px-2.5 rounded-md text-xs font-semibold transition-colors ${
                activeVillage === 'konoha'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-emerald-400 hover:bg-ninja-800'
              }`}
            >
              <KonohaEmblem className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">Konoha</span>
              {konohaLiveCount > 0 && (
                <span
                  className={`font-mono text-[10px] px-1 rounded ${
                    activeVillage === 'konoha'
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-emerald-500/15 text-emerald-400'
                  }`}
                >
                  {konohaLiveCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectVillage('suna', 'live')}
              title="Sunagakure canlı POV yayınlarını aç"
              className={`flex items-center gap-1.5 h-7 px-2 sm:px-2.5 rounded-md text-xs font-semibold transition-colors ${
                activeVillage === 'suna'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-amber-400 hover:bg-ninja-800'
              }`}
            >
              <SunaEmblem className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">Suna</span>
              {sunaLiveCount > 0 && (
                <span
                  className={`font-mono text-[10px] px-1 rounded ${
                    activeVillage === 'suna'
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-amber-500/15 text-amber-400'
                  }`}
                >
                  {sunaLiveCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectVillage('all', 'live')}
              title="Her iki köyün canlı POV yayınlarını aç"
              className={`hidden sm:flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-semibold transition-colors ${
                activeVillage === 'all'
                  ? 'bg-orange-500 text-white font-bold'
                  : 'text-slate-300 hover:text-orange-400 hover:bg-ninja-800'
              }`}
            >
              <AllVillagesEmblem className="w-3.5 h-3.5 shrink-0" />
              <span>Tümü</span>
              {totalLiveCount > 0 && (
                <span
                  className={`font-mono text-[10px] px-1 rounded ${
                    activeVillage === 'all'
                      ? 'bg-black/25 text-white'
                      : 'bg-orange-500/15 text-orange-400'
                  }`}
                >
                  {totalLiveCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsPresetMenuOpen(prev => !prev)}
              aria-expanded={isPresetMenuOpen}
              aria-label="Tüm köy listesi seçenekleri"
              title="Çevrimdışı kanallar dahil tüm köy listesini yükle"
              className="h-7 px-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-ninja-800 transition-colors"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isPresetMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {isPresetMenuOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-60 bg-ninja-900 border border-ninja-700 rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-ninja-700/60 mb-1">
                Çevrimdışı Dahil Tümünü Yükle
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectVillage('konoha', 'all');
                  setIsPresetMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-ninja-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <KonohaEmblem className="w-3.5 h-3.5 text-emerald-400" />
                  Konoha (Tümü)
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {siteConfig.villages.konoha.streams.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectVillage('suna', 'all');
                  setIsPresetMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-ninja-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <SunaEmblem className="w-3.5 h-3.5 text-amber-400" />
                  Suna (Tümü)
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {siteConfig.villages.suna.streams.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectVillage('all', 'all');
                  setIsPresetMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-ninja-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <AllVillagesEmblem className="w-3.5 h-3.5 text-orange-400" />
                  Tüm Köyler (Tümü)
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {allConfigStreams.length}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Unified Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Unified 3-way Layout Switcher */}
          <div className="hidden lg:flex items-center bg-ninja-950 p-0.5 rounded-lg border border-ninja-700/80">
            <button
              type="button"
              onClick={() => onChangeLayout('auto')}
              title="Otomatik Izgara"
              aria-label="Otomatik Izgara düzeni"
              className={`flex items-center gap-1.5 h-7 px-2 rounded-md text-[11px] transition-colors ${
                layoutMode === 'auto'
                  ? 'bg-ninja-800 text-orange-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline">Izgara</span>
            </button>
            <button
              type="button"
              disabled={is2x2Disabled}
              onClick={() => onChangeLayout('2x2')}
              title={is2x2Disabled ? "4'ten fazla yayın açıkken 2x2 kullanılamaz" : '2x2 Izgara'}
              aria-label="2x2 Izgara düzeni"
              className={`flex items-center h-7 px-2 rounded-md font-mono text-[11px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                layoutMode === '2x2'
                  ? 'bg-ninja-800 text-orange-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2x2
            </button>
            <button
              type="button"
              onClick={() => onChangeLayout('theatre')}
              title="Tiyatro / Odak Modu"
              aria-label="Tiyatro düzeni"
              className={`flex items-center gap-1.5 h-7 px-2 rounded-md text-[11px] transition-colors ${
                layoutMode === 'theatre'
                  ? 'bg-ninja-800 text-orange-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline">Tiyatro</span>
            </button>
          </div>

          {/* Global Mute / Unmute */}
          {streamCount > 0 && (
            <button
              type="button"
              onClick={isAllMuted ? onUnmuteAll : onMuteAll}
              title={isAllMuted ? 'Tüm yayınların sesini aç (M)' : 'Tüm yayınları sustur (M)'}
              aria-label={isAllMuted ? 'Tüm yayınların sesini aç' : 'Tüm yayınları sustur'}
              className={`hidden md:inline-flex items-center justify-center h-8 w-8 rounded-lg border transition-colors ${
                isAllMuted
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
                  : 'bg-ninja-950 border-ninja-700/80 text-emerald-400 hover:text-rose-400 hover:border-rose-500/40'
              }`}
            >
              {isAllMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}

          {/* Clear All */}
          {streamCount > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              title="Tüm yayınları ekrandan kaldır"
              aria-label="Tüm yayınları ekrandan kaldır"
              className="hidden md:inline-flex items-center justify-center h-8 w-8 rounded-lg bg-ninja-950 border border-ninja-700/80 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Roster Drawer Toggle */}
          <button
            type="button"
            onClick={onToggleRoster}
            aria-expanded={isRosterOpen}
            title="Yayıncı kadrosunu aç / kapat"
            className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold border transition-colors ${
              isRosterOpen
                ? 'bg-orange-600 text-white border-orange-500'
                : 'bg-orange-600/90 hover:bg-orange-500 text-white border-orange-500/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kadro</span>
            {streamCount > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/25">
                {streamCount}
              </span>
            )}
          </button>

          {/* Chat Drawer Toggle */}
          <button
            type="button"
            onClick={onToggleChat}
            aria-expanded={isChatOpen}
            title={isChatOpen ? 'Sohbeti gizle (C)' : 'Sohbeti göster (C)'}
            aria-label={isChatOpen ? 'Sohbeti gizle' : 'Sohbeti göster'}
            className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold border transition-colors ${
              isChatOpen
                ? 'bg-ninja-800 text-purple-300 border-purple-500/50'
                : 'bg-ninja-950 text-slate-300 border-ninja-700/80 hover:text-white hover:bg-ninja-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Sohbet</span>
          </button>

          {/* Share URL */}
          <button
            type="button"
            onClick={onShareLink}
            title="Yayın düzeni URL bağlantısını kopyala"
            aria-label="Yayın düzeni URL bağlantısını kopyala"
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold bg-ninja-950 hover:bg-ninja-800 text-slate-300 border border-ninja-700/80 hover:text-white transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden lg:inline">Paylaş</span>
          </button>

          {/* Overflow Menu (Mobile controls + Community & Creator info) */}
          <div ref={moreMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsMoreOpen(prev => !prev)}
              aria-expanded={isMoreOpen}
              aria-label="Diğer seçenekler ve kısayollar"
              title="Diğer seçenekler ve kısayollar"
              className={`flex items-center justify-center h-8 w-8 rounded-lg border transition-colors ${
                isMoreOpen
                  ? 'bg-ninja-800 border-ninja-600 text-white'
                  : 'bg-ninja-950 border-ninja-700/80 text-slate-400 hover:text-white hover:bg-ninja-800'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isMoreOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-ninja-900 border border-ninja-700 rounded-xl shadow-2xl p-2 z-50 animate-fade-in space-y-2">
                {/* Layout controls on smaller viewports */}
                <div className="lg:hidden pb-2 border-b border-ninja-700/70">
                  <div className="px-2 pb-1.5 text-[11px] font-semibold text-slate-400">
                    Ekran Düzeni
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['auto', '2x2', 'theatre'] as LayoutMode[]).map(mode => {
                      const modeDisabled = mode === '2x2' && is2x2Disabled;
                      return (
                        <button
                          key={mode}
                          type="button"
                          disabled={modeDisabled}
                          title={modeDisabled ? "4'ten fazla yayın açıkken 2x2 kullanılamaz" : undefined}
                          onClick={() => {
                            onChangeLayout(mode);
                            setIsMoreOpen(false);
                          }}
                          className={`py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            layoutMode === mode
                              ? 'bg-orange-600 text-white'
                              : 'bg-ninja-950 text-slate-300 hover:bg-ninja-800'
                          }`}
                        >
                          {mode === 'auto' ? 'Otomatik' : mode === '2x2' ? '2x2' : 'Tiyatro'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Audio / Clear / Share on smaller viewports */}
                <div className="md:hidden space-y-1 pb-2 border-b border-ninja-700/70">
                  {streamCount > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          isAllMuted ? onUnmuteAll() : onMuteAll();
                          setIsMoreOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-ninja-800"
                      >
                        {isAllMuted ? (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Tüm Sesleri Aç</span>
                          </>
                        ) : (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                            <span>Tümünü Sustur</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClearAll();
                          setIsMoreOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Tümünü Temizle</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onShareLink();
                      setIsMoreOpen(false);
                    }}
                    className="sm:hidden w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-ninja-800"
                  >
                    <Share2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>URL Paylaş</span>
                  </button>
                </div>

                {/* Community Discord */}
                <a
                  href={siteConfig.discordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#7289da] border border-[#5865F2]/30 text-xs font-semibold transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <DiscordIcon className="w-4 h-4" />
                    <span>Artline Discord</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                {/* Keyboard Shortcuts */}
                <div className="p-2 rounded-lg bg-ninja-950 border border-ninja-700/70 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Klavye Kısayolları
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-300">
                    <div className="flex items-center justify-between gap-1">
                      <span>Kadro</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-ninja-800 border border-ninja-700 text-[10px] text-slate-200">R</kbd>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span>Sohbet</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-ninja-800 border border-ninja-700 text-[10px] text-slate-200">C</kbd>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span>Sessiz</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-ninja-800 border border-ninja-700 text-[10px] text-slate-200">M</kbd>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span>Odak</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-ninja-800 border border-ninja-700 text-[10px] text-slate-200">1-9</kbd>
                    </div>
                  </div>
                </div>

                {/* Streamer request & Creator credit */}
                <div className="p-2.5 rounded-lg bg-ninja-950 border border-ninja-700/70 space-y-2">
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    {siteConfig.requestStreamerNotice}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img
                        src={siteConfig.creatorLogo}
                        alt={siteConfig.creatorName}
                        className="w-4 h-4 rounded object-contain shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="text-[11px] font-mono text-orange-400 truncate">
                        {siteConfig.creatorDiscord}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyDiscord}
                      className="shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-ninja-800 hover:bg-ninja-700 text-[11px] text-slate-200 transition-colors"
                    >
                      {copiedDiscord ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Kopyalandı</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Kopyala</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
