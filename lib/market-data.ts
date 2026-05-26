/**
 * Shared market data fetch utilities.
 * Used by both API routes and server components (no self-fetch needed).
 *
 * Canlı veri (döviz + altın): truncgil (tek endpoint).
 * Hisse senedi anlık + tüm geçmiş grafikleri: Yahoo Finance v8 chart.
 * Fon verileri için: lib/tefas.ts (ayrı modül).
 */

// ── Yahoo Finance v8 chart (current price) ───────────────────────────────────

export async function fetchYahooChart(
  ticker: string
): Promise<{ price: number; changePercent: number } | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 60 }
      }
    )
    if (!res.ok) return null
    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) return null
    const price: number = meta.regularMarketPrice
    const prev: number = meta.chartPreviousClose ?? price
    return { price, changePercent: prev ? ((price - prev) / prev) * 100 : 0 }
  } catch {
    return null
  }
}

// ── Yahoo Finance v8 chart (historical time series) ──────────────────────────

/** Returns a Map<date-string, close-price> for the given ticker & range. */
export async function fetchYahooHistory(
  ticker: string,
  range: string,
  interval: string
): Promise<Map<string, number> | null> {
  try {
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/` +
      `${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 300 }
    })
    if (!res.ok) return null

    const json = await res.json()
    const result = json?.chart?.result?.[0]
    if (!result) return null

    const timestamps: number[] = result.timestamp ?? []
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? []

    const map = new Map<string, number>()
    timestamps.forEach((ts, i) => {
      const v = closes[i]
      if (v != null && !isNaN(v)) {
        const date = new Date(ts * 1000).toISOString().split("T")[0]
        map.set(date, v)
      }
    })
    return map.size > 0 ? map : null
  } catch {
    return null
  }
}

// ── Truncgil (canlı döviz + altın, tek endpoint) ────────────────────────────

/**
 * Truncgil tek bir endpoint'te tüm dövizleri, altın türlerini, gümüşü ve
 * BIST endeksini alış/satış + günlük değişim ile beraber döner.
 * Auth yok, dakikalık güncellenir.
 */
export interface TruncgilAsset {
  /** Alış fiyatı (TL). Bazı kayıtlarda 0 olabilir (örn. ONS, BRENT bazen). */
  Buying: number
  /** Satış fiyatı (TL). */
  Selling: number
  /** Önceki referansa göre günlük değişim yüzdesi. */
  Change: number
  /** "Currency" | "Gold". */
  Type: "Currency" | "Gold"
  /** Bazı altın kayıtlarında istisnai sembolik ad var (örn. GRA → "GRAMALTIN"). */
  Name?: string
}

export interface TruncgilResponse {
  /** "YYYY-MM-DD HH:mm:ss" formatında veri zamanı. */
  Update_Date: string
  /** Geri kalan tüm anahtarlar varlık kodları (USD, EUR, GRA, CEYREKALTIN, ...). */
  [code: string]: TruncgilAsset | string
}

export async function fetchTruncgilToday(): Promise<TruncgilResponse | null> {
  try {
    const res = await fetch("https://finans.truncgil.com/v4/today.json", {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 }, // dakikalık tazelik yeterli
    })
    if (!res.ok) return null
    const json = (await res.json()) as TruncgilResponse
    if (!json || typeof json !== "object" || !json.Update_Date) return null
    return json
  } catch {
    return null
  }
}

/**
 * Truncgil tek asset getter — alış/satış/değişim ya null.
 * Selling <= 0 olan kayıtlar (ONS/BRENT bazen) null döner.
 */
export function getTruncgilAsset(
  snapshot: TruncgilResponse | null,
  code: string
): TruncgilAsset | null {
  if (!snapshot) return null
  const entry = snapshot[code]
  if (!entry || typeof entry === "string") return null
  if (typeof entry.Selling !== "number" || entry.Selling <= 0) return null
  return entry
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function fmt(value: number, decimals = 2): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}
