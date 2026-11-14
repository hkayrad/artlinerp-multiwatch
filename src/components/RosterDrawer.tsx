import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Plus,
  Check,
  Trash2,
  Users,
  Copy,
  Radio,
  RefreshCw,
  Headphones,
  Volume2,
  VolumeX,
  Expand,
  MonitorPlay,
} from 'lucide-react';
import { ALL_CONFIG_STREAMS, Platform, StreamItem, siteConfig } from '../config/siteConfig';
import { LiveStatusInfo } from '../services/streamStatus';
import { VillagePresetMode } from '../hooks/useMultiwatch';
import { parseChannelInput, sortStreamsLiveFirst } from '../utils/streamUtils';
import { KonohaEmblem, SunaEmblem, AllVillagesEmblem, VillageEmblem } from './VillageEmblems';

interface RosterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeStreams: StreamItem[];
  statuses: Record<string, LiveStatusInfo>;
  isStatusLoading: boolean;
  mutedStreams: Set<string>;
  soloStreamId: string | null;
  focusedStreamId: string | null;
  onRefreshStatuses: () => void;
  onAddStream: (stream: Omit<StreamItem, 'id'>) => void;
  onRemoveStream: (id: string) => void;
  onSelectVillage: (village: 'konoha' | 'suna' | 'all', mode?: VillagePresetMode) => void;
  onClearAll: () => void;
  onToggleMute: (id: string) => void;
  onSoloAudio: (id: string) => void;
  onFocusStream: (id: string, switchToTheatre?: boolean) => void;
}

export const RosterDrawer: React.FC<RosterDrawerProps> = ({
  isOpen,
  onClose,
  activeStreams,
  statuses,
  isStatusLoading,
  mutedStreams,
  soloStreamId,
  focusedStreamId,
  onRefreshStatuses,
  onAddStream,
  onRemoveStream,
  onSelectVillage,
  onClearAll,
  onToggleMute,
  onSoloAudio,
  onFocusStream,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'konoha' | 'suna'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'active'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomFormOpen, setIsCustomFormOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customPlatform, setCustomPlatform] = useState<Platform>('kick');
  const [copiedDiscord, setCopiedDiscord] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    // Focus search input cleanly on desktop open
    if (window.innerWidth >= 768) {
      window.setTimeout(() => searchInputRef.current?.focus(), 60);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeChannelsMap = new Map<string, string>();
  activeStreams.forEach(s => {
    activeChannelsMap.set(`${s.platform}:${s.channel.toLowerCase()}`, s.id);
  });

  const configChannelKeys = new Set(
    ALL_CONFIG_STREAMS.map(s => `${s.platform}:${s.channel.toLowerCase()}`)
  );
  const customActiveStreams = activeStreams.filter(
    s => !configChannelKeys.has(`${s.platform}:${s.channel.toLowerCase()}`)
  );
  const allRosterStreams = [...customActiveStreams, ...ALL_CONFIG_STREAMS];

  const handleAddCustomStream = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseChannelInput(customInput, customPlatform);
    if (!parsed.channel) return;

    onAddStream({
      name: parsed.channel,
      channel: parsed.channel,
      platform: parsed.platform,
      village: 'diger',
      roleTag: 'Özel Kanal',
    });
    setCustomInput('');
    setIsCustomFormOpen(false);
  };

  const filteredStreams = sortStreamsLiveFirst(
    allRosterStreams.filter(stream => {
      if (activeTab === 'konoha' && stream.village !== 'konoha') return false;
      if (activeTab === 'suna' && stream.village !== 'suna') return false;

      const streamKey = `${stream.platform}:${stream.channel.toLowerCase()}`;
      const isAdded = activeChannelsMap.has(streamKey);

      if (statusFilter === 'live' && !statuses[stream.id]?.isLive) return false;
      if (statusFilter === 'active' && !isAdded) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = stream.name.toLowerCase().includes(q);
        const matchChannel = stream.channel.toLowerCase().includes(q);
        const matchRole = stream.roleTag?.toLowerCase().includes(q);
        const matchTitle = statuses[stream.id]?.title?.toLowerCase().includes(q);
        return matchName || matchChannel || matchRole || matchTitle;
      }

      return true;
    }),
    statuses
  );

  const liveTotalCount = allRosterStreams.filter(s => statuses[s.id]?.isLive).length;
  const konohaCount = siteConfig.villages.konoha.streams.length;
  const sunaCount = siteConfig.villages.suna.streams.length;

  return (
    <aside
      aria-label="Yayıncı Kadrosu"
      className="fixed inset-0 z-40 md:relative md:inset-auto md:z-auto w-full md:w-[360px] lg:w-[400px] bg-ninja-900 border-r border-ninja-700/80 flex flex-col shrink-0 select-none animate-slide-in-left"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-ninja-700/80 bg-ninja-950/60 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-4 h-4 text-orange-400 shrink-0" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-100 truncate">Kadro</h2>
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-ninja-800 text-slate-300 border border-ninja-700 shrink-0">
            {activeStreams.length} açık
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRefreshStatuses}
            disabled={isStatusLoading}
            title="Canlı yayın durumlarını yenile"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-ninja-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isStatusLoading ? 'animate-spin' : ''}`} />
          </button>
          {activeStreams.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              title="Ekrandaki tüm yayınları temizle"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            title="Kadroyu kapat (Esc)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-ninja-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="px-3 py-2.5 border-b border-ninja-700/80 bg-ninja-950/40 space-y-2 shrink-0">
        {/* Search + Custom Channel Toggle */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="İsim, @kanal, rol veya başlık ara..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-ninja-950 border border-ninja-700/80 focus:border-orange-500 text-xs text-slate-100 placeholder-slate-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                title="Aramayı temizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !isCustomFormOpen;
              setIsCustomFormOpen(next);
              if (next) {
                setTimeout(() => customInputRef.current?.focus(), 0);
              }
            }}
            aria-expanded={isCustomFormOpen}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border shrink-0 transition-colors ${
              isCustomFormOpen
                ? 'bg-orange-600 text-white border-orange-500'
                : 'bg-ninja-950 hover:bg-ninja-800 text-slate-200 border-ninja-700/80'
            }`}
            title="Kadrodan bağımsız özel Kick veya Twitch kanalı ekle"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Özel</span>
          </button>
        </div>

        {isCustomFormOpen && (
          <form
            onSubmit={handleAddCustomStream}
            className="flex items-center gap-1.5 p-1.5 rounded-lg bg-ninja-950/90 border border-orange-500/40"
          >
            <button
              type="button"
              onClick={() =>
                setCustomPlatform(prev => (prev === 'kick' ? 'twitch' : 'kick'))
              }
              className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase shrink-0 transition-colors ${
                customPlatform === 'kick'
                  ? 'bg-kick text-black'
                  : 'bg-twitch text-white'
              }`}
              title="Varsayılan platformu değiştir (URL yazarsanız otomatik algılanır)"
            >
              {customPlatform}
            </button>
            <input
              ref={customInputRef}
              type="text"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              placeholder="kick.com/kanal veya @kullanici"
              className="flex-1 min-w-0 px-2 py-1 rounded bg-ninja-900 border border-ninja-700/80 focus:border-orange-500 text-xs text-slate-100 placeholder-slate-500 outline-none"
            />
            <button
              type="submit"
              disabled={!customInput.trim()}
              className="px-2.5 py-1 rounded text-[11px] font-bold bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:pointer-events-none text-white shrink-0 transition-colors"
            >
              Ekle
            </button>
          </form>
        )}

        {/* Village Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-ninja-950 p-1 rounded-lg border border-ninja-700/80">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-md text-[11px] font-semibold transition-colors ${
              activeTab === 'all'
                ? 'bg-orange-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-ninja-800'
            }`}
          >
            <AllVillagesEmblem className="w-3 h-3 shrink-0" />
            <span className="truncate">Tümü</span>
            <span className="text-[10px] opacity-80">{allRosterStreams.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('konoha')}
            className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-md text-[11px] font-semibold transition-colors ${
              activeTab === 'konoha'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-emerald-400 hover:bg-ninja-800'
            }`}
          >
            <KonohaEmblem className="w-3 h-3 shrink-0" />
            <span className="truncate">Konoha</span>
            <span className="text-[10px] opacity-80">{konohaCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('suna')}
            className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-md text-[11px] font-semibold transition-colors ${
              activeTab === 'suna'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-amber-400 hover:bg-ninja-800'
            }`}
          >
            <SunaEmblem className="w-3 h-3 shrink-0" />
            <span className="truncate">Suna</span>
            <span className="text-[10px] opacity-80">{sunaCount}</span>
          </button>
        </div>

        {/* Status Filter + Bulk Load Row */}
        <div className="flex items-center justify-between gap-1.5 text-[11px]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setStatusFilter(prev => (prev === 'live' ? 'all' : 'live'))}
              aria-pressed={statusFilter === 'live'}
              className={`flex items-center gap-1 px-2 py-1 rounded-md border font-semibold transition-colors ${
                statusFilter === 'live'
                  ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                  : 'bg-ninja-950 border-ninja-700/80 text-slate-400 hover:text-slate-200 hover:bg-ninja-800'
              }`}
              title="Yalnızca canlı yayındakileri göster"
            >
              <Radio className={`w-3 h-3 ${statusFilter === 'live' ? 'text-rose-400' : ''}`} />
              <span>Canlı ({liveTotalCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter(prev => (prev === 'active' ? 'all' : 'active'))}
              aria-pressed={statusFilter === 'active'}
              className={`flex items-center gap-1 px-2 py-1 rounded-md border font-semibold transition-colors ${
                statusFilter === 'active'
                  ? 'bg-orange-500/15 border-orange-500/50 text-orange-300'
                  : 'bg-ninja-950 border-ninja-700/80 text-slate-400 hover:text-slate-200 hover:bg-ninja-800'
              }`}
              title="Yalnızca ekranda açık olanları göster"
            >
              <MonitorPlay className="w-3 h-3" />
              <span>Açık ({activeStreams.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelectVillage(activeTab, 'live')}
              title="Seçili sekmedeki canlı yayınları aç"
              className="px-2 py-1 rounded-md bg-ninja-800 hover:bg-ninja-700 text-slate-200 border border-ninja-700 font-medium transition-colors"
            >
              Canlıları Aç
            </button>
            <button
              type="button"
              onClick={() => onSelectVillage(activeTab, 'all')}
              title="Çevrimdışı dahil tümünü aç"
              className="px-2 py-1 rounded-md bg-ninja-950 hover:bg-ninja-800 text-slate-400 hover:text-slate-200 border border-ninja-700/80 font-medium transition-colors"
            >
              Tümü
            </button>
          </div>
        </div>
      </div>

      {/* Stream List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {filteredStreams.length === 0 ? (
          <div className="py-10 px-4 text-center space-y-2">
            <p className="text-xs text-slate-400">
              {statusFilter === 'live'
                ? 'Bu sekmede şu anda canlı yayın yok.'
                : statusFilter === 'active'
                ? 'Bu sekmede ekranda açık yayın yok.'
                : 'Aramanızla eşleşen yayıncı bulunamadı.'}
            </p>
            {(statusFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="px-3 py-1 rounded-md bg-ninja-800 hover:bg-ninja-700 text-[11px] text-slate-200 border border-ninja-700 transition-colors"
              >
                Filtreleri Sıfırla
              </button>
            )}
          </div>
        ) : (
          filteredStreams.map(stream => {
            const streamKey = `${stream.platform}:${stream.channel.toLowerCase()}`;
            const activeId = activeChannelsMap.get(streamKey);
            const isAdded = Boolean(activeId);
            const status = statuses[stream.id];
            const isLive = Boolean(status?.isLive);
            const isKonoha = stream.village === 'konoha';
            const isMuted = activeId ? mutedStreams.has(activeId) : true;
            const isSolo = activeId ? soloStreamId === activeId : false;
            const isFocused = activeId ? focusedStreamId === activeId : false;

            const handleToggleRow = () => {
              if (isAdded && activeId) {
                onRemoveStream(activeId);
              } else {
                onAddStream({
                  name: stream.name,
                  channel: stream.channel,
                  platform: stream.platform,
                  village: stream.village,
                  roleTag: stream.roleTag,
                });
              }
            };

            return (
              <div
                key={stream.id}
                onClick={handleToggleRow}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggleRow();
                  }
                }}
                className={`group px-2.5 py-2 rounded-lg border transition-colors cursor-pointer ${
                  isAdded
                    ? 'bg-ninja-800/80 border-orange-500/50 hover:border-orange-400'
                    : isLive
                    ? 'bg-ninja-950/80 border-ninja-700/80 hover:border-ninja-500 hover:bg-ninja-800/50'
                    : 'bg-ninja-950/40 border-ninja-700/40 opacity-75 hover:opacity-100 hover:border-ninja-600 hover:bg-ninja-950'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        isKonoha
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}
                    >
                      <VillageEmblem village={stream.village} className="w-4 h-4" />
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-100 truncate">
                          {stream.name}
                        </span>
                        {isLive && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            CANLI
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 min-w-0">
                        <span
                          className={`px-1 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                            stream.platform === 'kick'
                              ? 'bg-kick text-black'
                              : 'bg-twitch text-white'
                          }`}
                        >
                          {stream.platform}
                        </span>
                        <span className="truncate">@{stream.channel}</span>
                        {isLive && typeof status?.viewers === 'number' && (
                          <span className="text-[10px] text-slate-300 shrink-0">
                            • {status.viewers.toLocaleString('tr-TR')}
                          </span>
                        )}
                        {!isLive && stream.roleTag && (
                          <span className="text-[10px] text-slate-500 truncate">
                            • {stream.roleTag}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Action Pill */}
                  <div className="shrink-0" onClick={e => e.stopPropagation()}>
                    {isAdded && activeId ? (
                      <button
                        type="button"
                        onClick={() => onRemoveStream(activeId)}
                        className="group/btn flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/15 hover:bg-rose-500/15 text-emerald-400 hover:text-rose-400 border border-emerald-500/30 hover:border-rose-500/30 transition-colors"
                        title="Yayından kaldır"
                      >
                        <Check className="w-3.5 h-3.5 group-hover/btn:hidden" />
                        <X className="w-3.5 h-3.5 hidden group-hover/btn:inline" />
                        <span className="group-hover/btn:hidden">Açık</span>
                        <span className="hidden group-hover/btn:inline">Kaldır</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleToggleRow}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-colors"
                        title="Yayına ekle"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ekle</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Stream Title Preview */}
                {isLive && status?.title && (
                  <p className="mt-1.5 pl-10 text-[11px] text-slate-400 truncate">
                    {status.title}
                  </p>
                )}

                {/* Quick Controls for Active Streams */}
                {isAdded && activeId && (
                  <div
                    onClick={e => e.stopPropagation()}
                    className="mt-2 pt-1.5 pl-10 border-t border-ninja-700/60 flex items-center gap-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => onSoloAudio(activeId)}
                      title={isSolo ? 'Tek Ses Aktif' : 'Sesi yalnızca buraya ver'}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                        isSolo
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-ninja-900 hover:bg-ninja-700 text-slate-300 border-ninja-700'
                      }`}
                    >
                      <Headphones className="w-3 h-3" />
                      <span>{isSolo ? 'Tek Ses' : 'Solo'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleMute(activeId)}
                      title={isMuted ? 'Sesi aç' : 'Sesi kapat'}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                        isMuted
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
                          : 'bg-ninja-900 hover:bg-ninja-700 text-emerald-400 border-ninja-700'
                      }`}
                    >
                      {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      <span>{isMuted ? 'Sessiz' : 'Sesli'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onFocusStream(activeId, true)}
                      title="Tiyatro modunda ana ekrana al"
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                        isFocused
                          ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                          : 'bg-ninja-900 hover:bg-ninja-700 text-slate-300 border-ninja-700'
                      }`}
                    >
                      <Expand className="w-3 h-3" />
                      <span>Odak</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Compact Footer */}
      <div
        className="px-3 py-2 border-t border-ninja-700/80 bg-ninja-950/80 flex items-center justify-between gap-2 shrink-0"
        title={siteConfig.requestStreamerNotice}
      >
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={siteConfig.creatorLogo}
            alt={siteConfig.creatorName}
            className="w-4 h-4 rounded object-contain shrink-0"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="text-[11px] text-slate-400 truncate">
            Yayıncı önerisi:
          </span>
          <span className="text-[11px] font-semibold text-orange-400 truncate">
            {siteConfig.creatorDiscord}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(siteConfig.creatorDiscord);
            setCopiedDiscord(true);
            window.setTimeout(() => setCopiedDiscord(false), 2000);
          }}
          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-ninja-800 hover:bg-ninja-700 border border-ninja-700 text-[10px] font-medium text-slate-200 transition-colors"
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
    </aside>
  );
};
