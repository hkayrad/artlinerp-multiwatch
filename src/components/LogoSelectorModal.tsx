import React, { useState } from 'react';
import { X, Image as ImageIcon, Check, Copy, Sparkles } from 'lucide-react';
import { LogoOption, siteConfig } from '../config/siteConfig';

interface LogoSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentServerLogo: string;
  currentCreatorLogo: string;
  onSelectServerLogo: (url: string) => void;
  onSelectCreatorLogo: (url: string) => void;
}

export const LogoSelectorModal: React.FC<LogoSelectorModalProps> = ({
  isOpen,
  onClose,
  currentServerLogo,
  currentCreatorLogo,
  onSelectServerLogo,
  onSelectCreatorLogo,
}) => {
  const [activeTab, setActiveTab] = useState<'server' | 'creator'>('server');
  const [customUrl, setCustomUrl] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const currentSelected = activeTab === 'server' ? currentServerLogo : currentCreatorLogo;
  const onSelectCurrent = activeTab === 'server' ? onSelectServerLogo : onSelectCreatorLogo;

  // Filtreleme: sunucu veya kurucu için uygun logolar
  const logos = siteConfig.availableLogos.filter(
    logo => logo.category === 'both' || logo.category === activeTab
  );

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    onSelectCurrent(customUrl.trim());
    setCustomUrl('');
  };

  const handleCopyConfigSnippet = () => {
    const key = activeTab === 'server' ? 'serverLogo' : 'creatorLogo';
    const snippet = `${key}: "${currentSelected}",`;
    navigator.clipboard.writeText(snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-ninja-900 border border-ninja-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Başlık */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-ninja-800 bg-ninja-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Logo ve Görsel Seçimi</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-ninja-800 text-orange-400 border border-ninja-700">
                  Canlı Önizleme
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Üst menüdeki sunucu ve kurucu logolarını listeden anında değiştirin
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

        {/* Tab Seçimi (Sunucu Logosu vs Kurucu Logosu) */}
        <div className="flex border-b border-ninja-800 bg-ninja-950 px-4 pt-2 gap-2 select-none">
          <button
            onClick={() => setActiveTab('server')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'server'
                ? 'border-orange-500 text-orange-400 bg-ninja-900/50 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <img
              src={currentServerLogo}
              alt="Sunucu"
              className="w-4 h-4 object-contain rounded"
              onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
            />
            <span>Sunucu Logosu</span>
          </button>

          <button
            onClick={() => setActiveTab('creator')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'creator'
                ? 'border-emerald-500 text-emerald-400 bg-ninja-900/50 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <img
              src={currentCreatorLogo}
              alt="Kurucu"
              className="w-4 h-4 object-contain rounded"
              onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
            />
            <span>Kurucu / Geliştirici Logosu</span>
          </button>
        </div>

        {/* İçerik Gövdesi */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Şu Anda Seçili Logo Önizleme Kartı */}
          <div className="p-3.5 rounded-xl bg-ninja-950 border border-ninja-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-ninja-900 border border-ninja-700 flex items-center justify-center p-1.5 shadow-md">
                <img
                  src={currentSelected}
                  alt="Seçili Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Şu Anda Aktif Olan Görsel
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-200 break-all font-mono">
                  {currentSelected}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopyConfigSnippet}
              title="siteConfig.ts için kopyala"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-ninja-900 hover:bg-ninja-800 text-slate-300 border border-ninja-700 transition-colors shrink-0"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Kopyalandı</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kodu Kopyala</span>
                </>
              )}
            </button>
          </div>

          {/* Hazır Görseller Listesi / Izgarası */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>Hazır Logo Listesinden Seçin:</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {logos.length} seçenek mevcut
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {logos.map((item: LogoOption) => {
                const isSelected = currentSelected === item.url;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectCurrent(item.url)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? activeTab === 'server'
                          ? 'bg-orange-500/10 border-orange-500 ring-1 ring-orange-500 shadow-md'
                          : 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500 shadow-md'
                        : 'bg-ninja-950/70 border-ninja-800 hover:border-ninja-700 hover:bg-ninja-950'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-ninja-900 border border-ninja-700/60 p-1 flex items-center justify-center shrink-0">
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-200 truncate">
                          {item.name}
                        </span>
                        {isSelected && (
                          <span
                            className={`p-0.5 rounded-full ${
                              activeTab === 'server'
                                ? 'bg-orange-500 text-white'
                                : 'bg-emerald-500 text-black'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                        {item.description || item.url}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Özel Görsel / URL Girdisi */}
          <div className="pt-3 border-t border-ninja-800">
            <span className="block text-xs font-bold text-slate-300 mb-1.5">
              Veya Özel Görsel / Dosya Adresi Girin
            </span>
            <form onSubmit={handleApplyCustomUrl} className="flex gap-2">
              <input
                type="text"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                placeholder="Örn: /artline.webp veya https://ornek.com/logo.png"
                className="flex-1 px-3.5 py-2 rounded-xl bg-ninja-950 border border-ninja-700 focus:border-orange-500 text-xs text-slate-100 placeholder-slate-500 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-ninja-800 hover:bg-ninja-700 text-slate-200 border border-ninja-600 transition-colors shrink-0"
              >
                Uygula
              </button>
            </form>
          </div>
        </div>

        {/* Modal Alt Kısım */}
        <div className="p-4 border-t border-ninja-800 bg-ninja-950/70 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 hidden sm:block">
            İpucu: Seçiminizi kalıcı yapmak için <code className="text-orange-400">src/config/siteConfig.ts</code> dosyasını güncelleyebilirsiniz.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all ml-auto shadow-md"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
