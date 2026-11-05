import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { Platform, StreamItem, siteConfig } from '../config/siteConfig';
import { parseChannelInput } from '../utils/streamUtils';

interface AddStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStream: (stream: Omit<StreamItem, 'id'>) => void;
  existingStreamChannels: Set<string>;
}

export const AddStreamModal: React.FC<AddStreamModalProps> = ({
  isOpen,
  onClose,
  onAddStream,
  existingStreamChannels,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [platform, setPlatform] = useState<Platform>('twitch');
  const [name, setName] = useState('');
  const [village, setVillage] = useState<'konoha' | 'suna' | 'diger'>('konoha');
  const [roleTag, setRoleTag] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) {
      setError('Lütfen bir yayıncı adı veya bağlantı girin.');
      return;
    }

    const parsed = parseChannelInput(inputVal, platform);
    if (!parsed.channel) {
      setError('Geçersiz kanal adı veya bağlantı.');
      return;
    }

    if (existingStreamChannels.has(parsed.channel.toLowerCase())) {
      setError('Bu kanal zaten çoklu izleme ekranında ekli.');
      return;
    }

    onAddStream({
      name: name.trim() || parsed.channel,
      channel: parsed.channel,
      platform: parsed.platform,
      village,
      roleTag: roleTag.trim() || undefined,
    });

    // Sıfırla ve kapat
    setInputVal('');
    setName('');
    setRoleTag('');
    setError(null);
    onClose();
  };

  // Konfigürasyonda kayıtlı tüm önerilen yayıncılar
  const suggestedStreams = [
    ...siteConfig.villages.konoha.streams,
    ...siteConfig.villages.suna.streams,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-ninja-900 border border-ninja-700 rounded-2xl p-6 shadow-2xl">
        {/* Modal Başlık */}
        <div className="flex items-center justify-between pb-4 border-b border-ninja-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Yeni Yayın Ekle</h3>
              <p className="text-xs text-slate-400">Twitch veya Kick kanalını çoklu ekrana dahil et</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-ninja-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Platform Seçimi */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Platform Seçin
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPlatform('twitch')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  platform === 'twitch'
                    ? 'bg-twitch text-white border-twitch/60 shadow-lg shadow-twitch/20'
                    : 'bg-ninja-950 text-slate-400 border-ninja-800 hover:border-ninja-700'
                }`}
              >
                <span>🟣</span>
                <span>Twitch</span>
              </button>
              <button
                type="button"
                onClick={() => setPlatform('kick')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  platform === 'kick'
                    ? 'bg-kick text-black border-kick/60 shadow-lg shadow-kick/20 font-extrabold'
                    : 'bg-ninja-950 text-slate-400 border-ninja-800 hover:border-ninja-700'
                }`}
              >
                <span>🟢</span>
                <span>Kick</span>
              </button>
            </div>
          </div>

          {/* Kanal Adı / Linki */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Kanal Adı veya Bağlantısı <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              value={inputVal}
              onChange={e => {
                setInputVal(e.target.value);
                setError(null);
              }}
              placeholder={platform === 'twitch' ? 'Örn: elraenn veya twitch.tv/elraenn' : 'Örn: jrokez veya kick.com/jrokez'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-ninja-950 border border-ninja-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-100 text-sm placeholder-slate-500 outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* Karakter / POV İsmi (Opsiyonel) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Karakter / POV Etiketi (Opsiyonel)
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Örn: Hokage POV (Ahmet)"
                className="w-full px-3.5 py-2 rounded-xl bg-ninja-950 border border-ninja-700 focus:border-orange-500 text-slate-100 text-xs placeholder-slate-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Köy Seçimi
              </label>
              <select
                value={village}
                onChange={e => setVillage(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-ninja-950 border border-ninja-700 focus:border-orange-500 text-slate-100 text-xs outline-none"
              >
                <option value="konoha">🍃 Konohagakure</option>
                <option value="suna">⏳ Sunagakure</option>
                <option value="diger">⚔️ Diğer / Tarafsız</option>
              </select>
            </div>
          </div>

          {/* Butonlar */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-ninja-800 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/30 transition-all active:scale-95"
            >
              Yayını Ekle
            </button>
          </div>
        </form>

        {/* Hızlı Sunucu Önerileri */}
        <div className="mt-6 pt-4 border-t border-ninja-800">
          <span className="block text-xs font-semibold text-slate-400 mb-2">
            Sunucu POV Önerileri:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestedStreams.map(item => {
              const isAlreadyAdded = existingStreamChannels.has(item.channel.toLowerCase());
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isAlreadyAdded}
                  onClick={() => {
                    onAddStream({
                      name: item.name,
                      channel: item.channel,
                      platform: item.platform,
                      village: item.village,
                      roleTag: item.roleTag,
                    });
                    onClose();
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
                    isAlreadyAdded
                      ? 'bg-ninja-950/60 border-ninja-800 text-slate-500 cursor-not-allowed'
                      : 'bg-ninja-950 border-ninja-700/80 text-slate-300 hover:text-orange-400 hover:border-orange-500/50'
                  }`}
                >
                  <span>{item.village === 'konoha' ? '🍃' : '⏳'}</span>
                  <span>{item.name}</span>
                  <span className="text-[9px] uppercase px-1 rounded bg-ninja-800 text-slate-400">
                    {item.platform}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
