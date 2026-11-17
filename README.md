<p align="center">
  <img src="public/assets/images/logo-sheet0.png" alt="Trunçgil Zorbit Logo" width="380" />
</p>

# Zorbit

Dönen gezegenlerin yörüngesinden roketi doğru zamanlamayla bir sonraki gezegene fırlatarak ilerlenen, **TypeScript + HTML5 Canvas 2D + Vite** tabanlı 2D arcade oyunu.

## Özellikler (Faz 1)

- **Yörünge ve Fırlatma Mekaniği:** Gezegen ekseninde dönen roketi tek dokunuş / tıklama / `Space` / `Yukarı Ok` ile fırlatma.
- **Dinamik Zorluk Eğrisi:** İniş yaptıkça artan gezegen dönüş hızı (`80°/s → 210°/s`), roket hızı (`1600 → 2200 px/s`) ve `50` skor sonrası aktif gezegenin solma (`fade`) mekaniği.
- **Ödül ve Engeller:** Skora bağlı olarak gezegen yörüngelerinde beliren `+3` puanlık yıldızlar (`Point`) ve `-3` puanlık dönen engeller (`Enemy`).
- **Dinamik Kamera:** Yörüngedeyken uzaklaşan (`0.7x`), uçuşta yakınlaşan (`1.4x`) yumuşak takip ve çarpışma/oyun bitişi sarsıntısı.
- **Ses ve Görsel Efektler:** Orijinal `.ogg` ses efektleri, sessize alma (`mute`) desteği, tam ekran modu, arka plan yıldızları, roket izi ve parçacık patlamaları.
- **Yerel Skor Kaydı:** `localStorage` üzerinden en yüksek skor (`score_zorbit`) saklama.

## Mimari (SOLID)

- `src/core/` — DOM ve tarayıcıdan tamamen bağımsız oyun çekirdeği (`GameEngine`, `GameWorld`, `OrbitSystem`, `FlightSystem`, `CollisionSystem`, `SpawnSystem`, `DifficultySystem`, `CameraSystem`, `ParticleSystem`).
- `src/core/interfaces/` — `IRenderer`, `IAudioPlayer`, `IInputProvider`, `IScoreRepository`, `IRandomProvider` soyutlamaları.
- `src/infrastructure/` — Tarayıcı adaptörleri (`CanvasRenderer`, `WebAudioPlayer`, `BrowserInputProvider`, `LocalStorageScoreRepository`).
- `src/ui/` — Menü, HUD ve kontrol arayüzü (`UIManager`).
- `tests/` — Çekirdek sistemler için `Vitest` birim testleri.

## Veri Yapısı (Data Structure)

Oyun çekirdeğindeki tüm durum ve varlıklar `src/core/state/` ve `src/core/entities/` altında tanımlanır:

### `GameWorld` (`src/core/state/GameWorld.ts`)
Oyunun tek doğruluk kaynağı (single source of truth) olan ana durum kapsayıcısıdır:
- `phase: GamePhase` — `'loading' | 'menu' | 'playing' | 'gameover'`
- `score: number` / `bestScore: number` / `isNewBest: boolean` — Anlık skor, en yüksek skor ve rekor bayrağı
- `difficultyDeg: number` — Gezegen dönüş hızı zorluk seviyesi (`80°/s → 210°/s`)
- `flightTimerSec: number` — Uzayda boşlukta geçirilen süre (`3.0s` aşılırsa oyun biter)
- `nextEntityId: number` — Artan varlık kimliği sayacı
- `planets: Planet[]` — Sahnedeki gezegenler
- `attachments: PlanetAttachment[]` — Gezegenlere bağlı ödül ve engeller
- `particles: Particle[]` — Görsel efekt parçacıkları
- `rocket: Rocket` — Oyuncu roketi
- `camera: CameraState` — Kamera durumu (`{ x, y, zoom, shakeIntensity }`)

### Temel Varlıklar (`src/core/entities/`)
- **`Planet`**: `id`, `x`, `y`, `radius`, `angleRad`, `rotationSpeedRad`, `active`, `opacity`, `isFadingOut`, `fadeDurationSec`
- **`Rocket`**: `x`, `y`, `angleRad`, `speed`, `pinnedPlanetId` (`number | null`), `orbitAngleRad`, `isFlying`
- **`PlanetAttachment`** *(soyut sınıf)* → **`PointItem`** (`kind: 'point'`, `+3` puan) ve **`EnemyItem`** (`kind: 'enemy'`, `-3` puan): `id`, `planetId`, `localAngleOffsetRad`, `orbitDistance`, `radius`, `x`, `y`, `angleRad`, `spinSpeedRad`, `collected`
- **`Particle`**: `kind` (`'star' | 'trail' | 'burst' | 'scorePopup'`), `x`, `y`, `vx`, `vy`, `scale`, `opacity`, `ageSec`, `lifetimeSec`, `angleRad`, `frame?` (`0 | 1`)
- **`Vector2` & `CircleBounds`**: Konum (`{ x, y }`) ve dairesel çarpışma sınırı (`{ x, y, radius }`)

### Kalıcı Veri (`src/infrastructure/storage/`)
- **`LocalStorageScoreRepository`**: En yüksek skoru tarayıcı `localStorage` üzerinde `score_zorbit` anahtarı ile tam sayı olarak saklar.

## Kurulum ve Çalıştırma

```bash
npm install
npm run dev
```

### Testler ve Derleme

```bash
npm test        # Vitest birim testlerini çalıştırır
npm run build   # TypeScript kontrolü + Vite production build
```

## Yol Haritası

- [x] **Faz 1:** Çekirdek oyun mekaniği, SOLID mimari, birim testleri ve yerel skor kaydı
- [ ] **Faz 2:** Backend skor kayıt API'si, oturum doğrulama ve liderlik tablosu
