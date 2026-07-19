# Fonly Design System — Master File

> **KURAL:** Belirli bir sayfa üzerinde çalışırken önce `design-system/fonly/pages/[sayfa].md` dosyasına bak.
> Varsa oradaki kurallar bu dosyayı **ezer**; yoksa bu dosya geçerlidir.
>
> Bu dosya ui-ux-pro-max motorunun önerisinin Fonly kimliğiyle harmanlanmış halidir
> (2026-07-07 Faz 0 kararı). Jenerik öneriler değil, koddaki gerçek token'lar yazılıdır.
> Token kaynağı: `tailwind.config.ts` + `app/globals.css` — buradaki tablo onlarla senkron tutulmalı.

---

**Proje:** Fonly — döviz/altın/BIST/TEFAS takibi, finans bilgisi az kullanıcılar için sade Türkçe
**Kategori:** Fintech / yatırım takibi
**Tema:** Dual — koyu (varsayılan) + açık, next-themes ile `<html data-theme>` üzerinden tek
tuşla geçiş (2026-07-19 karar değişikliği; önceki "dark-only" Faz 0 kararının yerini aldı).
Koyu palet değişmeden kaldı; açık palet `:root[data-theme="light"]` override'ıyla eklendi.

---

## Renk Token'ları

Tüm token'lar `tailwind.config.ts`'te ilgili CSS değişkenine (`var(--x)`) işaret eder — koyu
değer `:root`'ta varsayılan, açık değer `:root[data-theme="light"]` override'ında. Bileşen
kodu değişmez (`bg-ink`, `text-mist`, `border-line` vb.); yalnız aktif `data-theme` değişir.

| Rol | Tailwind | CSS Variable | Koyu (varsayılan) | Açık |
|-----|----------|--------------|--------------------|------|
| Zemin (derin) | `ink-deep` | `--bg-deep` | `#070b1d` | `#eef2fa` |
| Zemin | `ink` | `--bg` | `#0b1026` | `#f6f8fc` |
| Zemin (açık uç) | `ink-light` | `--bg-light` | `#101a3a` | `#ffffff` |
| Zemin (sabit) | `ink-fixed` | — (sabit, tema-bağımsız) | `#0b1026` | `#0b1026` |
| Yüzey (kart/panel) | `surface` | `--surface` | `#10172f` | `#ffffff` |
| Yüzey 2 (iç kutu) | `surface-2` | `--surface-2` | `rgba(255,255,255,0.04)` | `rgba(11,16,38,0.035)` |
| Metin (birincil) | `mist` | `--text` | `#d8f7ee` | `#0b1026` |
| Metin (ikincil) | `mist-2` | `--text-2` | `rgba(216,247,238,0.7)` | `rgba(11,16,38,0.72)` |
| Metin (soluk) | `mist-3` | `--text-3` | `rgba(216,247,238,0.5)` | `rgba(11,16,38,0.6)` |
| Çizgi/kenarlık | `line` | `--line` | `rgba(216,247,238,0.12)` | `rgba(11,16,38,0.12)` |
| Çizgi (güçlü) | `line-strong` | `--line-strong` | `rgba(216,247,238,0.2)` | `rgba(11,16,38,0.2)` |
| Vurgu / CTA | `accent` | `--accent` | `#6ee7b7` (emerald-300) | `#047857` (emerald-700) |
| Vurgu (açık/hover) | `accent-soft` | `--accent-soft` | `#a7f3d0` (emerald-200) | `#065f46` (emerald-800) |
| Pozitif (kâr/artış) | `positive` | `--positive` | `#6ee7b7` | `#047857` |
| Negatif (zarar/satış) | `negative` | `--negative` | `#fda4af` (rose-300) | `#be123c` (rose-700) |

**`ink.fixed` (`text-ink-fixed`):** `ink` artık zemin rengine bağlı (`var(--bg)`) — açık modda
near-white olur. Parlak-ama-tema-bağımsız pastel bir zemin üzerinde duran metin (rozet/ikon
kutuları, `bg-emerald-300`/`bg-rose-300`/`bg-amber-300` gibi ham Tailwind fill'leri) her iki
modda da koyu kalmalı; bu durumda `text-ink` değil `text-ink-fixed` kullanılır. `.btn-primary`/
`.btn-danger`/`.btn-premium` gibi `accent`/`negative`/gradient token'ları üzerinde duran metin
ise `text-ink` kalır (bunlar zaten tema ile birlikte koyulaşıyor, kontrast korunuyor).

**Açık modda kontrast notu:** Pastel `emerald-300`/`rose-300` beyaz zeminde metin/dolgu olarak
kullanılamaz (~1.5:1) — bu yüzden `accent`/`positive`/`negative` açık modda emerald-700/rose-700
gibi doygun tonlara döner (WCAG ≥4.5:1 hedefiyle hesaplandı), pastel tonlar YALNIZ dark modda
kullanılabilir varsayımıyla kalır.

**Varlık türü vurguları (konvansiyon, değişmez):**
- Döviz → `cyan-200` · Altın + "Yakında" rozetleri → `amber-200` · Premium/AI → `fuchsia` (yalnız rozet/gate, gradyan değil)
- Bu ham Tailwind vurgu renkleri (emerald/rose/cyan/amber/fuchsia opacity tint'leri) henüz
  token'a bağlı değil — koyu zemine göre ayarlanmış, açık modda tek tek görsel QA ile
  düzeltiliyor (bkz. Teslim Öncesi Kontrol).

**Metin hiyerarşisi kuralı:** Yalnız 3 kademe kullan: `text-mist` (başlık/değer), `text-mist-2` (gövde/açıklama), `text-mist-3` (etiket/meta). ~~`text-mist/28`…`text-mist/85` gibi serbest opacity~~ **yasak** — /45 altı kademeler WCAG 4.5:1 kontrastı geçmez.

## Tema Geçişi (Light/Dark)

- **Mekanizma:** `next-themes` (`components/Providers.tsx`, `attribute="data-theme"`,
  `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`). İlk ziyarette OS
  tercihini takip eder; kullanıcı `components/site/ThemeToggle.tsx` ile tek tuşla açık/koyu
  arasında geçip localStorage'a kaydeder.
- **Toggle konumu:** `SiteHeader.tsx`'te `AuthNav`/`MobileMenu` yanında (her ekran boyutunda
  görünür), ayrıca `MobileMenu.tsx` drawer'ının üst satırında mirror edilir.
- Yeni bileşen yazarken tema kontrolü GENELDE gerekmez — `bg-ink`/`text-mist`/`border-line`/
  `.glass-card` gibi token tabanlı class'lar otomatik tema değiştirir. Yalnız chart kütüphaneleri
  gibi JS'e ham renk geçen yerlerde (`lightweight-charts`, `recharts`) `useTheme()` +
  `lib/hooks/useMounted.ts` guard'ıyla manuel dallanma gerekir (bkz. `AdvancedChart.tsx`,
  `PriceChart.tsx`, `PortfolioValueChart.tsx`).

## Tipografi

- **Font:** Inter (mevcut; Türkçe latin-ext desteği, `next/font` ile yüklü). IBM Plex Sans'a geçiş değerlendirildi, reddedildi.
- **Sayısal veri:** Fiyat, yüzde, tablo hücresi her yerde `tabular-nums` (layout shift önler).
- **Ağırlıklar:** Başlık 600, gövde 400, etiket/buton 500-600.
- **Gövde metni:** min 16px mobilde (iOS auto-zoom önler), `leading-6`/`leading-7`.

## Radius Ölçeği

| Token | Değer | Kullanım |
|-------|-------|----------|
| `rounded-card` | `1.25rem` | İçerik kartları (StockCard, FundCard, CategoryCard) |
| `rounded-panel` | `1.5rem` | Paneller, sidebar blokları, iç bölmeler |
| `rounded-section` | `1.75rem` | Sayfa bölümleri (`<section>` sarmalayıcıları) |
| `rounded-hero` | `2rem` | Hero / en üst düzey vitrin |
| `rounded-2xl` | `1rem` | Buton, ikon kutusu, input |

Serbest `rounded-[Xrem]` değeri **eklenmez**; bu dörtlüden seçilir.

## Gölge & Efekt

| Token | Değer (koyu / açık) | Kullanım |
|-------|----------------------|----------|
| `shadow-glow` | `var(--shadow-glow-color)`: `rgba(40,230,164,0.18)` / `rgba(4,120,87,0.18)` | Primary CTA, vurgulu kart |
| `shadow-card` | `var(--shadow-card-color)`: `rgba(0,0,0,0.28)` / `rgba(15,23,42,0.1)` | Glass kartlar |
| `.glass-card` | `--glass-fill-1`/`--glass-fill-2` gradyan dolgu (koyu: lacivert / açık: beyaz-near-white) + liquid glass v2 (aşağıda) + `line` kenarlık | Tek kart stili; inline kopyalama yasak |

**Liquid glass v2 (2026-07-08, Faz 0):** `.glass-card` artık şunları class içinden verir —
bileşene ayrıca `transition` utility'si eklemek gerekmez:

| CSS Variable | Değer | Ne yapar |
|--------------|-------|----------|
| `--glass-blur` | `20px` | Backdrop blur |
| `--glass-saturate` | `150%` | Zemindeki radial ışıkları cama sızdırır |
| `--glass-highlight` | `rgba(255,255,255,0.07)` | Üst kenar ışığı (inset box-shadow) |
| `--glass-glow` | `rgba(110,231,183,0.07)` | Hover'da `::after` radial ışıması |

- Geçiş (border-color/background-color/box-shadow/transform, `--dur-base` + ease-out) class'a gömülü.
- Hover ışıması `::after` opacity'siyle yapılır — box-shadow anime **edilmez** (paint maliyeti).
- `position: relative` `@layer components`'te; `absolute`/`sticky` kullanan kartlar (dropdown,
  mobil menü, sidebar) kendi konumunu korur.
- Bilinen sınır: `.glass-card` background/border/box-shadow'u utility'lerden **sonra** gelir;
  bu yüzden glass-card öğesine yazılan statik `ring-*`, `border-*`, `bg-*` utility'leri render
  olmaz (v1'den beri böyle; tarayıcıda computed-style ile doğrulandı). Ölü statik ring'ler
  2026-07-08 Faz 1'de silindi. Kart vurgusu gerekiyorsa utility ekleme — varyant class aç.
- ~~Bilinen kırık niyet~~ **Çözüldü (2026-07-08 Faz 2):** VerdictCard, `/premium` plan
  highlight ve Hero vurgulu slayt artık `glass-tint-*` varyantlarını kullanıyor.
- Kademeli giriş: `.animate-enter` + `--enter-index` (40ms/öğe, tavan 12). Fiyat flaşı
  tek yumuşak nabız (`useFlashOnChange` varsayılanı `blinkCount=1`, 300ms crossfade).

**Faz 3 kuralları (2026-07-08):**
- **Mobil blur kademesi:** ≤640px'te `--glass-blur: 14px`, `--glass-saturate: 130%`
  (GPU maliyeti; globals.css media query). Yeni blur değeri eklerken bu kademeyi koru.
- **Tonlu camda kontrast koruması:** `glass-tint-*` içindeki `.text-mist-3` otomatik
  `--text-2`'ye (0.7) yükselir — tonlu zeminde 0.5 kademe 4.5:1'i geçemez (~3.9:1).
  Bileşende istisna yönetme, sistem hallediyor.
- **Blur bütçesi:** Yoğun listeler (346 satırlık /hisseler, /fonlar) glass-card DEĞİL,
  blur'suz `border-white/8 bg-white/[0.025]` satır deseni kullanır — böyle kalmalı.
  Ana sayfa ~29 blur yüzeyiyle üst sınıra yakın; yeni sayfada 30+ eşzamanlı
  backdrop-filter'dan kaçın.

**`.glass-card-interactive` (Faz 1):** Tıklanabilir kartın tek hover reçetesi — class'ı ekle,
başka hover/transition utility'si yazma. Verdikleri: `cursor-pointer`, hover'da
`translateY(-2px)` + `line-strong` kenarlık + `::after` emerald ışıma, basılıyken
`scale(0.995)` (`--dur-fast`). Statik panel/form kartlarına **eklenmez**.

## Hareket

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--dur-fast` | `150ms` | Hover/press mikro etkileşim |
| `--dur-base` | `250ms` | Standart geçiş |
| `--dur-slow` | `400ms` | Panel/drawer, karmaşık geçiş üst sınırı |

- Easing: giriş `ease-out`, çıkış `ease-in`; linear yasak.
- `prefers-reduced-motion: reduce` global olarak saygı görür (globals.css); JS tabanlı otomatik döngüler de (Hero carousel) bu tercihi kontrol etmeli.
- Yalnız `transform`/`opacity` anime edilir; width/height/top/left yasak.

## Etkileşim Durumları

- **Focus:** Global `:focus-visible` halkası (2px `accent`, 2px offset) — kaldırılamaz.
- **Hover:** 150-300ms geçişle; layout kaydıran transform yasak (`-translate-y-0.5` üst sınır).
  Tıklanabilir glass kartlarda hover el yazması değil `.glass-card-interactive`'ten gelir.
- **Disabled:** opacity 0.4-0.5 + `cursor-not-allowed` + gerçek `disabled` attribute.
- Tıklanabilir her öğe `cursor-pointer`; dokunma hedefi min 44×44px (`min-h-12` butonlar).

## Bileşen Class'ları (globals.css `@layer components`)

Yeni UI yazarken utility kopyalamak yerine bunlar kullanılır:

| Class | Kullanım |
|-------|----------|
| `.btn` | Her butonun tabanı (flex, cursor, disabled durumu) — tek başına kullanılmaz |
| `.btn-lg` / `.btn-sm` | Boyut: 48px hero/form CTA · 44px satır içi aksiyon |
| `.btn-primary` | Tek primary CTA (accent zemin, ink metin); vurgu gerekirse `shadow-glow` eklenir |
| `.btn-secondary` | İkincil aksiyon (line kenarlık + beyaz %5 zemin; açık modda `[data-theme="light"]` override lacivert %4 zemine döner) |
| `.btn-ghost` | Sessiz aksiyon (yalnız hover zemini; açık mod override'ı var) |
| `.btn-danger` | Yıkıcı aksiyon (negative zemin); primary'den uzak konumlandır. Hover'ı açık modda `rose-800`'e override edilir (pastel `rose-200` beyazda okunmuyordu) |
| `.btn-premium` | Fuchsia→emerald gradyan CTA; açık modda daha doygun bir gradyana (`#c026d3`→`#047857`) override edilir |
| `.badge-pill` | Rozet iskeleti; renk çifti çağıranda (örn. `border-emerald-300/20 bg-emerald-300/10 text-emerald-100`) — açık modda tek tek QA gerekir (token'a bağlı değil) |
| `.section-card` | Sayfa bölümü sarmalayıcısı (`rounded-section` + line + beyaz %2.5 zemin; açık mod override'ı var) |
| `.glass-card` | Kart zemini (`--glass-fill-1/2` gradyan dolgu, geçiş gömülü) — dolgu ve gölge artık CSS değişkeni, tema ile otomatik değişir |
| `.glass-card-interactive` | Tıklanabilir kart: hover kalkış + ışıma + press (yalnız `.glass-card` ile) |
| `.glass-tint-{positive\|negative\|neutral\|premium}` | Tonlu cam — glass-card'a renk vermenin TEK yolu (utility ezilir); her varyantın `[data-theme="light"]` override'ı var (doygun/koyu hue ailesi) |
| `.glass-sheen` | Hover'da ışık süpürmesi — YALNIZ hero + premium vitrin kartı |
| `.animate-enter` | Kademeli liste girişi; `style={{ "--enter-index": Math.min(i, 12) }}` ile |
| `bg-hero` / `bg-cta` | Vitrin gradyanları (`--gradient-hero` / `--gradient-cta`) |

Örnek: `<Link href="/risk-test" className="btn btn-lg btn-primary shadow-glow">…</Link>`

**Gradyan kuralı:** Vurgu tonu değişebilir (varlık türü konvansiyonu) ama koyu taban her zaman
lacivert ailedir: `rgba(11,16,38,x)`. Yeşilimsi tabanlar (`rgba(12,24,22)`, `rgba(16,35,31)`) yasak.

**Açık mod istisnası — Hero/RegisterCTA:** `--gradient-hero`/`--gradient-cta` (`bg-hero`/`bg-cta`)
kasıtlı olarak her iki modda da AYNI koyu değeri kullanır, `[data-theme="light"]` override'ı
YOK. Tek tüketicileri `Hero.tsx` ve `RegisterCTA.tsx`, ikisi de üzerine ham `text-white` yazıyor
— bilinçli bir "koyu spotlight kart" adası. Bu iki bileşene light-mode gradyanı eklenmeye
çalışılmamalı; üzerlerindeki `text-white` de bu yüzden bozuk değil.

## Sayfa Deseni

**Pattern:** Real-Time / Operations (canlı veri önde) — Hero + canlı piyasa panelleri + kategoriler + güven sinyalleri. Primary CTA: hero'da tek adet (Risk Testi); her ekranda tek primary CTA kuralı.

---

## Anti-Pattern'ler (kullanma)

- ❌ Oyuncu/playful görünüm — ürün güven satar
- ❌ AI mor/pembe gradyanları (fuchsia yalnız premium rozeti)
- ❌ Emoji ikon — yalnız Lucide SVG
- ❌ Bileşen içine ham hex/rgba gömme — token kullan
- ❌ `text-mist/XX` serbest opacity — 3 kademeli hiyerarşi
- ❌ Layout kaydıran hover, görünmez focus, 500ms+ animasyon
- ❌ Ücret/premium koşullarını belirsiz bırakan UI

## Teslim Öncesi Kontrol

- [ ] Metin kontrastı ≥4.5:1 (koyu zeminde ayrıca doğrula)
- [ ] Açık modda da kontrol edildi (`data-theme="light"` toggle ile) — özellikle ham
      `emerald`/`rose`/`cyan`/`amber`/`fuchsia` opacity tint'leri token'a bağlı değil
- [ ] Focus görünür, klavye ile tüm akış yürünebilir
- [ ] `prefers-reduced-motion` ile test edildi
- [ ] 375px / 768px / 1024px / 1440px kırılımları kontrol edildi
- [ ] Yatay scroll yok; sticky header içeriği örtmüyor
- [ ] Fiyat/sayı alanları `tabular-nums`
- [ ] Yeni renk/radius değeri eklenmedi, token'dan seçildi
