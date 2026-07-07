# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint check
npm run typecheck    # tsc --noEmit
npm test             # Vitest run (~130 tests)
npm run test:watch   # Vitest watch mode

npx prisma db push   # Sync schema to database (no migrations, use for dev)
npx prisma studio    # Open Prisma GUI
```

Tests live in `tests/`. Pure functions (indicators, timeframe, TEFAS/format
normalizers, rate limiter, portföy aggregate + satış, iyzico imzaları, RSS parser)
doğrudan; DB'ye dokunan kritik yollar (`subscription.ts`, `alerts.ts`) `vi.mock`
ile prisma/mailer mock'lanarak test edilir. Config `vitest.config.mts` (`.mts`
çünkü `vite-tsconfig-paths` ESM-only ve `type: module` yok). `node` env — DOM yok.
CI (`.github/workflows/ci.yml`) runs prisma generate + typecheck + lint + test + build
on push/PR to `main`. Pages calling `auth()` are dynamic, so build needs no real DB.

**Dikkat (Windows):** dev sunucu çalışırken `npm run build` veya `npx prisma generate`
çalıştırma — paylaşılan `.next` bozulur / Prisma DLL kilitlenir. Önce sunucuyu durdur,
sonra `rm -rf .next` + yeniden başlat.

PostgreSQL must be running before starting the app. The service is named `postgresql17` and was registered manually with data at `C:\pgdata`:
```cmd
net start postgresql17
```

## Environment

`.env.example` tam envanterdir; önemliler:
- `DATABASE_URL` — PostgreSQL (db adı `fonly`)
- `AUTH_SECRET` — NextAuth secret
- `APP_URL` — dış URL; sitemap/robots/OG, şifre sıfırlama VE alarm e-posta linkleri buradan (`lib/site.ts` → `SITE_URL`)
- `AUTH_GOOGLE_ID/SECRET` — opsiyonel; ikisi de doluysa Google girişi aktifleşir
- `RESEND_API_KEY` + `MAIL_FROM` — e-posta; boşsa mailler konsola basılır (dev)
- `PAYMENT_PROVIDER` — `dev` (varsayılan) | `iyzico`; iyzico için `IYZICO_*` (bkz. billing)
- `CRON_SECRET` — `/api/cron/alerts` koruması
- `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` — boşsa Sentry tamamen no-op

Prod'a çıkış adımları ve go-live checklist: **`DEPLOY.md`** (VPS + Vercel yolları).

## Architecture

**Next.js 14 App Router** project. All routes live under `app/`. No `pages/` directory.

### Auth flow
- `auth.ts` — NextAuth v5 config. Two providers: `Credentials` (email+bcrypt) ve opsiyonel `Google`. JWT sessions via `PrismaAdapter`. Login brute-force koruması: IP başına 10 dk'da 15 deneme (`rateLimit` in authorize; aşımda `code=rate_limited`, LoginForm Türkçe mesaj gösterir).
- `middleware.ts` — Cookie-based guard for `/dashboard /risk-test /portfoy /hesap /alarmlar`. Protected server components ayrıca `auth()` + `redirect("/login")` yapar.
- Şifre sıfırlama: `/forgot-password` + `/reset-password`; token SHA-256 hash'li `PasswordResetToken` tablosunda, tek kullanımlık, 1 saat (`lib/auth/password-reset.ts`, mail: `lib/mail/mailer.ts`).
- `types/next-auth.d.ts` — Session/JWT'ye `user.id` + `isPremium` ekler (premium 5 dk'da bir DB'den tazelenir).

### Hata/SEO/PWA yüzeyi
- `app/error.tsx` (+ `global-error.tsx`, Sentry captureException) ve `app/not-found.tsx`; yavaş segmentlerde `loading.tsx` (`components/site/PageLoader`). Detay sayfaları geçersiz kodda `notFound()`.
- SEO: kök layout'ta `metadataBase` (APP_URL) + OG/Twitter kartları + title template `"%s — Fonly"` (çocuk sayfalar düz başlık yazar; premium `absolute` kullanır). Client liste sayfaları (`/doviz /altin /fonlar /hisseler`) metadata'yı minimal segment `layout.tsx`'ten alır.
- `app/sitemap.ts` — statik rotalar + rehber + yasal + 30 döviz + 11 altın + ~300 hisse + TEFAS fon kodları (~2600 URL; TEFAS çökerse fonsuz döner, build kırılmaz; revalidate 86400). `app/robots.ts` — private rotalar disallow.
- `app/manifest.ts` + `public/icons/icon-{192,512}.png` — PWA kurulabilirlik.
- Footer (`components/site/SiteFooter`) her sayfada; yasal sayfalara link verir.

### Yasal sayfalar
`data/legal.ts` (6 belge: yasal uyarı, kullanım şartları, gizlilik, KVKK, çerez, mesafeli satış) → `/yasal` + `/yasal/[slug]` (SSG). **Yayın öncesi:** `[ŞİRKET UNVANI]/[ADRES]/[E-POSTA]` yer tutucuları doldurulmalı + avukat incelemesi.

### API routes (özet)
| Route | Purpose |
|---|---|
| `POST /api/register` | Create user; bcrypt (cost 12); Zod; rate limit 5/10dk per IP |
| `POST /api/auth/forgot-password` / `reset-password` | Şifre sıfırlama akışı (nötr yanıt, rate-limit'li) |
| `PATCH /api/user/profile`, `POST /api/user/password`, `DELETE /api/user`, `GET /api/user/export` | Hesap yönetimi (KVKK export dahil) |
| `GET /api/market` | 30 döviz + 11 altın (truncgil) + BIST100+5 (Yahoo). Truncgil çökerse `value:"—"` — kasıtlı, fallback yok. Auth'lu kullanıcı için lazy alarm kontrolü tetikler |
| `GET /api/bist` | ~300 BIST, 20'li batch, 60s revalidate (ilk çağrı ~10s) |
| `GET /api/fonlar`, `GET /api/fon/[kod]` | TEFAS fon listesi (~2100, 3600s) + tek fon detayı |
| `GET /api/history/[slug]?range=` | Grafik zaman serisi (`1h|3a|1y|5y`); ortak mantık `lib/history/series.ts` |
| `GET /api/ohlc/[slug]?tf=` | TradingView candle verisi (fonlarda line-only) |
| `GET/POST/DELETE /api/watchlist` | İzleme listesi |
| `GET/POST/DELETE/PATCH /api/alerts` | Fiyat alarmları (PATCH `?id=` acknowledge) |
| `GET /api/cron/alerts` | Tüm kullanıcıların alarmlarını kontrol eder; `CRON_SECRET` zorunlu (`Bearer` veya `?secret=`) |
| `GET/POST/DELETE /api/portfolio` | Pozisyon+özet / işlem ekle (`side: buy\|sell`; satışta eldekinden fazlası 400) / sil |
| `GET /api/portfolio/history?range=3a\|1y` | Portföy değer serisi (değer + maliyet çizgisi) |
| `GET /api/financials/[symbol]` | Yahoo quoteSummary temelli finansallar |
| `GET/POST/DELETE /api/goals` | Birikim hedefleri |
| `POST /api/ai/[type]` | **Stub** — auth+premium doğrular, `coming_soon` döner (Anthropic SDK bağlanınca gerçek olacak; UI'daki "Yakında" rozetleri o zaman kaldırılır) |
| `POST /api/checkout`, `POST /api/webhooks/[provider]`, `POST /api/subscription/cancel`, `POST/GET /api/billing/iyzico/callback` | Billing (aşağıda) |

### Detail pages & subnav
`/doviz/[code]`, `/altin/[type]`, `/hisse/[symbol]`, `/fon/[kod]` — server component'ler; AssetHeader + AdvancedChart (Lightweight Charts v5) + alt sekmeler (`lib/chart/subnav.ts`). Hisse en kapsamlı (finansallar/profil/sahiplik/temettü/bölünmeler/haberler/tarihsel). **Fon'da "Dağılım/Portföy" sekmesi YOK** — 2026-04 TEFAS geçişi sonrası varlık dağılımı hiçbir JSON endpoint'inde yok; SSR sayfası Akamai korumalı, kazınamaz (borsapy stealth-Chromium kullanıyor).

`/fonlar` ve `/hisseler` client liste sayfaları; `/kategori/[key]` AI-sınıflandırılmış hisse listeleri (`StockAnalysis` tablosu, free=BIST30 top, premium=hepsi); `/rehber` 6 bölümlük eğitim içeriği (`data/guide.ts`); `/takvim` ekonomik takvim (Investing.com iframe widget'ı — kendi veri kaynağımız yok, attribution zorunlu).

### External data sources
- **truncgil** (`finans.truncgil.com/v4/today.json`) — canlı döviz+altın, dakikalık, tek nokta, fallback yok (kasıtlı). Düşük değerli paralar `displayPer` ile gösterilir.
- **Yahoo Finance v8 chart** — BIST anlık + geçmiş OHLC. `User-Agent: Mozilla/5.0` şart; v7 quote 401 döner, kullanma. `lib/yahoo/*` quoteSummary tabanlı finansallar/profil/sahiplik/temettü.
- **TEFAS v2** (`www.tefas.gov.tr/api/funds/*`) — POST JSON `{errorCode,errorMessage,resultList}` zarfı; `lib/tefas.ts` 3× retry + backoff (WAF boş gövde dönebilir). Endpoint keşfi: borsapy (MIT).
- **RSS haberleri** — `lib/news/sources.ts`: Bloomberg HT, Habertürk, AA Ekonomi, Dünya, Investing TR. Parser (`lib/news/rss.ts`) yalnızca RSS 2.0 `<item>`; Atom (NTV) desteklenmez. Yeni kaynak eklerken önce curl ile doğrula.
- Altın coin ağırlıkları `data/gold-types.ts:weightG` — sadece geçmiş grafik için (GC=F × USDTRY × gram); anlık fiyat truncgil'den direkt TL.

### Geçmiş seri altyapısı
`lib/history/series.ts` — slug→günlük TL serisi: ticker eşlemeleri (majör/egzotik döviz, altın sentezi, hisse, fon) + `alignMaps/buildGramAltinMap/buildExoticForexMap` + `fetchDailySeries(slug, range)`. Hem `/api/history/[slug]` hem `/api/portfolio/history` bunu kullanır — yeni tüketici buradan başlasın, route içine mantık kopyalama.

### Alarmlar (watchlist & alerts)
- **Watchlist**: Prisma `Watchlist`, `lib/store/watchlistStore.ts` (Zustand), optimistic yıldız.
- **Alerts**: `PriceAlert` modeli. İki kontrol yolu (`lib/chart/alerts.ts`):
  1. *Lazy*: `/api/market` her çağrıda auth'lu kullanıcı için (market snapshot'ıyla — fon ve çoğu hisse kapsanmaz).
  2. *Zamanlanmış*: `checkAllActiveAlerts()` — TÜM kullanıcılar, `getPricesForSlugs` ile (fon+tüm hisseler dahil). Prod'da `instrumentation.ts` 5 dk'da bir çalıştırır (`next.config.mjs`'te `instrumentationHook` açık); serverless'ta `/api/cron/alerts` + dış cron.
- Tetiklenince `triggeredAt` set + `active=false` + **e-posta** (`sendPriceAlertEmail`; RESEND_API_KEY yoksa konsol). Site içi `AlertBadge` dakikalık polling.

### Portfolio (portföy takibi)
`PortfolioLot`: her satır bir İŞLEM (`side: "buy"|"sell"`, quantity, unitCost=birim fiyat, boughtAt). **Ortalama maliyet yöntemi** (`lib/portfolio/aggregate.ts` — saf çekirdek, en çok test edilen kısım):
- Alım ağırlıklı ortalamayı günceller; satış o anki ortalamadan düşer → `realizedPnl`. Satışlar kronolojik işlenir — çağıran `at: boughtAt` eşlemesini YAPMALI (route + dashboard yapıyor).
- `aggregatePositions` kapanmış pozisyonları (qty≈0) listede tutar; `portfolioSummary` açık özet + `realizedPnl` toplamı; `portfolioValueSeries(lots, seriesBySlug)` değer+maliyet zaman serisi (backward-fill, `missingSlugs` raporu).
- API satışta eldekinden fazlasını reddeder. UI: `PortfolioClient` (özet kartları + değer grafiği `PortfolioValueChart` [Recharts, doğrulanmış palet #0eaf7b/#8b5cf6] + açık pozisyon tablosu + kapanan pozisyonlar + işlem kayıtları), `AddLotForm` (Alış/Satış toggle).
- `lib/portfolio/price.ts` — `getQuotesForSlugs/getPricesForSlugs`: kaynak bazında batched canlı fiyat. `lib/portfolio/asset.ts` — slug doğrulama/görüntüleme helpers.

### Hesap & profil
- **`/dashboard`** — hub: portföy değeri+K/Z (server-side), izleme listesi, alarm önizleme, hedefler (`Goal` modeli), risk profili, panel özelleştirme (`dashboardLayout` JSON).
- **`/hesap`** — Profil / Güvenlik (şifre değiştir; OAuth-only ilk şifre) / Abonelik / Tehlikeli bölge (KVKK veri indir + hesap sil, cascade).
- **`/alarmlar`** — alarm listesi/silme.

### Billing & subscriptions (provider-agnostic)
`PaymentProvider` soyutlaması (`lib/billing/provider.ts`): `createCheckout`, `verifyWebhook`, opsiyonel `cancelAtProvider`. Plan katalogu `lib/billing/plans.ts` (kuruş, `periodEndFrom` ay-sonu güvenli). Lifecycle `lib/billing/subscription.ts` (`applySubscriptionEvent` — test edilir, prisma mock). `isPremium()` DB'den okur; JWT 5 dk'da yansır.
- **dev** (`providers/dev.ts`): HMAC-imzalı token ile uçtan uca sahte akış. Prod'da `ALLOW_DEV_BILLING=1` yoksa hata.
- **iyzico** (`providers/iyzico.ts`, sandbox-ready): IYZWSv2 imza (HMAC-SHA256, testli), abonelik checkout formu embed sayfamızda render edilir (`/premium/iyzico-checkout` + `IyzicoFormEmbed` — hosted URL yok, script enjeksiyonu gerekir). Callback `/api/billing/iyzico/callback`: kullanıcı eşlemesi HMAC-imzalı `state` ile (cross-site POST çerez taşımaz), sonuç iyzico'dan sunucu-sunucu retrieve ile doğrulanır. Yenileme/başarısızlık webhook (`X-IYZ-SIGNATURE-V3`, timing-safe). **Bilinen eksik:** müşteri TCKN/fatura adresi placeholder — prod öncesi çözülmeli. İptal önce sağlayıcıda durdurulur, başarısızsa DB'ye yazılmaz.
- Yeni PSP = tek dosya + `getProvider` switch'i. Env örnekleri `.env.example`'da.

### AI (stub durumda)
`/api/ai/[type]` premium-gate'li stub (`coming_soon`). UI dürüst: premium sayfası AI kartlarında ve `AIButton`'da amber "Yakında" rozeti var — **motor bağlanınca bu rozetler kaldırılacak**. `StockAnalysis` tablosu `scripts/analyze-stocks.ts` batch'iyle dolar (`modelVersion="seed"` AI'sız ilk seed).

### Observability
Sentry (`@sentry/nextjs`): `sentry.{client,server,edge}.config.ts` + `instrumentation.ts` register + `onRequestError`. DSN env'leri boşsa tamamen devre dışı. `next.config.mjs` `withSentryConfig` ile sarılı (sourcemap upload kapalı — SENTRY_AUTH_TOKEN gelince açılır).

### Client-side market polling
`MarketSidebar`/`LiveMarketPanels` 5 sn'de bir `/api/market`; `BistPanel` 60 sn'de bir `/api/bist`. API route'ları dış çağrıları 60s revalidate ile cache'ler — client polling dış API'leri dövmez.

### Zustand stores
- `lib/store/chartStore.ts` — timeframe/chartType/indicators/showVolume (persist) + drawerOpen (volatile)
- `lib/store/watchlistStore.ts` — slug Set, mount'ta API'den yüklenir
- `lib/store/livePriceStore.ts` — canlı fiyat flaşları

### Database
Prisma + `db push` (migration yok). Modeller: `User` (riskProfile, monthlyIncome, dashboardLayout), `Watchlist`, `PriceAlert`, `PortfolioLot` (side!), `Goal`, `Subscription`, `PasswordResetToken`, `StockAnalysis` + NextAuth tabloları. `lib/prisma.ts` global singleton.

### Styling
Dark-only. Tokens: `ink` (#0b1026 bg), `mist` (#d8f7ee text, opacity modifier'larla), `surface` (#10172f), `line`, `shadow-glow`. `.glass-card` global class — inline kopyalama, class'ı kullan. Accent: emerald-200/300 (primary), cyan-200 (döviz), amber-200 (altın + "Yakında" rozetleri), rose-200/300 (negatif/satış), fuchsia (premium/AI).

### Chart library
- **Lightweight Charts v5** — `AdvancedChart` (candle/line/area + volume + göstergeler); pipeline `types/chart.ts` + `lib/chart/{timeframe,indicators,ohlc}.ts`. Fon = line-only.
- **Recharts** — `PriceChart` (normalize % karşılaştırma), `PortfolioValueChart` (değer vs maliyet). `AnalysisCard` kural-tabanlı Türkçe analiz (`lib/analysis.ts`, LLM yok).

### Shared lib utilities
- `lib/market-data.ts` — truncgil/Yahoo fetch helpers (self-fetch pattern YOK; route'lar ve server component'ler aynı helper'ları kullanır).
- `lib/rate-limit.ts` — in-memory fixed-window (`rateLimit`, `getClientIp`); tek instance. Kullanım: register, login, checkout, forgot-password. Multi-instance'ta Upstash'e taşınmalı.
- `lib/site.ts` — `SITE_URL` (APP_URL'den).
- `data/currencies.ts`, `data/gold-types.ts`, `data/bist-tickers.ts`, `data/guide.ts`, `data/legal.ts` — statik kataloglar.
