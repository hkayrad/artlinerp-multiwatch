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
  serverLogo: string; // Resim bağlantısı veya yerel dosya (/artline-logo.png)
  creatorName: string;
  creatorLogo: string; // Kurucu / Geliştirici logosu bağlantısı
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
  serverLogo: "/artline-logo.svg",
  
  // Geliştirici / Kurucu Logosu ve İsmi
  creatorName: "Artline",
  creatorLogo: "/creator-logo.svg",
  
  // Topluluk Discord Bağlantısı
  discordUrl: "https://discord.gg/artline",
  
  defaultLayout: 'auto',
  defaultVillage: 'konoha',

  villages: {
    konoha: {
      id: 'konoha',
      name: 'Konohagakure',
      symbol: '🍃',
      motto: 'Ateşin İradesi - Yaprak Köyü',
      themeColor: 'konoha',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      streams: [
        {
          id: 'konoha-1',
          name: 'Hokage POV',
          channel: 'artlinehokage',
          platform: 'twitch',
          village: 'konoha',
          roleTag: '7. Hokage',
          isDefaultActive: true,
        },
        {
          id: 'konoha-2',
          name: 'ANBU Kaptanı POV',
          channel: 'artlineanbu',
          platform: 'kick',
          village: 'konoha',
          roleTag: 'ANBU Özel Birlik',
          isDefaultActive: true,
        },
        {
          id: 'konoha-3',
          name: 'Uchiha Klan Lideri POV',
          channel: 'artlineuchiha',
          platform: 'twitch',
          village: 'konoha',
          roleTag: 'Uchiha Klanı',
          isDefaultActive: false,
        },
      ],
    },
    suna: {
      id: 'suna',
      name: 'Sunagakure',
      symbol: '⏳',
      motto: 'Çölün Rüzgarı - Kum Köyü',
      themeColor: 'suna',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      streams: [
        {
          id: 'suna-1',
          name: 'Kazekage POV',
          channel: 'artlinekazekage',
          platform: 'kick',
          village: 'suna',
          roleTag: '5. Kazekage',
          isDefaultActive: true,
        },
        {
          id: 'suna-2',
          name: 'Kukla Ustası POV',
          channel: 'artlinesuna',
          platform: 'twitch',
          village: 'suna',
          roleTag: 'Kukla Birliği',
          isDefaultActive: true,
        },
        {
          id: 'suna-3',
          name: 'Kum Muhafızı POV',
          channel: 'artlinekummuhafiz',
          platform: 'kick',
          village: 'suna',
          roleTag: 'Kum Muhafızı',
          isDefaultActive: false,
        },
      ],
    },
  },
};
