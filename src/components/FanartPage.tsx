import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Image as ImageIcon,
  LogIn,
  LogOut,
  Pencil,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AdminSession, FanartItem, FanartUploadResult, FanartVillage } from '../types/fanart';
import {
  approveSubmission,
  deleteFanart,
  fetchGallery,
  fetchPendingSubmissions,
  filterFanartItems,
  getAdminSession,
  logoutAdmin,
  updateFanart,
} from '../services/fanartService';
import { FANART_VILLAGES, FANART_VILLAGE_META, formatFanartDate } from '../utils/fanartMeta';
import { ToastMessage } from './Toast';
import { VillageEmblem } from './VillageEmblems';
import { FanartUploadModal } from './FanartUploadModal';
import { FanartLightbox } from './FanartLightbox';
import { AdminAuthForm, AdminAuthModal } from './AdminAuthModal';

interface FanartPageProps {
  mode: 'fanart' | 'admin';
  onNavigate: (route: 'multiwatch' | 'fanart' | 'admin') => void;
  onNotify: (toast: ToastMessage) => void;
}

interface PendingCardProps {
  item: FanartItem;
  busyId: string | null;
  onApprove: (id: string, edits: { title: string; artist: string; village: FanartVillage }) => void;
  onReject: (id: string) => void;
}

const PendingSubmissionCard: React.FC<PendingCardProps> = ({
  item,
  busyId,
  onApprove,
  onReject,
}) => {
  const [title, setTitle] = useState(item.title);
  const [artist, setArtist] = useState(item.artist);
  const [village, setVillage] = useState<FanartVillage>(item.village);
  const isBusy = busyId === item.id;

  return (
    <div className="bg-ninja-950 border border-ninja-700/80 rounded-xl overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] bg-ninja-900 overflow-hidden">
        <img
          src={item.url}
          alt={item.title}
          className="w-full h-full object-contain"
          loading="lazy"
        />
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[10px] font-semibold text-amber-300">
          Onay Bekliyor
        </span>
      </div>

      <div className="p-3 space-y-2 flex-1 flex flex-col">
        <input
          type="text"
          value={title}
          maxLength={80}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Eser başlığı"
          className="w-full h-8 px-2.5 rounded-lg bg-ninja-900 border border-ninja-700 text-xs text-slate-100"
        />
        <div className="grid grid-cols-2 gap-1.5">
          <input
            type="text"
            value={artist}
            maxLength={50}
            onChange={(e) => setArtist(e.target.value)}
            aria-label="Sanatçı"
            className="h-8 px-2.5 rounded-lg bg-ninja-900 border border-ninja-700 text-xs text-slate-100"
          />
          <select
            value={village}
            onChange={(e) => setVillage(e.target.value as FanartVillage)}
            aria-label="Köy"
            className="h-8 px-2 rounded-lg bg-ninja-900 border border-ninja-700 text-xs text-slate-100"
          >
            {FANART_VILLAGES.map(v => (
              <option key={v} value={v}>
                {FANART_VILLAGE_META[v].label}
              </option>
            ))}
          </select>
        </div>

        {item.description && (
          <p className="text-[11px] text-slate-400 line-clamp-2">{item.description}</p>
        )}

        <div className="text-[10px] text-slate-500 font-mono">
          {formatFanartDate(item.createdAt)}
        </div>

        <div className="mt-auto pt-1 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            disabled={isBusy || !title.trim() || !artist.trim()}
            onClick={() => onApprove(item.id, { title: title.trim(), artist: artist.trim(), village })}
            className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors disabled:opacity-40"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Onayla</span>
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onReject(item.id)}
            className="h-8 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reddet</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const FanartPage: React.FC<FanartPageProps> = ({ mode, onNavigate, onNotify }) => {
  const [items, setItems] = useState<FanartItem[]>([]);
  const [pendingItems, setPendingItems] = useState<FanartItem[]>([]);
  const [session, setSession] = useState<AdminSession>({
    authenticated: false,
    configured: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedVillage, setSelectedVillage] = useState<FanartVillage | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showAdminDrawer, setShowAdminDrawer] = useState(mode === 'admin');
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<FanartItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const notify = useCallback(
    (type: ToastMessage['type'], message: string) => {
      onNotify({ id: `fanart-${Date.now()}`, type, message });
    },
    [onNotify]
  );

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [gallery, auth] = await Promise.all([fetchGallery('all'), getAdminSession()]);
      setItems(gallery);
      setSession(auth);
      if (auth.authenticated) {
        const pending = await fetchPendingSubmissions();
        setPendingItems(pending);
      } else {
        setPendingItems([]);
      }
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Fanart galerisi yüklenirken hata oluştu.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (mode === 'admin') {
      setShowAdminDrawer(true);
    }
  }, [mode]);

  const filteredItems = useMemo(
    () => filterFanartItems(items, selectedVillage, searchQuery),
    [items, selectedVillage, searchQuery]
  );

  const villageCounts = useMemo(() => {
    const counts: Record<FanartVillage | 'all', number> = {
      all: items.length,
      konoha: 0,
      suna: 0,
      genel: 0,
    };
    for (const item of items) {
      counts[item.village] = (counts[item.village] || 0) + 1;
    }
    return counts;
  }, [items]);

  const lightboxIndex = useMemo(
    () => (lightboxId ? filteredItems.findIndex(i => i.id === lightboxId) : -1),
    [filteredItems, lightboxId]
  );
  const lightboxItem = lightboxIndex >= 0 ? filteredItems[lightboxIndex] : null;

  const handleAuthSuccess = async (nextSession: AdminSession) => {
    setSession(nextSession);
    setShowAdminDrawer(true);
    notify('success', `Yönetici girişi başarılı (${nextSession.username || 'admin'}).`);
    try {
      const pending = await fetchPendingSubmissions();
      setPendingItems(pending);
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    try {
      const next = await logoutAdmin();
      setSession(next);
      setPendingItems([]);
      setShowAdminDrawer(false);
      if (mode === 'admin') onNavigate('fanart');
      notify('info', 'Yönetici oturumu kapatıldı.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Çıkış yapılamadı.');
    }
  };

  const handleUploaded = (result: FanartUploadResult) => {
    setIsUploadOpen(false);
    if (result.status === 'approved') {
      setItems(prev => [result.item, ...prev]);
      notify('success', `"${result.item.title}" doğrudan galeriye yayınlandı.`);
    } else {
      if (session.authenticated) {
        setPendingItems(prev => [result.item, ...prev]);
      }
      notify('success', 'Fanart gönderiniz alındı! Yönetici onayından sonra galeride görünecektir.');
    }
  };

  const handleApprove = async (
    id: string,
    edits: { title: string; artist: string; village: FanartVillage }
  ) => {
    setBusyId(id);
    try {
      const approved = await approveSubmission(id, edits);
      setPendingItems(prev => prev.filter(p => p.id !== id));
      setItems(prev => [approved, ...prev]);
      notify('success', `"${approved.title}" onaylandı ve galeriye eklendi.`);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Onaylama başarısız.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: FanartItem, scope: 'approved' | 'pending') => {
    setBusyId(item.id);
    try {
      await deleteFanart(item.id, scope);
      if (scope === 'pending') {
        setPendingItems(prev => prev.filter(p => p.id !== item.id));
        notify('info', 'Gönderim reddedildi ve silindi.');
      } else {
        setItems(prev => prev.filter(p => p.id !== item.id));
        if (lightboxId === item.id) setLightboxId(null);
        notify('info', `"${item.title}" galeriden kaldırıldı.`);
      }
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Silme işlemi başarısız.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setBusyId(editingItem.id);
    try {
      const updated = await updateFanart(editingItem.id, {
        title: editingItem.title,
        artist: editingItem.artist,
        village: editingItem.village,
        description: editingItem.description ?? '',
      });
      setItems(prev => prev.map(item => (item.id === updated.id ? updated : item)));
      setEditingItem(null);
      notify('success', `"${updated.title}" güncellendi.`);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Güncelleme başarısız.');
    } finally {
      setBusyId(null);
    }
  };

  // Dedicated /admin view when unauthenticated
  if (mode === 'admin' && !session.authenticated && !isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
        <div className="w-full max-w-md bg-ninja-900 border border-ninja-700 rounded-2xl shadow-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-400" />
              <h1 className="text-base font-bold text-slate-100 naruto-title">
                Fanart Yönetici Girişi
              </h1>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('fanart')}
              className="text-xs text-slate-400 hover:text-orange-400 transition-colors"
            >
              Galeriye Dön →
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Giriş yaptıktan sonra doğrudan galeriye fanart yükleyebilir ve ziyaretçi gönderimlerini onaylayabilirsiniz.
          </p>
          <AdminAuthForm configured={session.configured} onSuccess={handleAuthSuccess} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Action & Filter Bar */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-ninja-700/70">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-orange-400" />
              <h1 className="text-lg sm:text-xl font-bold text-slate-100 naruto-title">
                Artline Fanart Galerisi
              </h1>
              {session.authenticated && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-[11px] font-semibold text-emerald-300">
                  <Shield className="w-3 h-3" />
                  Admin: {session.username}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Topluluğun çizimleri ve RP sahne çalışmaları. Kendi eserini gönder veya galeriyi keşfet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={refreshAll}
              title="Galeriyi yenile"
              className="h-9 w-9 rounded-lg bg-ninja-900 hover:bg-ninja-800 border border-ninja-700 text-slate-300 hover:text-white inline-flex items-center justify-center transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="h-9 px-3.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-lg shadow-orange-600/20"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{session.authenticated ? 'Doğrudan Yükle' : 'Fanart Gönder'}</span>
            </button>

            {session.authenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowAdminDrawer(prev => !prev)}
                  className={`h-9 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                    showAdminDrawer
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-ninja-900 hover:bg-ninja-800 border-ninja-700 text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Onay Kuyruğu</span>
                  {pendingItems.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-mono text-[10px] font-bold">
                      {pendingItems.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Yönetici çıkış yap"
                  className="h-9 px-3 rounded-lg bg-ninja-900 hover:bg-rose-500/15 border border-ninja-700 hover:border-rose-500/40 text-xs font-semibold text-slate-300 hover:text-rose-300 inline-flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Çıkış</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="h-9 px-3 rounded-lg bg-ninja-900 hover:bg-ninja-800 border border-ninja-700 text-xs font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1.5 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-orange-400" />
                <span>Yönetici Girişi</span>
              </button>
            )}
          </div>
        </section>

        {/* Admin Moderation Queue */}
        {session.authenticated && showAdminDrawer && (
          <section className="p-4 rounded-2xl bg-ninja-900/90 border border-amber-500/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-slate-100 naruto-title">
                  Onay Bekleyen Gönderimler ({pendingItems.length})
                </h2>
              </div>
              <span className="text-[11px] text-slate-400">
                Onaylanan görseller <code className="text-slate-300">uploads/fanart/</code> klasörüne taşınır.
              </span>
            </div>

            {pendingItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-ninja-700 rounded-xl">
                Şu anda onay bekleyen fanart bulunmuyor.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {pendingItems.map(item => (
                  <PendingSubmissionCard
                    key={item.id}
                    item={item}
                    busyId={busyId}
                    onApprove={handleApprove}
                    onReject={() => handleDelete(item, 'pending')}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Filter Pills & Search */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedVillage('all')}
              className={`h-8 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                selectedVillage === 'all'
                  ? 'bg-orange-500 text-white border-orange-400 font-bold'
                  : 'bg-ninja-900 border-ninja-700 text-slate-300 hover:bg-ninja-800'
              }`}
            >
              <span>Tümü</span>
              <span className="font-mono text-[10px] opacity-80">{villageCounts.all}</span>
            </button>

            {FANART_VILLAGES.map(v => {
              const meta = FANART_VILLAGE_META[v];
              const active = selectedVillage === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSelectedVillage(v)}
                  className={`h-8 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                    active
                      ? meta.activeButtonClass
                      : 'bg-ninja-900 border-ninja-700 text-slate-300 hover:bg-ninja-800'
                  }`}
                >
                  <VillageEmblem village={v === 'genel' ? 'all' : v} className="w-3.5 h-3.5" />
                  <span>{meta.label}</span>
                  <span className="font-mono text-[10px] opacity-80">{villageCounts[v]}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Başlık veya çizer ara..."
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-ninja-900 border border-ninja-700 text-xs text-slate-100 placeholder:text-slate-500"
            />
          </div>
        </section>

        {/* Gallery Content */}
        {loadError ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2">
            <p className="text-sm font-semibold text-rose-300">{loadError}</p>
            <p className="text-xs text-slate-400">
              Yerel geliştirme için Docker Apache (<code className="text-slate-200">npm run preview:apache</code>) veya cPanel PHP sunucusunun çalıştığından emin olun.
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-xl bg-ninja-900 border border-ninja-800 animate-pulse"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 px-4 rounded-2xl bg-ninja-900/60 border border-dashed border-ninja-700 text-center space-y-3">
            <ImageIcon className="w-10 h-10 text-slate-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200">
                {items.length === 0 ? 'Henüz yayınlanmış fanart yok' : 'Aramayla eşleşen eser bulunamadı'}
              </h3>
              <p className="text-xs text-slate-400">
                {items.length === 0
                  ? 'İlk çalışmayı göndermek için yukarıdaki Fanart Gönder butonunu kullanın.'
                  : 'Farklı bir köy filtresi veya arama kelimesi deneyin.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => {
              const villageMeta = FANART_VILLAGE_META[item.village] ?? FANART_VILLAGE_META.genel;
              return (
                <article
                  key={item.id}
                  className="group bg-ninja-900 border border-ninja-700/80 hover:border-orange-500/50 rounded-xl overflow-hidden flex flex-col transition-colors"
                >
                  <div className="relative aspect-[4/3] bg-ninja-950 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setLightboxId(item.id)}
                      className="w-full h-full block focus:outline-none"
                      aria-label={`${item.title} eserini büyüt`}
                    >
                      <img
                        src={item.url}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </button>

                    <span
                      className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold backdrop-blur-sm ${villageMeta.badgeClass}`}
                    >
                      <VillageEmblem
                        village={item.village === 'genel' ? 'all' : item.village}
                        className="w-3 h-3"
                      />
                      {villageMeta.label}
                    </span>

                    {session.authenticated && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...item })}
                          title="Bilgileri düzenle"
                          className="h-7 w-7 rounded-lg bg-ninja-950/90 hover:bg-ninja-800 border border-ninja-700 text-slate-200 inline-flex items-center justify-center"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => handleDelete(item, 'approved')}
                          title="Eseri sil"
                          className="h-7 w-7 rounded-lg bg-ninja-950/90 hover:bg-rose-600 border border-ninja-700 hover:border-rose-500 text-rose-300 hover:text-white inline-flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-3 space-y-1 flex-1 flex flex-col">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-orange-400 font-semibold truncate">{item.artist}</span>
                      <span className="text-slate-500 font-mono shrink-0">
                        {formatFanartDate(item.approvedAt || item.createdAt)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 pt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <FanartUploadModal
        isOpen={isUploadOpen}
        isAdmin={session.authenticated}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={handleUploaded}
      />

      <AdminAuthModal
        isOpen={isAuthModalOpen}
        configured={session.configured}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <FanartLightbox
        item={lightboxItem}
        hasPrev={lightboxIndex > 0}
        hasNext={lightboxIndex >= 0 && lightboxIndex < filteredItems.length - 1}
        isAdmin={session.authenticated}
        onClose={() => setLightboxId(null)}
        onPrev={() => {
          if (lightboxIndex > 0) setLightboxId(filteredItems[lightboxIndex - 1].id);
        }}
        onNext={() => {
          if (lightboxIndex >= 0 && lightboxIndex < filteredItems.length - 1) {
            setLightboxId(filteredItems[lightboxIndex + 1].id);
          }
        }}
        onDelete={(item) => handleDelete(item, 'approved')}
      />

      {/* Quick Admin Edit Metadata Modal */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditingItem(null);
          }}
        >
          <div className="w-full max-w-md bg-ninja-900 border border-ninja-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ninja-700/80 bg-ninja-950/60">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-orange-400" />
                <h2 className="text-sm font-bold text-slate-100 naruto-title">
                  Eser Bilgilerini Düzenle
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                aria-label="Kapat"
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-ninja-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Başlık
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-ninja-950 border border-ninja-700 text-xs text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Çizer
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={editingItem.artist}
                    onChange={(e) => setEditingItem({ ...editingItem, artist: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-ninja-950 border border-ninja-700 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Köy
                  </label>
                  <select
                    value={editingItem.village}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, village: e.target.value as FanartVillage })
                    }
                    className="w-full h-9 px-2.5 rounded-lg bg-ninja-950 border border-ninja-700 text-xs text-slate-100"
                  >
                    {FANART_VILLAGES.map(v => (
                      <option key={v} value={v}>
                        {FANART_VILLAGE_META[v].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Açıklama
                </label>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={editingItem.description ?? ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg bg-ninja-950 border border-ninja-700 text-xs text-slate-100 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="h-9 px-3.5 rounded-lg bg-ninja-950 border border-ninja-700 text-xs font-semibold text-slate-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={busyId === editingItem.id}
                  className="h-9 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold"
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
