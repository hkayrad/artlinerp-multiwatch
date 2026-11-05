import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Check, Trash2, Tv, Copy } from 'lucide-react';
import { StreamItem, siteConfig } from '../config/siteConfig';
import { useLiveStatus } from '../hooks/useLiveStatus';

interface StreamSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStreams: StreamItem[];
  onAddStream: (stream: Omit<StreamItem, 'id'>) => void;
  onRemoveStream: (id: string) => void;
  onSelectVillage: (village: 'konoha' | 'suna' | 'all') => void;
  onClearAll: () => void;
}

export const StreamSelectorModal: React.FC<StreamSelectorModalProps> = ({
  isOpen,
  onClose,
  activeStreams,
  onAddStream,
  onRemoveStream,
  onSelectVillage,
  onClearAll,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'konoha' | 'suna'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedDiscord, setCopiedDiscord] = useState(false);
  const { statuses } = useLiveStatus();

  // Escape tuşu ile modalı kapatma
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Aktif kanal adları kümesi (küçük harfle)
  const activeChannelsMap = new Map<string, string>();
  activeStreams.forEach(s => {
    activeChannelsMap.set(`${s.platform}:${s.channel.toLowerCase()}`, s.id);
  });

  // Konfigürasyonda tanımlı tüm sunucu yayınları
  const allConfigStreams: StreamItem[] = [
    ...siteConfig.villages.konoha.streams,
    ...siteConfig.villages.suna.streams,
  ];

  // Filtrelenmiş yayınlar
  const filteredStreams = allConfigStreams.filter(stream => {
    // Köy filtresi
    if (activeTab === 'konoha' && stream.village !== 'konoha') return false;
    if (activeTab === 'suna' && stream.village !== 'suna') return false;

    // Arama sorgusu
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = stream.name.toLowerCase().includes(q);
      const matchChannel = stream.channel.toLowerCase().includes(q);
      const matchRole = stream.roleTag?.toLowerCase().includes(q);
      return matchName || matchChannel || matchRole;
    }

    return true;
  });

  const konohaCount = siteConfig.villages.konoha.streams.length;
  const sunaCount = siteConfig.villages.suna.streams.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-ninja-900 border border-ninja-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Başlık */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-ninja-800 bg-ninja-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-100 naruto-title">
                  Yayın Listesi & POV Seçimi
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-semibold">
                  {activeStreams.length} İzleniyor
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                İzlemek istediğiniz sunucu karakterlerini seçerek çoklu ekrana ekleyin veya çıkarın
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-ninja-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab ve Filtre Menüsü */}
        <div className="bg-ninja-950 border-b border-ninja-800 px-4 pt-3 flex flex-wrap items-center justify-between gap-2">
          {/* Köy Sekmeleri */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-ninja-900'
              }`}
            >
              <span>⚔️ Tümü</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30">
                {allConfigStreams.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('konoha')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'konoha'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-emerald-400 hover:bg-ninja-900'
              }`}
            >
              <span>🍃 Konoha</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                {konohaCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('suna')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'suna'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-ninja-900'
              }`}
            >
              <span>⏳ Suna</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                {sunaCount}
              </span>
            </button>
          </div>

          {/* Toplu İşlem Kısayolları */}
          <div className="flex items-center gap-1.5 pb-2 sm:pb-0">
            <button
              onClick={() => onSelectVillage('konoha')}
              className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
            >
              + Konoha Yükle
            </button>
            <button
              onClick={() => onSelectVillage('suna')}
              className="text-[11px] px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
            >
              + Suna Yükle
            </button>
            {activeStreams.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[11px] px-2 py-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1"
                title="Tümünü Kaldır"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">Temizle</span>
              </button>
            )}
          </div>
        </div>

        {/* Arama Çubuğu */}
        <div className="p-3 bg-ninja-950/50 border-b border-ninja-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Yayıncı adı, karakter veya rol ara... (örn: Akio, Kinma, zade, Chunin)"
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-ninja-900 border border-ninja-700/80 focus:border-orange-500 text-xs text-slate-100 placeholder-slate-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
              >
                Temizle
              </button>
            )}
          </div>
        </div>

        {/* İçerik Alanı: Yayın Kartları Listesi */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredStreams.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Aramanızla eşleşen yayıncı bulunamadı.
            </div>
          ) : (
            filteredStreams.map(stream => {
              const streamKey = `${stream.platform}:${stream.channel.toLowerCase()}`;
              const activeId = activeChannelsMap.get(streamKey);
              const isAdded = Boolean(activeId);

              const isKick = stream.platform === 'kick';
              const isKonoha = stream.village === 'konoha';

              return (
                <div
                  key={stream.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isAdded
                      ? 'bg-ninja-950 border-orange-500/50 shadow-md ring-1 ring-orange-500/20'
                      : 'bg-ninja-950/60 border-ninja-800 hover:border-ninja-700 hover:bg-ninja-950'
                  }`}
                >
                  {/* Sol Taraf: Köy Simgesi, İsim, Kanal ve Rol */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border ${
                        isKonoha
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}
                    >
                      {isKonoha ? '🍃' : '⏳'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-100 truncate">
                          {stream.name}
                        </span>

                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                            isKick
                              ? 'bg-kick text-black'
                              : 'bg-twitch text-white'
                          }`}
                        >
                          {stream.platform}
                        </span>

                        {statuses[stream.id]?.isLive && (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                            CANLI
                          </span>
                        )}

                        {stream.roleTag && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-ninja-800 text-slate-300 border border-ninja-700 font-medium">
                            {stream.roleTag}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono">@{stream.channel}</span>
                        <span>•</span>
                        <span>{isKonoha ? 'Konohagakure' : 'Sunagakure'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sağ Taraf: Ekle / Kaldır Butonu */}
                  <div className="shrink-0">
                    {isAdded ? (
                      <button
                        onClick={() => activeId && onRemoveStream(activeId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-rose-500/20 text-emerald-400 hover:text-rose-400 border border-emerald-500/40 hover:border-rose-500/40 transition-colors group"
                        title="Yayından Kaldır"
                      >
                        <Check className="w-3.5 h-3.5 group-hover:hidden" />
                        <X className="w-3.5 h-3.5 hidden group-hover:inline" />
                        <span className="group-hover:hidden">İzleniyor</span>
                        <span className="hidden group-hover:inline">Kaldır</span>
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          onAddStream({
                            name: stream.name,
                            channel: stream.channel,
                            platform: stream.platform,
                            village: stream.village,
                            roleTag: stream.roleTag,
                          })
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20 transition-all active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Yayına Ekle</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Yayıncı Ekleme İstek & Discord İletişim */}
        <div className="px-4 py-2.5 bg-ninja-950 border-t border-ninja-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm shrink-0">💬</span>
            <p className="text-slate-300 text-[11px] sm:text-xs">
              {siteConfig.requestStreamerNotice}:{' '}
              <span className="font-mono font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/30">
                {siteConfig.creatorDiscord}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(siteConfig.creatorDiscord);
              setCopiedDiscord(true);
              setTimeout(() => setCopiedDiscord(false), 2000);
            }}
            className="shrink-0 px-2 py-1 rounded-md bg-ninja-900 hover:bg-ninja-800 text-[11px] font-medium text-slate-300 border border-ninja-700/80 transition-colors flex items-center gap-1 active:scale-95"
            title="Discord kullanıcı adını kopyala"
          >
            {copiedDiscord ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>Kopyala</span>
              </>
            )}
          </button>
        </div>

        {/* Modal Alt Bar */}
        <div className="p-3.5 border-t border-ninja-800 bg-ninja-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>
            {activeStreams.length} yayın şu anda ekranda açık
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-ninja-800 hover:bg-ninja-700 text-slate-200 border border-ninja-700 transition-colors"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
