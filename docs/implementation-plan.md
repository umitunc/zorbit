# Zorbit — Yeniden Yazım ve Uygulama Planı (SOLID Mimarisi)

Bu doküman, [docs/old-version/zorbit.truncgil.com.tr](file:///d:/Works/2026/zorbit/docs/old-version/zorbit.truncgil.com.tr) dizinindeki Construct 2 tabanlı **Trunçgil Zorbit (v1.5)** oyununun analizini ve **SOLID prensiplerine** uygun olarak sıfırdan, modüler ve test edilebilir bir mimariyle yeniden yazım planını içerir.

Geliştirme iki ana faza ayrılmıştır:
1. **Faz 1 (Öncelikli):** Çekirdek oyun mekaniği, fizik, çarpışma, prosedürel üretim, kamera, ses/efektler ve yerel skor kaydı.
2. **Faz 2 (Sonraki Aşama):** Backend skor kayıt sistemi, liderlik tablosu API'si ve güvenlik iyileştirmeleri.

---

## 1. Mevcut Oyunun Teknik Analizi

Eski sürümün `data.js`, `index.php`, `scores.php` ve `set-score.php` dosyaları incelenerek oyunun tüm mekanik ve sayısal parametreleri çıkarılmıştır:

### 1.1. Temel Oynanış Döngüsü
- **Çözünürlük ve Yönelim:** `1080 x 1920` (9:16 dikey/portrait mantıksal tuval).
- **Başlangıç Durumu:** Roket (`Player`), başlangıç gezegeninin (`Platform`, yarıçap `~185px`) yüzeyine sabitlenmiş (`Pin`) durumdadır ve gezegenle birlikte eksen etrafında döner.
- **Fırlatma (Tap / Click):** Ekrana dokunulduğunda/tıklandığında roket gezegenden ayrılır (`Unpin`) ve o anki baktığı açı yönünde doğrusal olarak fırlar (`Bullet` hızı: başlangıç `1600 px/s`).
- **Gezegene İnme:** Roket, görünürlüğü `%75`'in üzerinde olan bir sonraki gezegene temas ettiğinde:
  - Gezegene sabitlenir ve dışa doğru açı alır: `angle(Player, Platform) + 180°`.
  - Skor `+1` artar (`var_score`).
  - Zorluk artar: gezegen dönüş hızı `var_difficulty` (`80°/s` -> maks `210°/s`, her inişte `+4`), roket hızı (`1600 px/s` -> maks `2200 px/s`, her inişte `+10`).
  - Mevcut gezegenin üstünde yeni bir hedef gezegen üretilir:
    - `X`: `Player.X ± random(300, 800)`
    - `Y`: `Player.Y - random(1400, 1900)`
- **Gezegen Özellikleri ve Tehlikeler:**
  - Yeni gezegenler rastgele ölçek (`1x - 2x`) ve rastgele dönüş yönü (`saat yönü` veya `tersi`) ile oluşur.
  - `var_score > 50` olduğunda, roketin üzerinde bulunduğu gezegen `3 saniye` içinde solmaya (`Fade`) başlar. Opaklık `%10`'un altına düşerse roket fırlatılır ve oyun biter.
  - **Ödül (`Point`):** Skora göre açılan eşiklerde (`score >= random(3, 20)` ve `random(14, 70)`) gezegen yörüngesine sabitlenir. Temas edildiğinde `+3` puan ve ses/parçacık efekti verir.
  - **Engel (`Enemy`):** Skora göre açılan eşiklerde (`score >= random(8, 60)` ve `random(20, 90)`) gezegen yörüngesine sabitlenir ve kendi etrafında `180°/s` döner. Temas edildiğinde `-3` puan (skor 0'ın altına düşmez) ve efekt verir.
- **Kamera ve Dinamik Yakınlaştırma:**
  - Kamera `Player` konumunu `(Player.X, Player.Y - 400)` odak noktasıyla takip eder.
  - Gezegene sabitken (`Pin`) kamera yavaşça `0.7` ölçeğine uzaklaşır (hedef gezegeni görmek için).
  - Uçuş halindeyken kamera yavaşça `1.4` ölçeğine yakınlaşır.
- **Oyun Bitişi (`Game Over`):**
  - Fırlatma anında `var_gameover = 1` olur; hedef gezegene inilirse `0`'a sıfırlanır.
  - Roket `~3 saniye` içinde bir gezegene inemezse (boşluğa giderse) `var_gameover >= 3` tetiklenir, kaybetme sesi/efekti çalar ve Menü ekranına dönülür.
- **Mevcut Asset'ler:**
  - Görseller (`images/`): `platform-sheet0.png`, `player-sheet0.png`, `point-sheet0.png`, `enemy-sheet0.png`, `effectbg-sheet0.png`, `effectplayer-sheet0.png`, `effectscore-sheet0.png`, `particles1.png`, `logo-sheet0.png`, `buttonstart-sheet0.png`, `buttonmore-sheet0.png`, `buttonsound-sheet0.png`, `buttonscreen-sheet0.png`, `dev-sheet0.png`, `texts.png`.
  - Sesler (`media/`): `player1.ogg` (fırlatma), `player2.ogg` (iniş), `point.ogg`, `enemy.ogg`, `lose.ogg`, `best.ogg`, `button1.ogg`, `button2.ogg`.

### 1.2. Eski Backend Yapısı (Faz 2'de İyileştirilecek)
- `index.php` istemcide `ZorbitPlayer-XXX` üretip `localStorage` ve IndexedDB (`localforage`) üzerinden `score_zorbit` değerini okuyarak 30 saniyede bir `set-score.php`'ye POST atıyordu.
- `scores.php` veritabanındaki skorları sıralı liste olarak gösteriyordu.
- **Tespit Edilen Eksikler:** İstemci taraflı skor manipülasyonuna açık olması, parametreli sorgu kullanılmaması, tekil oyun oturumu (session) doğrulaması olmaması. Bunlar **Faz 2**'de güvenli bir API ile çözülecektir.

---

## 2. Teknoloji Yığını

- **Dil:** TypeScript (strict mode) — güçlü tip güvenliği ve SOLID arayüz tanımları için.
- **Derleme / Geliştirme Sunucusu:** Vite
- **Render:** HTML5 Canvas 2D API (hafif, sıfır ek motor bağımlılığı, 60 FPS sabit zaman adımlı / delta-time uyumlu döngü).
- **Test Çatısı:** Vitest (oyun mekaniği, fizik, çarpışma ve skor kurallarını tarayıcı/DOM olmadan birim testleriyle doğrulamak için).

---

## 3. SOLID Prensipleri Doğrultusunda Mimari Tasarım

### 3.1. S — Single Responsibility Principle (Tek Sorumluluk)
Her sınıf ve modül yalnızca tek bir işten sorumludur:
- `OrbitSystem`: Gezegenin kendi ekseninde dönmesini ve gezegene sabitlenmiş (`Pin`) roket/ödül/düşman konumlarını hesaplar.
- `FlightSystem`: Fırlatılmış roketin hız vektörüyle hareketini ve uçuş zaman aşımı (`gameover` sayacı) kontrolünü yönetir.
- `CollisionSystem`: Roket ile `Planet`, `Point` ve `Enemy` arasındaki geometrik çarpışmaları tespit eder ve olay üretir.
- `SpawnSystem`: Yeni gezegenlerin, gezegen üzerindeki `Point`/`Enemy` eklentilerinin ve arka plan yıldız parçacıklarının üretim kurallarını uygular.
- `DifficultySystem`: Skora bağlı olarak dönüş hızı, roket hızı ve gezegen solma (`fade`) kurallarını hesaplar.
- `CameraSystem`: Hedef takip (`Player.Y - 400`) ve dinamik zoom (`0.7` ↔ `1.4`) enterpolasyonunu yapar.
- `CanvasRenderer`: Yalnızca oyun durumunu (`GameWorld`) tuvale çizer; hiçbir oyun kuralı içermez.

### 3.2. O — Open/Closed Principle (Açık/Kapalı Prensip)
- Gezegen üzerindeki etkileşimli nesneler `IPlanetAttachment` / `ICollidableEntity` soyutlaması üzerinden tanımlanır.
- Mevcut `Point` (+3) ve `Enemy` (-3) dışında ileride eklenecek yeni nesneler (ör. `Shield`, `Booster`, `BlackHole`) `CollisionSystem` veya `SpawnSystem` çekirdeği değiştirilmeden yeni strateji/varlık sınıfları olarak eklenebilir.
- Skor saklama mekanizması `IScoreRepository` arayüzü arkasındadır; Faz 1'de `LocalStorageScoreRepository` kullanılırken, Faz 2'de `ApiScoreRepository` eklenip oyun motoruna dokunulmadan değiştirilebilir.

### 3.3. L — Liskov Substitution Principle (Liskov Yerine Geçme)
- `BasePlanetAttachment` (veya ortak `ICollidable` sözleşmesi) türevleri olan `PointEntity` ve `EnemyEntity`, gezegene bağlanma, gezegenle dönme ve çarpışma anında `onHit(worldContext)` davranışlarını aynı sözleşmeyle yerine getirir; çağıran kod alt türü bilmek zorunda kalmaz.

### 3.4. I — Interface Segregation Principle (Arayüz Ayrımı)
Tek bir şişkin arayüz yerine küçük, amaca yönelik arayüzler tanımlanır:
- `IUpdatable` (`update(dt: number)`)
- `IRenderable` (`render(ctx: CanvasRenderingContext2D)`)
- `ICollidable` (`getBounds(): CircleBounds`)
- `IInputProvider` (`onLaunchIntent(cb: () => void)`, `dispose()`)
- `IAudioPlayer` (`play(soundId: SoundId, volumeDb?: number)`, `setMuted(muted: boolean)`, `isMuted(): boolean`)
- `IScoreRepository` (`getBestScore(): Promise<number>`, `saveBestScore(score: number): Promise<void>`)

### 3.5. D — Dependency Inversion Principle (Bağımlılıkların Tersine Çevrilmesi)
- Üst seviye `GameEngine` ve `GameStateMachine` sınıfları somut DOM/Canvas/WebAudio/LocalStorage sınıflarına değil, soyut arayüzlere (`IRenderer`, `IInputProvider`, `IAudioPlayer`, `IScoreRepository`) bağımlıdır.
- Tüm somut implementasyonlar uygulamanın giriş noktası olan `src/main.ts` (Composition Root) içinde oluşturulup enjekte edilir.

---

## 4. Önerilen Klasör Yapısı

```text
zorbit/
├── public/
│   └── assets/
│       ├── images/          # Eski sürümden taşınan sprite görselleri
│       └── media/           # Eski sürümden taşınan .ogg ses dosyaları
├── src/
│   ├── core/                # Saf TypeScript oyun çekirdeği (DOM bağımlılığı yok)
│   │   ├── config/
│   │   │   └── GameConfig.ts        # Tüm sabitler (1080x1920, hızlar, eşikler)
│   │   ├── entities/
│   │   │   ├── Planet.ts
│   │   │   ├── Rocket.ts
│   │   │   ├── PlanetAttachment.ts  # Point & Enemy ortak soyutlaması
│   │   │   ├── PointItem.ts
│   │   │   ├── EnemyItem.ts
│   │   │   └── Particle.ts
│   │   ├── interfaces/
│   │   │   ├── IAudioPlayer.ts
│   │   │   ├── IInputProvider.ts
│   │   │   ├── IRenderer.ts
│   │   │   └── IScoreRepository.ts
│   │   ├── systems/
│   │   │   ├── OrbitSystem.ts
│   │   │   ├── FlightSystem.ts
│   │   │   ├── CollisionSystem.ts
│   │   │   ├── SpawnSystem.ts
│   │   │   ├── DifficultySystem.ts
│   │   │   └── CameraSystem.ts
│   │   ├── state/
│   │   │   ├── GameState.ts         # Loading, Menu, Playing, GameOver
│   │   │   └── GameWorld.ts         # Anlık oyun dünyası durumu
│   │   └── GameEngine.ts            # Ana koordinatör
│   ├── infrastructure/      # Tarayıcı & dış dünya adaptörleri
│   │   ├── audio/
│   │   │   └── WebAudioPlayer.ts
│   │   ├── input/
│   │   │   └── BrowserInputProvider.ts
│   │   ├── render/
│   │   │   ├── AssetLoader.ts
│   │   │   └── CanvasRenderer.ts
│   │   └── storage/
│   │       └── LocalStorageScoreRepository.ts
│   ├── ui/                  # Menü, HUD, Ses/Tam Ekran kontrolleri
│   │   └── UIManager.ts
│   └── main.ts              # Composition Root (DI)
├── tests/                   # Vitest birim testleri
│   ├── OrbitSystem.test.ts
│   ├── CollisionSystem.test.ts
│   ├── SpawnSystem.test.ts
│   └── DifficultySystem.test.ts
├── docs/
│   ├── old-version/
│   └── implementation-plan.md
├── index.html
├── package.json
└── tsconfig.json
```

---

## 5. Aşamalı Uygulama Planı

### Faz 1: Çekirdek Oyun Mekaniği ve Frontend (Öncelikli)

1. **Adım 1.1 — Proje Kurulumu ve Asset Hazırlığı**
   - `package.json` (Vite, TypeScript, Vitest), `tsconfig.json` ve `index.html` oluşturulması.
   - `docs/old-version/zorbit.truncgil.com.tr/images` ve `media` içeriklerinin `public/assets/` altına kopyalanması.

2. **Adım 1.2 — Domain Modelleri ve Sabitler (`src/core/config`, `src/core/entities`)**
   - `GameConfig`: `1080x1920` sanal çözünürlük, başlangıç roket hızı (`1600`), maks roket hızı (`2200`), başlangıç gezegen dönüş hızı (`80°/s`), maks dönüş hızı (`210°/s`), kamera zoom sınırları (`0.7` - `1.4`), uçuş zaman aşımı (`3.0s`).
   - `Planet`, `Rocket`, `PointItem`, `EnemyItem`, `Particle` varlıklarının saf TypeScript sınıfları olarak yazılması.

3. **Adım 1.3 — Oyun Sistemleri ve Birim Testleri (`src/core/systems`, `tests/`)**
   - `OrbitSystem`: Açısal hız entegrasyonu ve sabitlenmiş nesnelerin kutupsal koordinat (`x + cos(θ)*r`, `y + sin(θ)*r`) güncellemeleri.
   - `FlightSystem`: Fırlatma vektörü, delta-time hareketi ve `3s` boşluk zaman aşımı.
   - `CollisionSystem`: Gezegen iniş kontrolü (opaklık > `%75`), `Point` (`+3`) ve `Enemy` (`-3`) çarpışma çözümleri.
   - `SpawnSystem`: Hedef gezegen konumlandırma, skora bağlı `Point`/`Enemy` üretimi ve eski gezegenlerin temizlenmesi.
   - `DifficultySystem`: Skor artışına göre hız/dönüş ölçekleme ve `score > 50` solma kuralı.
   - `CameraSystem`: Yumuşak kamera takibi ve dinamik zoom.
   - Tüm sistemler için `vitest` birim testlerinin yazılması ve doğrulanması.

4. **Adım 1.4 — Altyapı Adaptörleri (`src/infrastructure/`)**
   - `AssetLoader`: Tüm görsel ve seslerin ön yüklenmesi.
   - `CanvasRenderer`: `1080x1920` ölçekleme, kamera matrisi, gezegen/roket/parçacık çizimi ve `+3`/`-3` skor efektleri.
   - `WebAudioPlayer`: Ses çalma ve sessize alma (`mute`) durumu.
   - `BrowserInputProvider`: Mouse, Touch ve Klavye (`Space`) girişlerini tek bir `onLaunchIntent` olayına dönüştürme.
   - `LocalStorageScoreRepository`: En yüksek skoru yerel olarak saklama.

5. **Adım 1.5 — Ekranlar, Oyun Döngüsü ve Oynanabilir Sürüm (`src/ui`, `src/main.ts`)**
   - `Loading` -> `Menu` -> `Playing` -> `GameOver` geçişleri.
   - Menüde skor, en yüksek skor (yeni rekor bildirimi + `best.ogg`), Başlat, Ses Aç/Kapat ve Tam Ekran butonları.
   - Oyun içi HUD (canlı skor ve ilk atış için yönlendirme metni).

---

### Faz 2: Backend & Skor Kayıt Sistemi (Sonraki Aşama)

> **Not:** Faz 1 tamamlanıp oyun mekaniği eksiksiz doğrulandıktan sonra bu faza geçilecektir.

1. **Adım 2.1 — Backend API Tasarımı**
   - Oyuncu kaydı / takma ad güncelleme ve oturum başlatma (`POST /api/session`).
   - Skor doğrulamalı kayıt (`POST /api/scores`): Oturum süresi, maksimum olası skor hızı gibi temel anti-cheat kontrolleri ve parametreli veritabanı sorguları.
   - Liderlik tablosu (`GET /api/scores?period=weekly|all`).
2. **Adım 2.2 — Frontend Entegrasyonu (OCP & DIP ile)**
   - `ApiScoreRepository` sınıfının `IScoreRepository` arayüzünü uygulayacak şekilde yazılması.
   - `CompositeScoreRepository` ile önce yerel kayıt + arka planda sunucu senkronizasyonu.
   - Oyun içi veya modal olarak modern Liderlik Tablosu (`Leaderboard`) görünümü.
