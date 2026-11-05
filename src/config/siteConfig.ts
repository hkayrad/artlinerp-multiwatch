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

export interface LogoOption {
  id: string;
  name: string;
  url: string;
  category: 'server' | 'creator' | 'both';
  description?: string;
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
  availableLogos: LogoOption[];
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

  // Seçilebilir Hazır Logo ve Görsel Listesi
  availableLogos: [
    {
      id: 'artline-official',
      name: 'Artline Sunucu Logosu (WebP)',
      url: '/artline.webp',
      category: 'server',
      description: 'Artline Naruto RP resmi sunucu görseli',
    },
    {
      id: 'hkd-official',
      name: 'HKD Geliştirici Logosu (WebP)',
      url: '/hkd.webp',
      category: 'creator',
      description: 'HKD resmi geliştirici profil görseli',
    },
    {
      id: 'konoha-spiral',
      name: 'Konohagakure Spirali',
      url: '/logos/konoha-spiral.svg',
      category: 'both',
      description: 'Ateşin İradesi - Konoha yaprak amblemi',
    },
    {
      id: 'suna-symbol',
      name: 'Sunagakure Kum Saati',
      url: '/logos/suna-symbol.svg',
      category: 'both',
      description: 'Çölün Rüzgarı - Kum Köyü amblemi',
    },
    {
      id: 'anbu-mask',
      name: 'ANBU Shinobi Maskesi',
      url: '/logos/anbu-mask.svg',
      category: 'both',
      description: 'Özel kuvvetler porselen ninja maskesi',
    },
    {
      id: 'uchiha-crest',
      name: 'Uchiha Klan Yelpazesi',
      url: '/logos/uchiha-crest.svg',
      category: 'both',
      description: 'Geleneksel kırmızı-beyaz Uchiha amblemi',
    },
    {
      id: 'akatsuki-cloud',
      name: 'Akatsuki Kızıl Bulutu',
      url: '/logos/akatsuki-cloud.svg',
      category: 'both',
      description: 'Kırmızı Akatsuki fırtına bulutu amblemi',
    },
    {
      id: 'shinobi-kunai',
      name: 'Shinobi Kunai Rozeti',
      url: '/logos/shinobi-kunai.svg',
      category: 'creator',
      description: 'Geliştirici çakra kunai rozeti',
    },
    {
      id: 'fuma-shuriken',
      name: 'Fuma Shuriken Rozeti',
      url: '/logos/fuma-shuriken.svg',
      category: 'both',
      description: 'Dört bıçaklı dev fuma shurikeni',
    },
  ],

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
        }
      ],
    },
  },
};
