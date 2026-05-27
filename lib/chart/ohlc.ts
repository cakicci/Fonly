import type { Candle, Timeframe } from "@/types/chart"
import { YAHOO_PARAMS, TEFAS_PERIYOD } from "./timeframe"
import { fetchFundHistory } from "@/lib/tefas"

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

// Standart altın için Yahoo'da GC=F (USD/oz) — UI'da gram'a çevirmek için ek
// USDTRY çağrısı gerekecek; basitlik için altın grafiklerini USD/oz olarak
// gösteriyoruz (karşılaştırma grafiği zaten gram TL veriyor).
// Antika/ayar/gümüş Yahoo'da yok — OHLC desteklenmez.
const YAHOO_GOLD_TICKER: Record<string, string> = {
  gram:   "GC=F",
  ceyrek: "GC=F",
  yarim:  "GC=F",
  tam:    "GC=F",
}

interface YahooChartJson {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?:           string
        regularMarketPrice?: number
        instrumentType?:   string
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

async function fetchYahooOhlc(
  ticker: string,
  timeframe: Timeframe
): Promise<Candle[] | null> {
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
      // Tatil/haftasonu null doldurmalarını atla
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
    return out.length > 0 ? out : null
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
 * Asset slug'a göre OHLC çek.
 *
 * @param slug "hisse-THYAO" | "doviz-USD" | "altin-gram" | "fon-AAK"
 */
export async function fetchOhlcForSlug(
  slug: string,
  timeframe: Timeframe
): Promise<{ candles: Candle[]; isLineOnly: boolean } | null> {
  const dash = slug.indexOf("-")
  if (dash === -1) return null
  const type = slug.substring(0, dash)
  const code = slug.substring(dash + 1)

  if (type === "hisse") {
    const candles = await fetchYahooOhlc(bistTicker(code), timeframe)
    return candles ? { candles, isLineOnly: false } : null
  }

  if (type === "doviz") {
    const ticker = YAHOO_FOREX_TICKER[code.toUpperCase()]
    if (!ticker) return null
    const candles = await fetchYahooOhlc(ticker, timeframe)
    return candles ? { candles, isLineOnly: false } : null
  }

  if (type === "altin") {
    const ticker = YAHOO_GOLD_TICKER[code.toLowerCase()]
    if (!ticker) return null // antika/ayar/gümüş Yahoo'da yok
    const candles = await fetchYahooOhlc(ticker, timeframe)
    return candles ? { candles, isLineOnly: false } : null
  }

  if (type === "fon") {
    const periyod = TEFAS_PERIYOD[timeframe]
    try {
      // periyod tipi TefasPeriyod (13|1|3|6|12|36|60) — TEFAS_PERIYOD bunlardan birini döner
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
      return candles.length > 0 ? { candles, isLineOnly: true } : null
    } catch {
      return null
    }
  }

  return null
}
