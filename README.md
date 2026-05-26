Discord.js v14 tabanlı, çoklu bot mimarisiyle çalışan topluluk yönetim altyapısı. Kayıt, moderasyon, istatistik, guard ve hoş geldin sistemleri tek depoda toplanır; PM2 ile aynı anda yönetilir.

## Özellikler

- **Kayıt (Registery)** — Teyit, isim geçmişi, kayıtsız/kayıtlı rol akışı, davet takibi
- **Moderasyon (Supervisor)** — Ban, jail, mute, uyarı, ceza puanı, sicil ve panel komutları
- **Guard (3 katman)** — Kanal/rol/sunucu koruması, yedekleme, whitelist ve dağıtıcı botlar
- **İstatistik** — Ses, mesaj, kamera, yayın ve yetkili sıralamaları
- **Yetkili & görev** — Yetki alımı, sorumluluk panelleri, görev ve leaderboard
- **Topluluk** — Tweet paneli, itiraf, ship, AFK, Spotify, çekiliş ve benzeri kullanıcı araçları
- **Hoş geldin** — AFK ses kanallarında çalışan ayrı welcome botları

## Mimari

| PM2 uygulaması | Dizin | Görev |
|----------------|-------|--------|
| Voucher | `Server/J2pon-Main/Registery` | Kayıt botu |
| Moderation | `Server/J2pon-Main/Supervisor` | Ana moderasyon ve komutlar |
| GuardOne / GuardTwo / GuardThree | `Server/J2pon-Guard/Guard*` | Koruma katmanları |
| Welcomes | `Server/J2pon-Welcome` | Hoş geldin ses botları |

Paylaşılan kod ve veritabanı şemaları `Global/` altında tutulur.

## Gereksinimler

- [Node.js](https://nodejs.org/) 18.x – 22.x
- [MongoDB](https://www.mongodb.com/)
- [PM2](https://pm2.keymetrics.io/) (`npm install -g pm2`)
- Discord Developer Portal’da oluşturulmuş bot uygulamaları (moderasyon, kayıt, 3 guard, welcome token’ları)

## Kurulum

```bash
git clone <repo-url> carmenta
cd carmenta
npm install
```

## Yapılandırma

### 1. `Global/Settings/System.js`

Sunucu kimliği, MongoDB bağlantısı, bot token’ları ve genel limitler burada tanımlanır:

- `Server`, `ServerID`, `ServerURL`
- `MongoURL`
- `Mainframe.Moderation` / `Mainframe.Registery` — ana bot token’ları
- `Security.Guard_I`, `Guard_II`, `Guard_III` — guard token’ları
- `Welcome.Tokens` ve `Welcome.Channels` — hoş geldin botları
- `BotsOwners` — bot sahibi kullanıcı ID’leri

### 2. `Global/Settings/Setup.json`

Roller, kanallar, tag ayarları ve sunucuya özel yapılandırma bu dosyada tutulur. Sunucuya ilk kurulumda Supervisor içindeki `.setup` komutu ile emoji ve temel ayarlar senkronize edilebilir.

### 3. `Global/Settings/Emojis.json`

Sunucu emojilerinin ID ve URL eşlemeleri; setup sırasında güncellenir.

### 4. `Global/Settings/AyarName.js`

Log kanalları, küfür/reklam filtreleri ve komut kanalı tanımları (çoğu ayar `Setup.json` ile birlikte kullanılır).

> Token, webhook ve MongoDB URI gibi hassas bilgileri repoya eklemeyin.

## Çalıştırma

Tüm süreçleri PM2 ile başlatmak için:

```bash
npm start
```

Bu komut `ecosystem.config.js` dosyasındaki uygulamaları cluster modunda ayağa kaldırır. Durum ve loglar için:

```bash
pm2 status
pm2 logs
```

## Proje yapısı (özet)

```
carmenta/
├── Global/
│   ├── Settings/      # System.js, Setup.json, Emojis.json
│   ├── Schemas/       # Mongoose şemaları
│   ├── Models/        # İstatistik modelleri
│   └── Helpers/       # Ortak yardımcılar
├── Server/
│   ├── J2pon-Main/
│   │   ├── Supervisor/   # Moderasyon + paneller
│   │   └── Registery/    # Kayıt
│   ├── J2pon-Guard/       # Guard I / II / III
│   └── J2pon-Welcome/    # Hoş geldin botları
├── ecosystem.config.js
└── package.json
```

## Referans sunucu

Botların canlı kullanımını, panelleri ve akışları görmek için referans sunucuya katılabilirsiniz:

**[discord.gg/carmenta](https://discord.gg/carmenta)**

## Lisans

Proje `GPL` lisansı altındadır (`package.json`).

---

*J2pon'dan sevgiler.*
