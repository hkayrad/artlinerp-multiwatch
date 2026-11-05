import React, { useState } from 'react';
import { MessageSquare, Share2, LayoutGrid, LayoutTemplate, Disc as DiscordIcon, ExternalLink, Tv, Copy, Check, X } from 'lucide-react';
import { siteConfig } from '../config/siteConfig';
import { LayoutMode } from './StreamGrid';

interface HeaderProps {
  activeVillage: 'konoha' | 'suna' | 'all' | 'custom';
  streamCount: number;
  layoutMode: LayoutMode;
  isChatOpen: boolean;
  onSelectVillage: (village: 'konoha' | 'suna' | 'all') => void;
  onChangeLayout: (layout: LayoutMode) => void;
  onToggleChat: () => void;
  onOpenAddModal: () => void;
  onShareLink: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeVillage,
  streamCount,
  layoutMode,
  isChatOpen,
  onSelectVillage,
  onChangeLayout,
  onToggleChat,
  onOpenAddModal,
  onShareLink,
}) => {
  const [copiedDiscord, setCopiedDiscord] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  return (
    <header className="bg-ninja-900/95 backdrop-blur-md border-b border-ninja-700/70 sticky top-0 z-30 select-none shadow-xl">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Sol Taraf: Çift Logo ve Sunucu Bilgileri */}
        <div className="flex items-center gap-3">
          {/* 1. Sunucu Logosu */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={siteConfig.serverLogo}
                alt={siteConfig.serverName}
                className="w-10 h-10 object-contain rounded-xl p-0.5 bg-ninja-950 border border-orange-500/40 shadow-lg shadow-orange-500/10"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div className="hidden xs:flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base text-slate-100 tracking-wide naruto-title">
                  {siteConfig.serverName}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
                  Multiwatch
                </span>
                {streamCount > 0 && (
                  <span className="hidden lg:inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-ninja-800 text-slate-300 border border-ninja-700">
                    {streamCount} POV
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:block">
                {siteConfig.serverSubname}
              </span>
            </div>
          </div>

          <div className="hidden sm:block h-7 w-[1px] bg-ninja-700/80 mx-1" />

          {/* 2. Geliştirici / Kurucu Logosu & İletişim */}
          <div
            className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-ninja-950/60 px-2.5 py-1 rounded-lg border border-ninja-800"
            title={`${siteConfig.requestStreamerNotice} (Discord: ${siteConfig.creatorDiscord})`}
          >
            <img
              src={siteConfig.creatorLogo}
              alt={siteConfig.creatorName}
              className="w-5 h-5 object-contain rounded-md"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-medium text-slate-300">
              {siteConfig.creatorName}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-ninja-900 text-orange-400 border border-ninja-800">
              {siteConfig.creatorDiscord}
            </span>
          </div>
        </div>

        {/* Orta Kısım: Konohagakure ve Sunagakure POV Seçici Butonlar */}
        <div className="flex items-center gap-1.5 bg-ninja-950/80 p-1 rounded-xl border border-ninja-800 shadow-inner">
          {/* Konohagakure */}
          <button
            onClick={() => onSelectVillage('konoha')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeVillage === 'konoha'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-bold'
                : 'text-slate-300 hover:text-emerald-400 hover:bg-ninja-800'
            }`}
          >
            <span>🍃</span>
            <span>Konoha POVs</span>
          </button>

          {/* Sunagakure */}
          <button
            onClick={() => onSelectVillage('suna')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeVillage === 'suna'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-bold'
                : 'text-slate-300 hover:text-amber-400 hover:bg-ninja-800'
            }`}
          >
            <span>⏳</span>
            <span>Suna POVs</span>
          </button>

          {/* Tümü (Her İki Köy) */}
          <button
            onClick={() => onSelectVillage('all')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeVillage === 'all'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 font-bold'
                : 'text-slate-300 hover:text-orange-400 hover:bg-ninja-800'
            }`}
          >
            <span>⚔️</span>
            <span>Tüm Köyler</span>
          </button>
        </div>

        {/* Sağ Taraf: Yayın Listesi/Ekle, Düzen, Sohbet, Paylaşım ve Discord */}
        <div className="flex items-center gap-2">
          {/* Yayın Seçici Listesi Butonu */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-colors shadow-md shadow-orange-600/20 active:scale-95"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Yayın Seç</span>
          </button>

          {/* Düzen Değiştirici */}
          <div className="hidden lg:flex items-center bg-ninja-950/80 p-0.5 rounded-lg border border-ninja-800">
            <button
              onClick={() => onChangeLayout('auto')}
              title="Otomatik Izgara"
              className={`p-1.5 rounded-md text-xs transition-colors ${
                layoutMode === 'auto'
                  ? 'bg-ninja-800 text-orange-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeLayout('theatre')}
              title="Tiyatro / Odak Modu"
              className={`p-1.5 rounded-md text-xs transition-colors ${
                layoutMode === 'theatre'
                  ? 'bg-ninja-800 text-orange-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sohbet Paneli Aç / Kapat */}
          <button
            onClick={onToggleChat}
            title={isChatOpen ? "Sohbeti Gizle" : "Sohbeti Göster"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              isChatOpen
                ? 'bg-ninja-800 text-purple-400 border-purple-500/40 shadow-sm'
                : 'bg-ninja-950/80 text-slate-400 border-ninja-800 hover:text-slate-200 hover:bg-ninja-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Sohbet</span>
          </button>

          {/* Paylaş */}
          <button
            onClick={onShareLink}
            title="Yayın düzeni URL bağlantısını kopyala"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-ninja-950/80 hover:bg-ninja-800 text-slate-300 border border-ninja-800 hover:text-white transition-colors active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Paylaş</span>
          </button>

          {/* Sunucu Discord Butonu */}
          <a
            href={siteConfig.discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Artline Discord Sunucusuna Katıl"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30 transition-colors"
          >
            <DiscordIcon className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Discord</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
          </a>
        </div>
      </div>

      {/* Üst Duyuru / Yayıncı Ekleme & Discord İletişim Şeridi */}
      {!isBannerDismissed && (
        <div className="bg-gradient-to-r from-orange-950/70 via-ninja-900 to-orange-950/70 border-t border-orange-500/30 px-3 py-1.5 text-xs text-slate-200">
          <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-2">
            <div className="flex-1 flex items-center justify-center flex-wrap gap-2 text-center min-w-0">
              <span className="text-base shrink-0">📢</span>
              <span className="font-semibold text-slate-100 text-[11px] sm:text-xs">
                {siteConfig.requestStreamerNotice}:
              </span>
              <div className="inline-flex items-center gap-1.5 bg-ninja-950 px-2 py-0.5 rounded-md border border-orange-500/40 shadow-sm">
                <span className="font-mono font-extrabold text-orange-400 text-[11px] sm:text-xs">
                  Discord: {siteConfig.creatorDiscord}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(siteConfig.creatorDiscord);
                    setCopiedDiscord(true);
                    setTimeout(() => setCopiedDiscord(false), 2000);
                  }}
                  className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-ninja-800 hover:bg-orange-600 text-slate-300 hover:text-white transition-colors flex items-center gap-1 active:scale-95"
                  title="Discord kullanıcı adını kopyala"
                >
                  {copiedDiscord ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Kopyalandı!</span>
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

            <button
              type="button"
              onClick={() => setIsBannerDismissed(true)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-ninja-800 transition-colors shrink-0"
              title="Duyuruyu Gizle"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
