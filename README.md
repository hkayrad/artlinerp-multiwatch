# Artline Naruto RP - Çoklu Yayın İzleme (Multiwatch)

**Artline Naruto RP** Garry's Mod Türk topluluğu için özel olarak geliştirilmiş, **Twitch** ve **Kick** yayınlarını aynı anda tek bir ekranda donmadan ve kasmadan izlemeyi sağlayan çoklu POV izleme platformu.

---

## 🌟 Temel Özellikler

- **Çift Platform Desteği**: Hem Twitch hem Kick canlı yayınlarını ve canlı sohbetlerini destekler.
- **Konohagakure & Sunagakure POV'ları**: Köy liderleri, ANBU, kukla birliği ve klan üyelerinin yayınları arasında tek tıkla geçiş.
- **Merkezi Sunucu Ayarları (`siteConfig.ts`)**: Veritabanı veya giriş sistemi gerektirmeden, tüm yayıncılar, sunucu logosu, geliştirici logosu ve Discord bağlantısı tek bir dosyadan yönetilir.
- **Dinamik Izgara Düzenleri**: 
  - **Otomatik (Auto)**: Eklenen yayın sayısına göre (1x1, 2x1, 2x2, 3x2, 3x3) ekranı dengeli dağıtır.
  - **2x2 Sabit Izgara**: 4 yayını eşit boyutta gösterir.
  - **Tiyatro / Odak Modu**: Seçilen ana yayını dev ekranda, diğerlerini thumbnail olarak yanda gösterir.
- **Akıllı Ses Yönetimi (Solo Audio)**:
  - Tek tıkla seçilen yayının sesini açıp diğerlerini susturur (ses karmaşasını önler).
  - "Tümünü Sustur" ve "Sesleri Aç" kısayolları.
- **Çoklu Canlı Sohbet Çekmecesi**: Twitch ve Kick sohbetleri arasında sekmelerle geçiş yapılabilen gizlenebilir yan panel.
- **Discord Bağlantı Paylaşımı**: Mevcut açık yayınları URL'e kaydeder (`?streams=t:kanal1,k:kanal2`). "Discord için Kopyala" butonuyla anında sohbete yapıştırılabilir.
- **Saf Türkçe Arayüz**: Türkçe terminolojiye ve Naruto RP konseptine uygun tasarım.

---

## ⚙️ Sunucu ve Yayın Ayarları (`src/config/siteConfig.ts`)

Sunucunuzdaki yayıncıları, logoları veya Discord linkini değiştirmek için yalnızca [`src/config/siteConfig.ts`](file:///home/hkayrad/Repos/artline-multiwatch/src/config/siteConfig.ts) dosyasını düzenlemeniz yeterlidir:

```typescript
export const siteConfig: SiteConfig = {
  serverName: "Artline Naruto RP",
  serverSubname: "Garry's Mod Türk Topluluğu",
  
  // Sunucu Logosu (public klasöründe veya harici resim URL'i)
  serverLogo: "/artline-logo.svg",
  
  // Geliştirici / Kurucu Logosu ve İsmi
  creatorName: "Artline",
  creatorLogo: "/creator-logo.svg",
  
  // Topluluk Discord Bağlantısı
  discordUrl: "https://discord.gg/artline",
  
  // Varsayılan Açılış Köyü: 'konoha' | 'suna' | 'all'
  defaultVillage: 'konoha',

  villages: {
    konoha: {
      name: 'Konohagakure',
      streams: [
        {
          id: 'konoha-1',
          name: 'Hokage POV',
          channel: 'twitch_kullanici_adi',
          platform: 'twitch',
          village: 'konoha',
          roleTag: '7. Hokage',
          isDefaultActive: true,
        },
        {
          id: 'konoha-2',
          name: 'ANBU Kaptanı POV',
          channel: 'kick_kullanici_adi',
          platform: 'kick',
          village: 'konoha',
          roleTag: 'ANBU',
          isDefaultActive: true,
        },
      ],
    },
    suna: {
      name: 'Sunagakure',
      streams: [
        {
          id: 'suna-1',
          name: 'Kazekage POV',
          channel: 'kazekage_kick_adi',
          platform: 'kick',
          village: 'suna',
          roleTag: '5. Kazekage',
          isDefaultActive: true,
        },
      ],
    },
  },
};
```

---

## 🚀 Kurulum ve Çalıştırma

### 1. Gereksinimler
- Node.js (v18 veya üzeri)
- npm

### 2. Geliştirme Modunda Çalıştırma
```bash
npm install
npm run dev
```
Tarayıcınızda `http://localhost:5173` adresinden erişebilirsiniz.

### 3. Testleri Çalıştırma
```bash
npm test
```

### 4. Canlıya Alma / Derleme (Production Build)
```bash
npm run build
```
Oluşan `dist/` klasörünü Vercel, Netlify, Cloudflare Pages, Nginx veya Apache sunucunuza yükleyebilirsiniz.
