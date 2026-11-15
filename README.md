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
Oluşan `dist/` klasörünü cPanel (`public_html/`) veya sunucunuza yükleyebilirsiniz.

---

## 🎨 Fanart Galerisi ve cPanel PHP Kurulumu

Uygulama `/fanart` galerisi, onay kuyruklu ziyaretçi gönderimleri ve `/admin` yönetici yüklemeleri için `public/api/` altında sıfır bağımlılıklı **PHP 8+** uç noktaları içerir.

### 1. cPanel (`public_html/`) Üzerinde Kurulum
1. `npm run build` çalıştırın ve `dist/` içeriğini `public_html/` klasörüne yükleyin.
2. `public_html/api/config.example.php` dosyasını `public_html/api/config.php` olarak kopyalayın.
3. Yönetici şifresi özeti (`admin_password_hash`) ve oturum anahtarı (`session_secret`) oluşturup `config.php` içine yazın:
   ```bash
   php -r "echo password_hash('guclu-sifreniz', PASSWORD_DEFAULT) . PHP_EOL;"
   php -r "echo bin2hex(random_bytes(32)) . PHP_EOL;"
   ```
4. `public_html/uploads/fanart/`, `public_html/uploads/fanart/pending/` ve `public_html/fanart-data/` klasörlerinin PHP tarafından yazılabilir (`0755`) olduğundan emin olun.
5. **İsteğe bağlı manuel yükleme**: cPanel Dosya Yöneticisi veya FTP ile doğrudan `public_html/uploads/fanart/` klasörüne görsel attığınızda da galeri otomatik olarak yeni görselleri algılar.

### 2. Yerel Makinede Docker (`php:8.2-apache`) ile Test Etme
cPanel ile aynı Apache `.htaccess` + PHP 8 ortamını yerel olarak test etmek için Docker servisini başlatın ve aşağıdaki komutu çalıştırın:
```bash
# 1) Derleyin
npm run build

# 2) Yerel test için config.php oluşturun (isteğe bağlı olarak dist/api/config.php)
cp public/api/config.example.php dist/api/config.php

# 3) Docker Apache + PHP 8.2 sunucusunu başlatın (http://localhost:8080)
npm run preview:apache
```
Tarayıcıdan `http://localhost:8080/fanart` ve `http://localhost:8080/admin` adreslerini test edebilirsiniz.
