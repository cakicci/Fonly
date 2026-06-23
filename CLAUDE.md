# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint check
npm run typecheck    # tsc --noEmit
npm test             # Vitest run (unit tests for pure lib/data functions)
npm run test:watch   # Vitest watch mode

npx prisma db push   # Sync schema to database (no migrations, use for dev)
npx prisma studio    # Open Prisma GUI
```

Tests live in `tests/` and cover pure functions only (indicators, timeframe helpers,
TEFAS/format normalizers, rate limiter). Config is `vitest.config.mts` (`.mts` because
`vite-tsconfig-paths` is ESM-only and there is no `type: module`). `node` env — no DOM.
CI (`.github/workflows/ci.yml`) runs prisma generate + typecheck + lint + test + build
on push/PR to `main`. Pages calling `auth()` are dynamic, so build needs no real DB.

PostgreSQL must be running before starting the app. The service is named `postgresql17` and was registered manually with data at `C:\pgdata`:
```cmd
net start postgresql17
```

## Environment

Required `.env` variables (see `.env.example`):
- `DATABASE_URL` — PostgreSQL connection string (db name: `fonly`)
- `AUTH_SECRET` — NextAuth secret
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — optional; Google OAuth only activates if both are set

## Architecture

**Next.js 14 App Router** project. All routes live under `app/`. No `pages/` directory.

### Auth flow
- `auth.ts` — NextAuth v5 config. Two providers: `Credentials` (email+bcrypt) and optional `Google`. JWT sessions via `PrismaAdapter`.
- `middleware.ts` — Cookie-based guard (checks session cookie names directly, not via NextAuth helpers) for `/dashboard` and `/risk-test`.
- `types/next-auth.d.ts` — Extends Session and JWT to include `user.id`.
- Protected server components call `auth()` and `redirect("/login")` themselves — middleware is a lightweight first-pass only.

### API routes
| Route | Purpose |
|---|---|
| `POST /api/register` | Create user; hashes password with bcrypt (cost 12); Zod validation |
| `PATCH /api/user/profile` | Save `riskProfile` and/or `monthlyIncome` for the logged-in user |
| `GET /api/market` | Aggregate live prices: 30 currencies + 11 gold types (truncgil, dakikalık + alış/satış) + Yahoo Finance v8 (BIST 100 + 5 stocks). Returns `MarketResponse` with `doviz`, `altin` (compat: standart 4), `tumAltin` (genişletilmiş 11), `borsa`. Truncgil çökerse ilgili kayıtlar `value: "—"` döner — alternatif fallback yok (kasıtlı: değerler bir kaynaktan diğerine zıplamasın diye). |
| `GET /api/bist` | Fetches all ~300 BIST tickers in batches of 20 from Yahoo Finance v8 chart. 60s `revalidate`. Slow on first call (~10s). |
| `GET /api/fonlar` | All TEFAS investment funds (~2100) with risk + multi-period returns. Calls `fonGetiriBazliBilgiGetir`. 3600s `revalidate`. |
| `GET /api/fon/[kod]` | Single fund detail — price, fund size, investor count + period returns from cached list. |
| `GET /api/history/[slug]?range=` | Historical time-series for charts. `slug` format: `doviz-USD`, `altin-gram`, `hisse-THYAO`, `fon-AAK`. `range`: `1h` \| `3a` \| `1y` \| `5y`. Returns 260 daily points + gram altın comparison. 300s `revalidate`. **For `fon-*`** maps to TEFAS `periyod` enum (13/3/12/60). Used by `PriceChart` (alt grafik). |
| `GET /api/ohlc/[slug]?tf=` | **YENİ — TradingView için OHLC candle verisi.** Yahoo Finance'tan open/high/low/close/volume çeker; fonlarda TEFAS NAV serisini line-only Candle olarak döner. `tf`: `1G` (5dk intraday) \| `1H` (30dk × 5g) \| `1A` \| `3A` \| `1Y` \| `5Y` \| `MAX` (10y haftalık). 60s `revalidate`. Yanıt `OhlcResponse`: `{slug, name, timeframe, candles, isLineOnly}`. |
| `GET/POST/DELETE /api/watchlist` | Auth'lu kullanıcının izleme listesi. Prisma `Watchlist` modeli. POST body `{slug}`, DELETE `?slug=`. Anonim 401 alır. |
| `GET/POST/DELETE/PATCH /api/alerts` | Fiyat alarmları. POST `{slug, condition: "above"|"below", threshold}`. PATCH `?id=` ile acknowledge. Lazy check `/api/market` her çağrıda auth'lu user için `lib/chart/alerts.ts` üzerinden yapılır — eşik aşıldığında `triggeredAt` set edilir. Cron yok. |

### Detail pages (server components)
| Route | Purpose |
|---|---|
| `/doviz` | Döviz listesi — sekme: "Yaygın 8" / "Diğer Dövizler" (22). Arama + 5sn polling. |
| `/doviz/[code]` | Currency detail: AssetHeader + AdvancedChart (TradingView candle) + alış/satış/makas + alt tab'lar (Karşılaştırma/Analiz) |
| `/altin` | Altın listesi — sekme: "Standart" / "Antika" / "Ayar" / "Gümüş". Arama + 30sn polling. |
| `/altin/[type]` | Gold type detail: AssetHeader + alış/satış/makas + AdvancedChart (standart 4 için). Antika/ayar/gümüş Yahoo'da yok — sadece anlık fiyat. |
| `/hisse/[symbol]` | BIST stock detail: AssetHeader + AdvancedChart + alt tab'lar (Karşılaştırma/Analiz/Bilgi) |
| `/fonlar` | All TEFAS funds list page (client). Search (Turkish-normalized), category filter, sort by 1y/YTD/1m/code. |
| `/fon/[kod]` | Fund detail: AssetHeader + AdvancedChart (line-only, candle disabled — TEFAS sadece NAV) + 4'lü stat satırı + 7 dönem getirisi + alt tab'lar |

All detail pages are server components that fetch current price directly from truncgil (döviz/altın), Yahoo Finance (hisse), or TEFAS (fon). `PriceChart` and `AnalysisCard` are imported as `"use client"` components.

### External data sources

**Canlı fiyat (döviz + altın):**
- **truncgil** (`finans.truncgil.com/v4/today.json`) — Tek endpoint, auth yok, dakikalık. 30 döviz + 11 altın türü (gram/çeyrek/yarım/tam + Cumhuriyet/Ata/Reşat/Hamit + 14ayar/18ayar + gümüş) + ONS + BIST endeksi. Her kayıt `{Buying, Selling, Change, Type}` döner. **Tek nokta — fallback yok.** Çökerse ilgili kayıtlar `value: "—"` döner; bu kasıtlı (farklı kaynaklar arası tutarsızlık/zıplama yaratmamak için). Truncgil JPY/IDR/HUF/IQD gibi düşük değerli paraları gram başına döner; `displayPer` ile UI'da 100/1000 katı gösterilir.

**Geçmiş veri (grafikler — `/api/history`) + BIST anlık (`/api/bist`):**
- **Yahoo Finance v8 chart** (`query1.finance.yahoo.com/v8/finance/chart/{ticker}`) — Individual ticker OHLC. Unofficial, no key; requires `User-Agent: Mozilla/5.0`. The v7 quote endpoint (`/v7/finance/quote`) returns 401 — do not use it. Yahoo'da Cumhuriyet/14 ayar/gümüş tickerları yok; bu türlerde geçmiş grafik gösterilmiyor (sayfada koşullu render).
- **TEFAS v2** (`www.tefas.gov.tr/api/funds/*`) — POST JSON, returns `{errorCode, errorMessage, resultList}` envelope. Endpoints: `fonGetiriBazliBilgiGetir` (all funds + returns), `fonBilgiGetir` (single detail), `fonFiyatBilgiGetir` (history; only fixed `periyod` enum 13/1/3/6/12/36/60). Replaced the legacy `/api/DB/BindFundInfo` (404 since 2026-04 Next.js migration). WAF can return empty bodies on HTTP 200 — `lib/tefas.ts` retries 3× with exponential backoff. Endpoint discovery credit: [borsapy](https://github.com/saidsurucu/borsapy) (MIT).

Turkish gold coin weights (`data/gold-types.ts:weightG`): çeyrek = 1.748g, yarım = 3.496g, tam = 6.992g. Bunlar sadece `/api/history` grafiği için kullanılır (Yahoo GC=F oz fiyatını × USDTRY × weight ile coin'e dönüştürür). Anlık fiyat truncgil'den direkt TL olarak gelir; ağırlık çevirisi yapılmaz.

### Advanced chart system (TradingView-style)
Tüm detay sayfalarının üst kısmında `components/chart/AdvancedChart.tsx` — Lightweight Charts v5 ile candle/line/area + volume + crosshair + custom OHLC tooltip. Alt kısımda eski `PriceChart` (gram altın karşılaştırması) `Tabs` içinde "Karşılaştırma" sekmesinde duruyor.

**Pipeline:**
- `/api/ohlc/[slug]?tf=` → Yahoo OHLC (`lib/chart/ohlc.ts`) veya TEFAS line (`fetchFundHistory`)
- `types/chart.ts` → `Candle`, `Timeframe`, `ChartType`, `IndicatorKey`, `OhlcResponse`
- `lib/chart/timeframe.ts` → `1G|1H|1A|3A|1Y|5Y|MAX` → Yahoo `range`/`interval`, TEFAS `periyod`. `parseAssetSlug` ve `supportsCandles` helper'ları
- `lib/chart/indicators.ts` → SMA/EMA/RSI/MACD/Bollinger pure functions (Candle[] → IndicatorPoint[])
- `components/chart/ChartToolbar.tsx` → timeframe sekmeleri, chart type (candle/line/area), volume toggle, indicator menüsü, fullscreen
- `components/chart/ChartSection.tsx` → fetch + state orkestratörü
- `components/chart/AssetHeader.tsx` + `AssetHeaderActions.tsx` → fiyat, değişim badge'i, watchlist + alarm butonları
- `components/chart/Tabs.tsx` → alt section sekme yapısı

**Fon kısıtı:** TEFAS sadece günlük NAV verir → `isLineOnly: true` döner → candle/volume disabled, line zorla.

### Watchlist & Alerts
- **Watchlist** (Prisma `Watchlist` model): `userId + slug` unique. `lib/store/watchlistStore.ts` (Zustand, in-memory) + `/api/watchlist`. AssetHeader yıldız butonu optimistic update.
- **Alerts** (Prisma `PriceAlert` model): `userId + slug + condition("above"|"below") + threshold`. Lazy check: `/api/market` her çağrıda auth'lu user için `lib/chart/alerts.ts` aktif alarmları kontrol eder (cron yok, response geciktirmez — `void`). Tetiklenince `triggeredAt` set + `active=false`.
- **Bildirim:** `components/chart/AlertBadge.tsx` (layout'ta sabit) — dakikada bir `/api/alerts` polling, tetiklenen ve onaylanmamışları sayar. Modal'dan "Tamam" → PATCH `acknowledged=true`.

### Portfolio (portföy takibi)
Kullanıcı alımlarını kaydeder (`PortfolioLot`: her satır bir alım — slug + quantity + unitCost + boughtAt), canlı fiyatla kâr/zarar görür. `/portfoy` (middleware korumalı + sayfa `auth()` redirect). slug biçimi watchlist/alert ile aynı.
- `lib/portfolio/aggregate.ts` — **saf çekirdek**: `aggregatePositions(lots, prices)` slug'a göre gruplar (ağırlıklı ort. maliyet + K/Z; fiyat null → value/pnl null), `portfolioSummary()` toplar (fiyatsızları hariç tutar, `missingPrices` raporlar). Test edilen kısım burası.
- `lib/portfolio/price.ts` — `getPricesForSlugs(slugs)`: kaynak bazında batched canlı fiyat (tek truncgil çağrısı doviz+altın; Yahoo `${SYM}.IS` hisse; TEFAS `sonFiyat` fon). Çekilemeyen → null.
- `lib/portfolio/asset.ts` — `normalizeAssetSlug` (statik veriye karşı doğrular; fon biçimsel), `assetDisplayName`, `assetHref`, `assetTypeOf`. UI + API ortak.
- `GET/POST/DELETE /api/portfolio` — GET pozisyon+özet, POST Zod-doğrulanmış lot, DELETE `?id=` (deleteMany + userId şartı). `components/portfolio/{PortfolioClient,AddLotForm}.tsx` — AddLotForm datalist ile arama (ekstra bağımlılık yok).

### Hesap & profil
İki ayrı yüzey (middleware korumalı: `/dashboard /hesap /alarmlar /portfoy /risk-test`).
- **`/dashboard` = Genel Bakış (hub)** — gerçek veriyle: portföy değeri+K/Z (server-side `getPricesForSlugs`+`aggregate`), izleme listesi chip'leri, aktif alarm önizleme, premium rozeti, risk profili, aylık bütçe önerisi. Statik "altın kıyası" kartı kaldırıldı.
- **`/hesap` = Hesabım** — `Tabs` ile sekmeli: Profil (ad düzenle), Güvenlik (şifre değiştir/belirle + Google bağlı mı), Abonelik (`ManageSubscription` veya yükselt CTA), Tehlikeli bölge (veri indir + hesap sil). `components/account/*`.
- **`/alarmlar`** — tüm fiyat alarmlarını listele/sil (`components/alerts/AlertsManager.tsx`, `/api/alerts` GET/DELETE).
- **Hesap API'leri:** `POST /api/user/password` (bcrypt; mevcut şifre varsa doğrular, OAuth-only ise ilk şifreyi belirler; rate-limit'li), `PATCH /api/user/profile` (artık `name` de kabul eder), `DELETE /api/user` (cascade siler → client signOut), `GET /api/user/export` (KVKK JSON, hassas alanlar hariç).

### Zustand stores
- `lib/store/chartStore.ts` — timeframe/chartType/indicators/showVolume (persist) + drawerOpen (volatile)
- `lib/store/watchlistStore.ts` — slug Set, load/add/remove API senkronu (persist edilmez, mount'ta yüklenir)

### Database
Single `User` model with `riskProfile` (string: `"low"|"medium"|"high"|null`) and `monthlyIncome` (Int?), plus `Watchlist` and `PriceAlert` relations. Uses `prisma db push` (no migration files). `lib/prisma.ts` uses the global singleton pattern for dev hot-reload safety.

### Billing & subscriptions (provider-agnostic)
Ödeme tamamen `PaymentProvider` soyutlamasına (`lib/billing/provider.ts`) bağlı — UI/DB tarafı PSP'den habersiz. Yeni PSP = `PaymentProvider` implement eden tek dosya + `getProvider` switch'ine kayıt. Aktif sağlayıcı `PAYMENT_PROVIDER` env'i (varsayılan `dev`).
- `lib/billing/plans.ts` — **plan katalogu (tek doğruluk kaynağı)**: monthly/yearly, kuruş fiyat, `periodEndFrom()` (ay-sonu taşması güvenli). Premium sayfası buradan okur.
- `lib/billing/providers/dev.ts` + `dev-token.ts` — gerçek PSP olmadan uçtan uca akış. `createCheckout` HMAC-imzalı token taşıyan `/premium/dev-checkout` sayfasına yönlendirir; o sayfa `/api/webhooks/dev`'e POST atar; `verifyWebhook` token'ı doğrular. **Prod'da `ALLOW_DEV_BILLING=1` yoksa hata fırlatır** (bedava premium dağıtmasın).
- `lib/billing/subscription.ts` — `applySubscriptionEvent()` normalize olayları (`activated/renewed/canceled/past_due`) `Subscription` upsert'ine çevirir. `isPremium()` (lib/auth/premium.ts) bu tablonun gerçeğini okur; JWT 5dk'da yansır.
- Route'lar: `POST /api/checkout` (auth + plan doğrula + rate-limit → redirectUrl), `POST /api/webhooks/[provider]` (imza → event → DB), `POST /api/subscription/cancel` (`cancelAtPeriodEnd=true`, erişim dönem sonuna kadar sürer).
- UI: `components/billing/CheckoutButton.tsx` (CTA, 401→login), `ManageSubscription.tsx` (premium ise iptal). Premium sayfası premium kullanıcıya plan kartları yerine yönetim gösterir.
- **PSP bağlanınca:** `lib/billing/providers/iyzico.ts` yaz, `getProvider`'a ekle, `.env`'e anahtar + webhook secret, `PAYMENT_PROVIDER=iyzico`. Başka hiçbir şey değişmez.

### Client-side market polling
`MarketSidebar` and `LiveMarketPanels` are `"use client"` components that poll `/api/market` every **5 seconds** via `setInterval`. `BistPanel` polls `/api/bist` every **60 seconds** (batch fetch is expensive). The API routes themselves cache external calls for 60s via `next: { revalidate: 60 }`, so external APIs are not hit on every client poll.

### Styling
Dark-only design. Custom Tailwind tokens:
- `ink` (#0b1026) — page background
- `mist` (#d8f7ee) — primary text tint; used with opacity modifiers (`text-mist/64`)
- `surface` (#10172f)
- `line` — border color
- `shadow-glow` — emerald glow effect

`.glass-card` is a global CSS class (defined in `globals.css`) for the frosted-glass card style used throughout. Do not replicate its styles inline — use the class.

Accent palette: emerald-200/300 (primary), cyan-200 (currencies), amber-200 (gold), rose-200/300 (negative change).

### Chart library
**Recharts** (`recharts`) — `PriceChart` component renders `AreaChart` with `ResponsiveContainer`. Both the main asset and comparison (gram altın or USD) series are normalized to % change from period start so different-scale assets can be overlaid. `AnalysisCard` is a separate `"use client"` component that fetches `1y` history and generates rule-based Turkish analysis text via `lib/analysis.ts`.

### Shared lib utilities
- `lib/market-data.ts` — external fetch helpers: `fetchTruncgilToday` (canlı döviz+altın), `fetchYahooChart` (anlık BIST), `fetchYahooHistory` (geçmiş grafik). `getTruncgilAsset` envelope'tan tek varlık çıkarır (Selling ≤ 0 ise null). Used by both API routes and server components — no self-fetch pattern.
- `lib/tefas.ts` — TEFAS v2 client (`fetchAllFundReturns`, `fetchFundDetail`, `fetchFundHistory`). Includes `normalizeTurkish` for accent-insensitive search and `tefasRiskToCategory` mapping TEFAS 1–7 → `low/medium/high`.
- `lib/analysis.ts` — `generateAnalysis()` produces an array of Turkish sentences from change percentages. No LLM needed. Type union now includes `"fon"`.
- `lib/rate-limit.ts` — in-memory fixed-window limiter (`rateLimit(key, {limit, windowMs})`) + `getClientIp(req)`. Per-instance only (no Redis) — fine for single-server, slows abuse. Applied to `POST /api/register` (5 / 10dk per IP → 429 + `Retry-After`). `now` injectable for tests.
- `data/currencies.ts` — `CURRENCIES` (30 döviz) + `CURRENCY_MAP` + `MAJOR_CURRENCIES`/`OTHER_CURRENCIES`. Her kayıtta `category: "major" | "other"` var; `/doviz` sekme yapısı bunu kullanıyor. Düşük değerli paralar (JPY/IDR/HUF/IQD) için `displayPer` 100 veya 1000.
- `data/gold-types.ts` — `GOLD_TYPES` (11 tür) + `GOLD_TYPE_MAP` + `GOLD_CATEGORY_LABELS` + helper filtre dizileri. Her tür `truncgilKey` (örn. `"CEYREKALTIN"`, `"14AYARALTIN"`) ile truncgil yanıtına eşlenir. `weightG` opsiyonel; yalnızca standart 4'te tanımlı (Yahoo geçmiş grafiği için).

### Static data
`data/funds.ts` and `data/stocks.ts` — mock financial data used on the landing page cards. `data/bist-tickers.ts` — static list of ~300 BIST symbols and display names fed to the `/api/bist` batch fetcher.
