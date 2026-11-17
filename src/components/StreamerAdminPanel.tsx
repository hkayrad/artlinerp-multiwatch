import React, { useMemo, useState } from 'react';
import { Check, Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { Platform, StreamItem } from '../config/siteConfig';
import {
  createStreamer,
  deleteStreamer,
  parseStreamerChannelInput,
  StreamerVillage,
  updateStreamer,
} from '../services/streamerService';
import { ToastMessage } from './Toast';
import { VillageEmblem } from './VillageEmblems';

interface StreamerAdminPanelProps {
  rosterStreams: StreamItem[];
  onStreamersChange: (streams: StreamItem[]) => void;
  onNotify: (toast: ToastMessage) => void;
}

const VILLAGE_OPTIONS: { value: StreamerVillage; label: string }[] = [
  { value: 'konoha', label: 'Konohagakure' },
  { value: 'suna', label: 'Sunagakure' },
  { value: 'diger', label: 'Diğer' },
];

export const StreamerAdminPanel: React.FC<StreamerAdminPanelProps> = ({
  rosterStreams,
  onStreamersChange,
  onNotify,
}) => {
  const [name, setName] = useState('');
  const [channelInput, setChannelInput] = useState('');
  const [platform, setPlatform] = useState<Platform>('kick');
  const [village, setVillage] = useState<StreamerVillage>('konoha');
  const [roleTag, setRoleTag] = useState('');
  const [isDefaultActive, setIsDefaultActive] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<StreamItem | null>(null);

  const [villageFilter, setVillageFilter] = useState<'all' | StreamerVillage>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const notify = (type: ToastMessage['type'], message: string) => {
    onNotify({ id: `streamer-admin-${Date.now()}`, type, message });
  };

  const filteredStreams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rosterStreams.filter(s => {
      if (villageFilter !== 'all' && s.village !== villageFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.channel.toLowerCase().includes(q) ||
        (s.roleTag ?? '').toLowerCase().includes(q)
      );
    });
  }, [rosterStreams, villageFilter, searchQuery]);

  const handleChannelChange = (val: string) => {
    setChannelInput(val);
    if (val.includes('twitch.tv/')) {
      setPlatform('twitch');
    } else if (val.includes('kick.com/')) {
      setPlatform('kick');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseStreamerChannelInput(channelInput, platform);
    if (!name.trim() || !parsed.channel) {
      notify('error', 'Lütfen karakter adı ve geçerli bir kanal adı girin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createStreamer({
        name: name.trim(),
        channel: parsed.channel,
        platform: parsed.platform,
        village,
        roleTag: roleTag.trim() || undefined,
        isDefaultActive,
      });
      onStreamersChange(res.streams);
      setName('');
      setChannelInput('');
      setRoleTag('');
      setIsDefaultActive(false);
      notify('success', `"${res.item?.name ?? name.trim()}" kadroya eklendi.`);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Yayıncı eklenemedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const parsed = parseStreamerChannelInput(editing.channel, editing.platform);
    if (!editing.name.trim() || !parsed.channel) {
      notify('error', 'Karakter adı ve kanal adı boş bırakılamaz.');
      return;
    }

    setBusyId(editing.id);
    try {
      const res = await updateStreamer(editing.id, {
        name: editing.name.trim(),
        channel: parsed.channel,
        platform: parsed.platform,
        village: editing.village,
        roleTag: editing.roleTag?.trim() ?? '',
        isDefaultActive: Boolean(editing.isDefaultActive),
      });
      onStreamersChange(res.streams);
      setEditing(null);
      notify('success', `"${res.item?.name ?? editing.name}" güncellendi.`);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Yayıncı güncellenemedi.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: StreamItem) => {
    setBusyId(item.id);
    try {
      const res = await deleteStreamer(item.id);
      onStreamersChange(res.streams);
      setConfirmDeleteId(null);
      notify('info', `"${item.name}" kadrodan kaldırıldı.`);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Yayıncı silinemedi.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Streamer Form */}
      <form
        onSubmit={handleAdd}
        className="p-3.5 rounded-xl bg-ninja-950/80 border border-ninja-700/80 space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-100">
              Yeni Yayıncı Ekle
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Derleme gerekmeden anında kadroya eklenir
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          <input
            type="text"
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Karakter / İsim (örn: Akio Akasaki)"
            aria-label="Karakter veya görünen ad"
            className="lg:col-span-2 h-9 px-3 rounded-lg bg-ninja-900 border border-ninja-700 text-xs text-slate-100 placeholder:text-slate-500"
          />

          <input
            type="text"
            required
            maxLength={120}
            value={channelInput}
            onChange={(e) => handleChannelChange(e.target.value)}
            placeholder="Kanal adı veya link (örn: zade)"
            aria-label="Kanal adı veya yayın linki"
            className="lg:col-span-1 h-9 px-3 rounded-lg bg-ninja-900 border border-ninja-700 text-xs text-slate-100 placeholder:text-slate-500 font-mono"
          />

          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
            aria-label="Platform"
            className="h-9 px-2.5 rounded-lg bg-ninja-900 border border-ninja-700 text-xs text-slate-100"
          >
            <option value="kick">Kick</option>
            <option value="twitch">Twitch</option>
          </select>

          <select
            value={village}
            onChange={(e) => setVillage(e.target.value as StreamerVillage)}
            aria-label="Köy"
            className="h-9 px-2.5 rounded-lg bg-ninja-900 border border-ninja-700 text-xs text-slate-100"
          >
            {VILLAGE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            maxLength={40}
            value={roleTag}
            onChange={(e) => setRoleTag(e.target.value)}
            placeholder="Rol (örn: Jonin)"
            aria-label="Rol etiketi"
            className="h-9 px-3 rounded-lg bg-ninja-900 border border-ninja-700 text-xs text-slate-100 placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isDefaultActive}
              onChange={(e) => setIsDefaultActive(e.target.checked)}
              className="rounded border-ninja-600 bg-ninja-900 text-orange-500 focus:ring-orange-500"
            />
            <span>Sayfa açılışında varsayılan olarak açık gelsin</span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-9 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Ekleniyor...' : 'Yayıncı Ekle'}</span>
          </button>
        </div>
      </form>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'konoha', 'suna', 'diger'] as const).map(v => {
            const count =
              v === 'all'
                ? rosterStreams.length
                : rosterStreams.filter(s => s.village === v).length;
            const label =
              v === 'all'
                ? 'Tümü'
                : v === 'konoha'
                ? 'Konoha'
                : v === 'suna'
                ? 'Suna'
                : 'Diğer';
            return (
              <button
                key={v}
                type="button"
                onClick={() => setVillageFilter(v)}
                className={`h-8 px-2.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  villageFilter === v
                    ? 'bg-orange-500 text-white border-orange-400'
                    : 'bg-ninja-950 border-ninja-700 text-slate-300 hover:bg-ninja-800'
                }`}
              >
                <span>{label}</span>
                <span className="font-mono text-[10px] opacity-80">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İsim, kanal veya rol ara..."
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-ninja-950 border border-ninja-700 text-xs text-slate-100 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Streamers List */}
      {filteredStreams.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-ninja-700 rounded-xl">
          Eşleşen yayıncı bulunamadı.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {filteredStreams.map(item => {
            const isKonoha = item.village === 'konoha';
            const isSuna = item.village === 'suna';
            const isConfirming = confirmDeleteId === item.id;
            const isBusy = busyId === item.id;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-ninja-950 border border-ninja-700/80"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      isKonoha
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : isSuna
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-ninja-800 border-ninja-700 text-slate-300'
                    }`}
                  >
                    <VillageEmblem
                      village={item.village === 'diger' ? 'all' : item.village}
                      className="w-4 h-4"
                    />
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-100 truncate">
                        {item.name}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          item.platform === 'kick' ? 'bg-kick' : 'bg-twitch'
                        }`}
                        title={item.platform}
                      />
                      {item.isDefaultActive && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-500/15 border border-orange-500/30 text-[9px] font-semibold text-orange-300">
                          Oto
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                      <span className="font-mono">@{item.channel}</span>
                      {item.roleTag && (
                        <>
                          <span>·</span>
                          <span className="truncate text-slate-300">{item.roleTag}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isConfirming ? (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDelete(item)}
                        className="h-7 px-2 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-40"
                      >
                        <Check className="w-3 h-3" />
                        <span>Sil</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setConfirmDeleteId(null)}
                        aria-label="Silmeyi iptal et"
                        className="h-7 w-7 rounded-md bg-ninja-800 hover:bg-ninja-700 text-slate-300 inline-flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setEditing({ ...item })}
                        title="Yayıncıyı düzenle"
                        aria-label={`${item.name} düzenle`}
                        className="h-7 w-7 rounded-lg bg-ninja-900 hover:bg-ninja-800 border border-ninja-700 text-slate-300 hover:text-white inline-flex items-center justify-center"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setConfirmDeleteId(item.id)}
                        title="Yayıncıyı sil"
                        aria-label={`${item.name} sil`}
                        className="h-7 w-7 rounded-lg bg-ninja-900 hover:bg-rose-500/20 border border-ninja-700 hover:border-rose-500/40 text-rose-300 inline-flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditing(null);
          }}
        >
          <div className="w-full max-w-md bg-ninja-900 border border-ninja-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ninja-700/80 bg-ninja-950/60">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-slate-100 naruto-title">
                  Yayıncı Bilgilerini Düzenle
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Kapat"
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-ninja-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Karakter / Görünen Ad
                </label>
                <input
                  type="text"
                  required
                  maxLength={60}
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-ninja-950 border border-ninja-700 text-xs text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Kanal Adı
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={editing.channel}
                    onChange={(e) => setEditing({ ...editing, channel: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-ninja-950 border border-ninja-700 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Platform
                  </label>
                  <select
                    value={editing.platform}
                    onChange={(e) =>
                      setEditing({ ...editing, platform: e.target.value as Platform })
                    }
                    className="w-full h-9 px-2.5 rounded-lg bg-ninja-950 border border-ninja-700 text-xs text-slate-100"
                  >
                    <option value="kick">Kick</option>
                    <option value="twitch">Twitch</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Köy
                  </label>
                  <select
                    value={editing.village}
                    onChange={(e) =>
                      setEditing({ ...editing, village: e.target.value as StreamerVillage })
                    }
                    className="w-full h-9 px-2.5 rounded-lg bg-ninja-950 border border-ninja-700 text-xs text-slate-100"
                  >
                    {VILLAGE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Rol Etiketi
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    value={editing.roleTag ?? ''}
                    onChange={(e) => setEditing({ ...editing, roleTag: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-ninja-950 border border-ninja-700 text-xs text-slate-100"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={Boolean(editing.isDefaultActive)}
                  onChange={(e) =>
                    setEditing({ ...editing, isDefaultActive: e.target.checked })
                  }
                  className="rounded border-ninja-600 bg-ninja-950 text-orange-500 focus:ring-orange-500"
                />
                <span>Sayfa açılışında varsayılan olarak açık gelsin</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="h-9 px-3.5 rounded-lg bg-ninja-950 border border-ninja-700 text-xs font-semibold text-slate-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={busyId === editing.id}
                  className="h-9 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold disabled:opacity-40"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
