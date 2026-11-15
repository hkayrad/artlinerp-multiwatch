import React, { useEffect, useRef, useState } from 'react';
import { Upload, X, ShieldCheck, Clock, ImagePlus, AlertCircle } from 'lucide-react';
import { FanartUploadResult, FanartVillage } from '../types/fanart';
import { uploadFanart, validateFanartFile } from '../services/fanartService';
import { FANART_VILLAGES, FANART_VILLAGE_META } from '../utils/fanartMeta';
import { VillageEmblem } from './VillageEmblems';

interface FanartUploadModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onUploaded: (result: FanartUploadResult) => void;
}

export const FanartUploadModal: React.FC<FanartUploadModalProps> = ({
  isOpen,
  isAdmin,
  onClose,
  onUploaded,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [village, setVillage] = useState<FanartVillage>('konoha');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setArtist('');
    setVillage('konoha');
    setDescription('');
    setWebsite('');
    setError(null);
  };

  const handleSelectFile = (selected: File | null) => {
    if (!selected) return;
    const validationError = validateFanartFile(selected);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setFile(selected);
    if (!title.trim()) {
      const stem = selected.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
      if (stem) setTitle(stem.slice(0, 80));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Lütfen bir görsel dosyası seçin.');
      return;
    }
    if (!title.trim()) {
      setError('Lütfen eser başlığını girin.');
      return;
    }
    if (!artist.trim()) {
      setError('Lütfen çizer / sanatçı adını girin.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await uploadFanart({
        file,
        title,
        artist,
        village,
        description,
        website,
      });
      resetForm();
      onUploaded(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yükleme başarısız oldu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fanart-upload-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-ninja-900 border border-ninja-700 rounded-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-ninja-700/80 bg-ninja-950/60">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-orange-400" />
            <h2 id="fanart-upload-title" className="text-sm font-bold text-slate-100 naruto-title">
              {isAdmin ? 'Doğrudan Fanart Yükle' : 'Fanart Gönder'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Kapat"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-ninja-800 transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
              isAdmin
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            {isAdmin ? (
              <>
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Yönetici oturumu açık: Eser doğrudan galeriye yayınlanır.</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Gönderiniz yönetici onayından sonra galeride yayınlanır.</span>
              </>
            )}
          </div>

          {/* Drag & Drop / File Picker */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleSelectFile(e.dataTransfer.files?.[0] ?? null);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-orange-400 bg-orange-500/10'
                : 'border-ninja-700 hover:border-orange-500/60 bg-ninja-950/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleSelectFile(e.target.files?.[0] ?? null)}
            />
            {previewUrl ? (
              <div className="space-y-2">
                <img
                  src={previewUrl}
                  alt="Seçilen eser önizlemesi"
                  className="max-h-48 mx-auto rounded-lg object-contain border border-ninja-700"
                />
                <div className="text-[11px] text-slate-400">
                  {file?.name} · {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : ''} · Değiştirmek için tıklayın
                </div>
              </div>
            ) : (
              <div className="py-4 flex flex-col items-center gap-2">
                <ImagePlus className="w-8 h-8 text-orange-400/80" />
                <div className="text-xs font-semibold text-slate-200">
                  Görseli sürükleyip bırakın veya seçin
                </div>
                <div className="text-[11px] text-slate-400">
                  JPG, PNG, WEBP, GIF · Maksimum 8 MB
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="fanart-title" className="block text-[11px] font-semibold text-slate-300 mb-1">
                Eser Başlığı *
              </label>
              <input
                id="fanart-title"
                type="text"
                maxLength={80}
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Hokage Toplantısı"
                className="w-full h-9 px-3 rounded-lg bg-ninja-950 border border-ninja-700 text-xs text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label htmlFor="fanart-artist" className="block text-[11px] font-semibold text-slate-300 mb-1">
                Çizer / Sanatçı *
              </label>
              <input
                id="fanart-artist"
                type="text"
                maxLength={50}
                required
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Örn: @falconhk"
                className="w-full h-9 px-3 rounded-lg bg-ninja-950 border border-ninja-700 text-xs text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Köy Etiketi
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {FANART_VILLAGES.map(v => {
                const meta = FANART_VILLAGE_META[v];
                const isSelected = village === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVillage(v)}
                    className={`flex items-center justify-center gap-1.5 h-9 rounded-lg border text-xs transition-colors ${
                      isSelected
                        ? meta.activeButtonClass
                        : 'bg-ninja-950 border-ninja-700 text-slate-300 hover:bg-ninja-800'
                    }`}
                  >
                    <VillageEmblem village={v === 'genel' ? 'all' : v} className="w-3.5 h-3.5" />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="fanart-description" className="block text-[11px] font-semibold text-slate-300 mb-1">
              Açıklama (İsteğe Bağlı)
            </label>
            <textarea
              id="fanart-description"
              rows={2}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Karakterler, sahne veya kısa not..."
              className="w-full p-2.5 rounded-lg bg-ninja-950 border border-ninja-700 text-xs text-slate-100 placeholder:text-slate-500 resize-none"
            />
          </div>

          {/* Anti-spam honeypot field */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="fanart-website">Website</label>
            <input
              id="fanart-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-3.5 rounded-lg bg-ninja-950 hover:bg-ninja-800 border border-ninja-700 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-40"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="h-9 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Yükleniyor...' : isAdmin ? 'Galeriye Yayınla' : 'Onaya Gönder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
