export type Platform = 'twitch' | 'kick';

export interface StreamItem {
  id: string;
  name: string; // Görünecek Karakter / Rol veya Oyuncu İsmi (Örn: "Hokage POV", "ANBU Lideri", "Gaara POV")
  channel: string; // Twitch veya Kick kullanıcı adı
  platform: Platform;
  village: 'konoha' | 'suna' | 'diger';
  roleTag?: string; // Örn: "Hokage", "Kazekage", "Jonin", "Kukla Birliği"
  isDefaultActive?: boolean; // Sayfa ilk açıldığında aktif olsun mu
}

export interface VillageConfig {
  id: 'konoha' | 'suna';
  name: string;
  symbol: string;
  motto: string;
  themeColor: 'konoha' | 'suna';
  badgeColor: string;
  streams: StreamItem[];
}

export interface SiteConfig {
  serverName: string;
  serverSubname: string;
  serverLogo: string; // Resim bağlantısı veya yerel dosya (/artline.webp)
  creatorName: string;
  creatorLogo: string; // Kurucu / Geliştirici logosu bağlantısı (/hkd.webp)
  discordUrl: string;
  defaultLayout: 'auto' | '2x2' | 'theatre';
  defaultVillage: 'konoha' | 'suna' | 'all';
  villages: {
    konoha: VillageConfig;
    suna: VillageConfig;
  };
}

/**
 * =====================================================================
 * ARTLINE NARUTO RP - MERKEZİ SUNUCU VE YAYIN AYARLARI
 * =====================================================================
 * Yeni yayıncı veya POV eklemek için aşağıdaki listeleri düzenleyebilirsiniz.
 * Twitch veya Kick kanallarının sadece kullanıcı adını yazmanız yeterlidir.
 */
export const siteConfig: SiteConfig = {
  serverName: "Artline Naruto RP",
  serverSubname: "Garry's Mod Türk Topluluğu",
  
  // Sunucu Logosu: İster URL, ister /public dizinindeki dosya adı
  serverLogo: "/artline.webp",
  
  // Geliştirici / Kurucu Logosu ve İsmi
  creatorName: "HKD",
  creatorLogo: "/hkd.webp",
  
  // Topluluk Discord Bağlantısı
  discordUrl: "https://discord.gg/artline",
  
  defaultLayout: 'auto',
  defaultVillage: 'konoha',

  villages: {
    konoha: {
      id: 'konoha',
      name: 'Konohagakure',
      symbol: '🍃',
      motto: 'Ateşin İradesi',
      themeColor: 'konoha',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      streams: [
        {
          id: 'zade',
          name: 'Akio Akasaki',
          channel: 'zade',
          platform: 'kick',
          village: 'konoha',
          roleTag: 'Onayli Chunin',
          isDefaultActive: false,
        },
        {
          id: 'egeomeer',
          name: 'Kinma Senju',
          channel: 'egeomeer',
          platform: 'kick',
          village: 'konoha',
          roleTag: 'Jonin',
          isDefaultActive: false,
        }
      ],
    },
    suna: {
      id: 'suna',
      name: 'Sunagakure',
      symbol: '⏳',
      motto: 'Çölün Rüzgarı',
      themeColor: 'suna',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      streams: [
        {
          id: 'kel-kesis',
          name: 'Shohei Morita',
          channel: 'kel-kesis',
          platform: 'kick',
          village: 'suna',
          roleTag: 'Onayli Genin',
          isDefaultActive: false,
        },
        {
          id: 'zarafell',
          name: 'Akiwata Fumiamochi',
          channel: 'zarafell',
          platform: 'kick',
          village: 'suna',
          roleTag: 'Onayli Genin',
          isDefaultActive: false,
        }
      ],
    },
  },
};
