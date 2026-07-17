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
**Tema:** Dark-only (bilinçli karar; light mode YOK ve eklenmeyecek)

---

## Renk Token'ları

| Rol | Değer | Tailwind | CSS Variable |
|-----|-------|----------|--------------|
| Zemin (derin) | `#070b1d` | `ink-deep` | `--bg-deep` |
| Zemin | `#0b1026` | `ink` | `--bg` |
| Zemin (açık uç) | `#101a3a` | `ink-light` | `--bg-light` |
| Yüzey (kart/panel) | `#10172f` | `surface` | `--surface` |
| Yüzey 2 (iç kutu) | `rgba(255,255,255,0.04)` | `surface-2` | `--surface-2` |
| Metin (birincil) | `#d8f7ee` | `mist` | `--text` |
| Metin (ikincil) | `rgba(216,247,238,0.7)` | `mist-2` | `--text-2` |
| Metin (soluk) | `rgba(216,247,238,0.5)` | `mist-3` | `--text-3` |
| Çizgi/kenarlık | `rgba(216,247,238,0.12)` | `line` | `--line` |
| Çizgi (güçlü) | `rgba(216,247,238,0.2)` | `line-strong` | `--line-strong` |
| Vurgu / CTA | `#6ee7b7` (emerald-300) | `accent` | `--accent` |
| Vurgu (açık) | `#a7f3d0` (emerald-200) | `accent-soft` | `--accent-soft` |
| Pozitif (kâr/artış) | `#6ee7b7` | `positive` | `--positive` |
| Negatif (zarar/satış) | `#fda4af` (rose-300) | `negative` | `--negative` |

**Varlık türü vurguları (konvansiyon, değişmez):**
- Döviz → `cyan-200` · Altın + "Yakında" rozetleri → `amber-200` · Premium/AI → `fuchsia` (yalnız rozet/gate, gradyan değil)

**Metin hiyerarşisi kuralı:** Yalnız 3 kademe kullan: `text-mist` (başlık/değer), `text-mist-2` (gövde/açıklama), `text-mist-3` (etiket/meta). ~~`text-mist/28`…`text-mist/85` gibi serbest opacity~~ **yasak** — /45 altı kademeler WCAG 4.5:1 kontrastı geçmez.

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

| Token | Değer | Kullanım |
|-------|-------|----------|
| `shadow-glow` | `0 0 44px rgba(40,230,164,0.18)` | Primary CTA, vurgulu kart |
| `shadow-card` | `0 20px 80px rgba(0,0,0,0.28)` | Glass kartlar |
| `.glass-card` | lacivert gradyan + liquid glass v2 (aşağıda) + `line` kenarlık | Tek kart stili; inline kopyalama yasak |

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
| `.btn-secondary` | İkincil aksiyon (line kenarlık + beyaz %5 zemin) |
| `.btn-ghost` | Sessiz aksiyon (yalnız hover zemini) |
| `.btn-danger` | Yıkıcı aksiyon (negative zemin); primary'den uzak konumlandır |
| `.badge-pill` | Rozet iskeleti; renk çifti çağıranda (örn. `border-emerald-300/20 bg-emerald-300/10 text-emerald-100`) |
| `.section-card` | Sayfa bölümü sarmalayıcısı (`rounded-section` + line + beyaz %2.5 zemin) |
| `.glass-card` | Kart zemini (blur'lu lacivert gradyan, geçiş gömülü) |
| `.glass-card-interactive` | Tıklanabilir kart: hover kalkış + ışıma + press (yalnız `.glass-card` ile) |
| `.glass-tint-{positive\|negative\|neutral\|premium}` | Tonlu cam — glass-card'a renk vermenin TEK yolu (utility ezilir) |
| `.glass-sheen` | Hover'da ışık süpürmesi — YALNIZ hero + premium vitrin kartı |
| `.animate-enter` | Kademeli liste girişi; `style={{ "--enter-index": Math.min(i, 12) }}` ile |
| `bg-hero` / `bg-cta` | Vitrin gradyanları (`--gradient-hero` / `--gradient-cta`) |

Örnek: `<Link href="/risk-test" className="btn btn-lg btn-primary shadow-glow">…</Link>`

**Gradyan kuralı:** Vurgu tonu değişebilir (varlık türü konvansiyonu) ama koyu taban her zaman
lacivert ailedir: `rgba(11,16,38,x)`. Yeşilimsi tabanlar (`rgba(12,24,22)`, `rgba(16,35,31)`) yasak.

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
- [ ] Focus görünür, klavye ile tüm akış yürünebilir
- [ ] `prefers-reduced-motion` ile test edildi
- [ ] 375px / 768px / 1024px / 1440px kırılımları kontrol edildi
- [ ] Yatay scroll yok; sticky header içeriği örtmüyor
- [ ] Fiyat/sayı alanları `tabular-nums`
- [ ] Yeni renk/radius değeri eklenmedi, token'dan seçildi
