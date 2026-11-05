import React, { useState } from 'react';
import { X, Search, Plus, Check, Trash2, Tv } from 'lucide-react';
import { Platform, StreamItem, siteConfig } from '../config/siteConfig';
import { parseChannelInput } from '../utils/streamUtils';

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
  const [activeTab, setActiveTab] = useState<'all' | 'konoha' | 'suna' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Özel kanal ekleme formu için state
  const [customInput, setCustomInput] = useState('');
  const [customPlatform, setCustomPlatform] = useState<Platform>('kick');
  const [customName, setCustomName] = useState('');
  const [customVillage, setCustomVillage] = useState<'konoha' | 'suna' | 'diger'>('konoha');
  const [customRole, setCustomRole] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

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

  // Özel kanal ekleme işlemi
  const handleAddCustomStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) {
      setCustomError('Lütfen bir yayıncı adı veya bağlantı girin.');
      return;
    }

    const parsed = parseChannelInput(customInput, customPlatform);
    if (!parsed.channel) {
      setCustomError('Geçersiz kanal adı veya bağlantı.');
      return;
    }

    const key = `${parsed.platform}:${parsed.channel.toLowerCase()}`;
    if (activeChannelsMap.has(key)) {
      setCustomError('Bu kanal zaten çoklu ekranda ekli.');
      return;
    }

    onAddStream({
      name: customName.trim() || parsed.channel,
      channel: parsed.channel,
      platform: parsed.platform,
      village: customVillage,
      roleTag: customRole.trim() || undefined,
    });

    setCustomInput('');
    setCustomName('');
    setCustomRole('');
    setCustomError(null);
  };

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
                İzlemek istediğiniz karakterleri listeden seçerek çoklu ekrana ekleyin veya çıkarın
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

            <button
              onClick={() => setActiveTab('custom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'custom'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-purple-400 hover:bg-ninja-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Özel Kanal</span>
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

        {/* Arama Çubuğu (Özel kanal sekmesinde değilse) */}
        {activeTab !== 'custom' && (
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
        )}

        {/* İçerik Alanı: Yayın Kartları Listesi */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {activeTab === 'custom' ? (
            /* Özel Kanal Ekleme Formu */
            <form onSubmit={handleAddCustomStream} className="space-y-4 max-w-lg mx-auto py-2">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300">
                Sunucu listesinde bulunmayan herhangi bir Twitch veya Kick yayıncısını ekleyin.
              </div>

              {customError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {customError}
                </div>
              )}

              {/* Platform Seçimi */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Platform
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomPlatform('kick')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      customPlatform === 'kick'
                        ? 'bg-kick text-black border-kick/60 shadow-lg shadow-kick/20 font-extrabold'
                        : 'bg-ninja-950 text-slate-400 border-ninja-800'
                    }`}
                  >
                    <span>🟢</span>
                    <span>Kick</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomPlatform('twitch')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      customPlatform === 'twitch'
                        ? 'bg-twitch text-white border-twitch/60 shadow-lg shadow-twitch/20'
                        : 'bg-ninja-950 text-slate-400 border-ninja-800'
                    }`}
                  >
                    <span>🟣</span>
                    <span>Twitch</span>
                  </button>
                </div>
              </div>

              {/* Kanal Adı */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kanal Adı veya Bağlantısı <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  value={customInput}
                  onChange={e => {
                    setCustomInput(e.target.value);
                    setCustomError(null);
                  }}
                  placeholder={customPlatform === 'kick' ? 'Örn: zade veya kick.com/zade' : 'Örn: elraenn veya twitch.tv/elraenn'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ninja-950 border border-ninja-700 focus:border-orange-500 text-slate-100 text-xs outline-none"
                  autoFocus
                />
              </div>

              {/* Karakter İsmi ve Köy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Karakter / POV İsmi (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="Örn: Hokage POV (Ahmet)"
                    className="w-full px-3.5 py-2 rounded-xl bg-ninja-950 border border-ninja-700 focus:border-orange-500 text-slate-100 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Köy Seçimi
                  </label>
                  <select
                    value={customVillage}
                    onChange={e => setCustomVillage(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-ninja-950 border border-ninja-700 text-slate-100 text-xs outline-none"
                  >
                    <option value="konoha">🍃 Konohagakure</option>
                    <option value="suna">⏳ Sunagakure</option>
                    <option value="diger">⚔️ Diğer</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/30 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yayını Ekle</span>
                </button>
              </div>
            </form>
          ) : filteredStreams.length === 0 ? (
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
