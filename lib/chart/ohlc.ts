import type { Candle, Timeframe } from "@/types/chart"
import { YAHOO_PARAMS, TEFAS_PERIYOD, YAHOO_BUCKET_BY } from "./timeframe"
import { fetchFundHistory } from "@/lib/tefas"
import { GOLD_TYPE_MAP } from "@/data/gold-types"

const TROY_OZ_GRAMS = 31.1035

/**
 * Ardışık `n` bar'ı tek OHLC bar'a birleştirir.
 * open = ilkinin open, close = sonuncunun close, high = max, low = min, volume = toplam.
 * Yahoo 5 saatlik interval'ı desteklemediği için 60m bar'ları 5×'leyerek üretiyoruz.
 */
function bucketCandles(candles: Candle[], n: number): Candle[] {
  if (n <= 1 || candles.length === 0) return candles
  const out: Candle[] = []
  for (let i = 0; i < candles.length; i += n) {
    const slice = candles.slice(i, i + n)
    if (slice.length === 0) continue
    let high = slice[0].high
    let low  = slice[0].low
    let vol  = 0
    for (const c of slice) {
      if (c.high > high) high = c.high
      if (c.low  < low)  low  = c.low
      vol += c.volume
    }
    out.push({
      time:   slice[0].time,
      open:   slice[0].open,
      high,
      low,
      close:  slice[slice.length - 1].close,
      volume: vol,
    })
  }
  return out
}

/**
 * OHLC veri çekme. Asset tipine göre Yahoo Finance v8 chart veya TEFAS'a gider.
 *
 * Yahoo v8 chart `indicators.quote[0]` içinde open/high/low/close/volume dizileri verir.
 * Boş slot'lar (null) atılır — bazı haftasonu/tatil günlerinde Yahoo null doldurur.
 *
 * TEFAS sadece NAV verir; open=high=low=close yapıp candle gibi gösteririz ama
 * UI bu durumu `isLineOnly` flag'iyle bilir ve line render eder.
 */

const YAHOO_FOREX_TICKER: Record<string, string> = {
  USD: "USDTRY=X", EUR: "EURTRY=X", GBP: "GBPTRY=X",
  CHF: "CHFTRY=X", JPY: "JPYTRY=X", CNY: "CNYTRY=X",
  CAD: "CADTRY=X", AUD: "AUDTRY=X",
}

/**
 * Exotic currencies don't have a direct `<CODE>TRY=X` pair on Yahoo. They do
 * have `<CODE>=X` which is the USD/<CODE> rate (e.g. RUB=X = 71.09 means
 * 1 USD = 71.09 RUB). Combining with `USDTRY=X` gives us the <CODE>/TRY rate
 * the same way `GC=F × USDTRY=X` gives us gold's TL value.
 *
 * Formula: try_per_unit = usdtry / usd_per_unit
 */
const YAHOO_FOREX_CROSS: Record<string, string> = {
  RUB: "RUB=X", SAR: "SAR=X", AED: "AED=X", KWD: "KWD=X", BHD: "BHD=X",
  LYD: "LYD=X", ILS: "ILS=X", IQD: "IQD=X", SEK: "SEK=X", NOK: "NOK=X",
  DKK: "DKK=X", PLN: "PLN=X", CZK: "CZK=X", HUF: "HUF=X", RON: "RON=X",
  ZAR: "ZAR=X", INR: "INR=X", IDR: "IDR=X", MXN: "MXN=X", BRL: "BRL=X",
  ARS: "ARS=X", NZD: "NZD=X",
}

// Standart altın için Yahoo `GC=F` (USD/ons spot futures) + `USDTRY=X` paralel
// çekiliyor; her bar TL/gram'a çevriliyor (fetchGoldGramTL).
// Hangi türler destekleniyor: GOLD_TYPE_MAP'te `weightG` tanımlı olanlar
// (gram/çeyrek/yarım/tam). Antika/ayar/gümüş Yahoo'da yok.

/**
 * Bir asset slug'ı candle (intraday OHLC) destekliyor mu?
 * - hisse: her zaman true
 * - doviz: sadece YAHOO_FOREX_TICKER'da olanlar
 * - altin: sadece standart 4 (gram/çeyrek/yarım/tam) — antika/ayar/gümüş Yahoo'da yok
 * - fon: her zaman false (TEFAS sadece günlük NAV verir)
 */
export function supportsCandleForSlug(slug: string): boolean {
  const dash = slug.indexOf("-")
  if (dash === -1) return false
  const type = slug.substring(0, dash)
  const code = slug.substring(dash + 1).toUpperCase()
  switch (type) {
    case "hisse": return true
    case "doviz": return code in YAHOO_FOREX_TICKER || code in YAHOO_FOREX_CROSS
    case "altin": return GOLD_TYPE_MAP[code.toLowerCase()]?.weightG != null
    case "fon":   return false
    default:      return false
  }
}

interface YahooChartJson {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?:              string
        regularMarketPrice?:  number
        regularMarketTime?:   number  // epoch seconds
        chartPreviousClose?:  number
        instrumentType?:      string
      }
      timestamp?: number[]
      indicators?: {
        quote?: Array<{
          open?:   (number | null)[]
          high?:   (number | null)[]
          low?:    (number | null)[]
          close?:  (number | null)[]
          volume?: (number | null)[]
        }>
      }
    }>
  }
}

interface YahooLatest {
  price:     number
  changePct: number | null
  time:      number
}

async function fetchYahooOhlc(
  ticker: string,
  timeframe: Timeframe
): Promise<{ candles: Candle[]; latest: YahooLatest | null } | null> {
  const { range, interval } = YAHOO_PARAMS[timeframe]
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
    `?interval=${interval}&range=${range}`

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 },
    })
    if (!res.ok) return null

    const json = (await res.json()) as YahooChartJson
    const result = json?.chart?.result?.[0]
    const ts = result?.timestamp
    const q  = result?.indicators?.quote?.[0]
    if (!ts || !q) return null

    const out: Candle[] = []
    for (let i = 0; i < ts.length; i++) {
      const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i]
      if (o == null || h == null || l == null || c == null) continue
      out.push({
        time:   ts[i],
        open:   o,
        high:   h,
        low:    l,
        close:  c,
        volume: q.volume?.[i] ?? 0,
      })
    }
    if (out.length === 0) return null

    // 5 Saatlik gibi non-native interval'lar için bar gruplama (60m → 5h)
    const bucketBy = YAHOO_BUCKET_BY[timeframe]
    const finalCandles = bucketBy ? bucketCandles(out, bucketBy) : out

    // Yahoo'nun meta.regularMarketPrice'ı uzun range'lerde candles'tan daha
    // güncel olabiliyor — header için en taze fiyat budur.
    const meta = result?.meta
    let latest: YahooLatest | null = null
    if (meta?.regularMarketPrice && meta.regularMarketTime) {
      const prevClose = meta.chartPreviousClose ?? null
      latest = {
        price:     meta.regularMarketPrice,
        time:      meta.regularMarketTime,
        changePct: prevClose && prevClose > 0
          ? ((meta.regularMarketPrice - prevClose) / prevClose) * 100
          : null,
      }
    }

    return { candles: finalCandles, latest }
  } catch {
    return null
  }
}

/**
 * BIST hisse için Yahoo ticker üret: "THYAO" → "THYAO.IS"
 */
function bistTicker(symbol: string): string {
  return `${symbol.toUpperCase()}.IS`
}

/**
 * Exotic forex için TL/birim OHLC: USDTRY=X ve USD<CODE>=X paralel çekilir,
 * her bar için TRY = USDTRY ÷ USD<CODE> ile çevrilir.
 *
 * fetchGoldGramTL'in formundan farklı olarak burada bölme; high/low çarpışıyor:
 * 1/USD<CODE> ters çevirdiği için USD<CODE>'un high'ı çevrilmiş seri için
 * low olur. Bar başına min/max'i (open*k, close*k, USDTRY range × 1/[low,high])
 * üzerinden hesaplıyoruz — basit yaklaşım: open/close kesin, high/low için
 * USDTRY barının range'ini USD<CODE> close'una bölüyoruz (yaklaşık ama
 * dakikalık intraday'de yeterince yakın).
 */
async function fetchExoticForexTRY(
  usdCodeTicker: string,
  timeframe: Timeframe,
): Promise<{ candles: Candle[]; latest: YahooLatest | null } | null> {
  const [fx, usdCode] = await Promise.all([
    fetchYahooOhlc("USDTRY=X", timeframe),
    fetchYahooOhlc(usdCodeTicker, timeframe),
  ])
  if (!fx || !usdCode || fx.candles.length === 0 || usdCode.candles.length === 0) {
    return null
  }

  const usdCodeBars = usdCode.candles
  const usdCodeFirstTime = usdCodeBars[0].time

  let ucIdx = 0
  const out: Candle[] = []
  for (const f of fx.candles) {
    if (f.time < usdCodeFirstTime) continue
    while (ucIdx + 1 < usdCodeBars.length && usdCodeBars[ucIdx + 1].time <= f.time) {
      ucIdx++
    }
    const uc = usdCodeBars[ucIdx]
    // Aynı bar için: open = USDTRY.open / USD<CODE>.open, close benzer.
    // high/low: ters çevirdiği için (1/x'in türevi negatif), USD<CODE>'un high'ı
    // çevrilmiş serinin low'una karşılık gelir. USDTRY'in range'i kalır.
    const openK  = uc.open  > 0 ? 1 / uc.open  : 0
    const closeK = uc.close > 0 ? 1 / uc.close : 0
    const highK  = uc.low   > 0 ? 1 / uc.low   : 0   // ters
    const lowK   = uc.high  > 0 ? 1 / uc.high  : 0   // ters
    if (openK === 0 || closeK === 0 || highK === 0 || lowK === 0) continue
    out.push({
      time:   f.time,
      open:   f.open  * openK,
      close:  f.close * closeK,
      high:   f.high  * highK,
      low:    f.low   * lowK,
      volume: 0,
    })
  }
  if (out.length === 0) return null

  let latest: YahooLatest | null = null
  if (fx.latest && usdCode.latest && usdCode.latest.price > 0) {
    const price = fx.latest.price / usdCode.latest.price
    const prev = out.length >= 2 ? out[out.length - 2].close : null
    latest = {
      price,
      time:      Math.max(fx.latest.time, usdCode.latest.time),
      changePct: prev && prev > 0 ? ((price - prev) / prev) * 100 : null,
    }
  }

  return { candles: out, latest }
}

/**
 * Standart altın için TL/gram OHLC serisi üret.
 *
 * GC=F (USD/ons) ve USDTRY=X (TL/USD) paralel çekilir; her gold bar'ı için
 * timestamp ≤ olan en son FX bar'ın `close` değeri kullanılır (binary search
 * yerine tek-yön monoton ilerleme — iki seri de zaman sıralı).
 *
 * Dönüşüm: tl_per_gram = usd_per_oz / 31.1035 × usdtry × weightG
 *
 * Header truncgil TL gram fiyatı gösterir; bu hesap Yahoo spot türevi olduğu
 * için Türk piyasası lokal primine bağlı ~%0.5–1 sapma olabilir, kabul.
 */
async function fetchGoldGramTL(
  timeframe: Timeframe,
  weightG: number
): Promise<{ candles: Candle[]; latest: YahooLatest | null } | null> {
  const [gold, fx] = await Promise.all([
    fetchYahooOhlc("GC=F", timeframe),
    fetchYahooOhlc("USDTRY=X", timeframe),
  ])
  if (!gold || !fx || gold.candles.length === 0 || fx.candles.length === 0) {
    return null
  }

  const fxBars = fx.candles
  const fxFirstTime = fxBars[0].time

  let fxIdx = 0
  const out: Candle[] = []
  for (const g of gold.candles) {
    if (g.time < fxFirstTime) continue
    while (fxIdx + 1 < fxBars.length && fxBars[fxIdx + 1].time <= g.time) {
      fxIdx++
    }
    const rate = fxBars[fxIdx].close
    const k = (rate * weightG) / TROY_OZ_GRAMS
    out.push({
      time:   g.time,
      open:   g.open  * k,
      high:   g.high  * k,
      low:    g.low   * k,
      close:  g.close * k,
      volume: g.volume,
    })
  }
  if (out.length === 0) return null

  let latest: YahooLatest | null = null
  if (gold.latest && fx.latest) {
    const price = (gold.latest.price * fx.latest.price * weightG) / TROY_OZ_GRAMS
    const prev = out.length >= 2 ? out[out.length - 2].close : null
    latest = {
      price,
      time:      Math.max(gold.latest.time, fx.latest.time),
      changePct: prev && prev > 0 ? ((price - prev) / prev) * 100 : null,
    }
  }

  return { candles: out, latest }
}

export interface OhlcFetchResult {
  candles:    Candle[]
  isLineOnly: boolean
  latest:     YahooLatest | null
}

/**
 * Asset slug'a göre OHLC çek.
 *
 * @param slug "hisse-THYAO" | "doviz-USD" | "altin-gram" | "fon-AAK"
 */
export async function fetchOhlcForSlug(
  slug: string,
  timeframe: Timeframe
): Promise<OhlcFetchResult | null> {
  const dash = slug.indexOf("-")
  if (dash === -1) return null
  const type = slug.substring(0, dash)
  const code = slug.substring(dash + 1)

  if (type === "hisse") {
    const res = await fetchYahooOhlc(bistTicker(code), timeframe)
    return res ? { ...res, isLineOnly: false } : null
  }

  if (type === "doviz") {
    const upper = code.toUpperCase()
    const direct = YAHOO_FOREX_TICKER[upper]
    if (direct) {
      const res = await fetchYahooOhlc(direct, timeframe)
      return res ? { ...res, isLineOnly: false } : null
    }
    const crossTicker = YAHOO_FOREX_CROSS[upper]
    if (crossTicker) {
      const res = await fetchExoticForexTRY(crossTicker, timeframe)
      return res ? { ...res, isLineOnly: false } : null
    }
    return null
  }

  if (type === "altin") {
    const goldMeta = GOLD_TYPE_MAP[code.toLowerCase()]
    if (!goldMeta || goldMeta.weightG == null) return null
    const res = await fetchGoldGramTL(timeframe, goldMeta.weightG)
    return res ? { ...res, isLineOnly: false } : null
  }

  if (type === "fon") {
    const periyod = TEFAS_PERIYOD[timeframe]
    try {
      const rows = await fetchFundHistory(code, periyod as 13 | 1 | 3 | 6 | 12 | 36 | 60)
      if (!rows.length) return null
      const candles: Candle[] = rows
        .filter(r => r.tarih && r.fiyat != null)
        .map(r => {
          const epoch = Math.floor(new Date(r.tarih.slice(0, 10)).getTime() / 1000)
          return {
            time:   epoch,
            open:   r.fiyat,
            high:   r.fiyat,
            low:    r.fiyat,
            close:  r.fiyat,
            volume: 0,
          }
        })
        .sort((a, b) => a.time - b.time)
      if (candles.length === 0) return null
      // Fonlar için latest = son NAV
      const last = candles[candles.length - 1]
      const prev = candles.length >= 2 ? candles[candles.length - 2] : null
      const latest: YahooLatest = {
        price:     last.close,
        time:      last.time,
        changePct: prev && prev.close > 0
          ? ((last.close - prev.close) / prev.close) * 100
          : null,
      }
      return { candles, isLineOnly: true, latest }
    } catch {
      return null
    }
  }

  return null
}
