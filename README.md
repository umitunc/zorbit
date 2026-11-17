# Zorbit

Dönen gezegenlerin yörüngesinden roketi doğru zamanlamayla bir sonraki gezegene fırlatarak ilerlenen, **TypeScript + HTML5 Canvas 2D + Vite** tabanlı 2D arcade oyunu.

Eski Construct 2 sürümünün ([docs/old-version/zorbit.truncgil.com.tr](docs/old-version/zorbit.truncgil.com.tr)) mekanikleri incelenerek **SOLID prensiplerine** uygun, modüler ve test edilebilir bir mimariyle yeniden yazılmıştır. Detaylı mimari plan için [docs/implementation-plan.md](docs/implementation-plan.md) dosyasına bakabilirsiniz.

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
