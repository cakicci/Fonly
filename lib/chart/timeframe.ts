import type { Timeframe } from "@/types/chart"

/**
 * Timeframe → Yahoo Finance v8 chart parametreleri.
 * Yahoo `range` ve `interval` ikilisini kabul eder.
 *
 * Notlar:
 * - 1G intraday için 5dk mum kullanıyoruz (1m de var ama 7 günle sınırlı,
 *   user range>1d seçerse hata olur).
 * - MAX olarak 10 yıl haftalık alıyoruz (gerçek "max" çok yıllık aralıklarda
 *   Yahoo bazen NaN doldurur, 10y daha güvenli).
 */
export interface YahooParams {
  range:    string
  interval: string
}

export const YAHOO_PARAMS: Record<Timeframe, YahooParams> = {
  // Intraday (Yahoo limit: 1m=7g, 5/15/30m=60g)
  "1dk":  { range: "1d",  interval: "1m"  },
  "5dk":  { range: "5d",  interval: "5m"  },
  "15dk": { range: "5d",  interval: "15m" },
  "30dk": { range: "1mo", interval: "30m" },
  // Bar-süresi tabanlı (investing.com tarzı teknik analiz)
  "1S":   { range: "1mo", interval: "60m" },          // saatlik
  "5S":   { range: "3mo", interval: "60m" },          // 5 saatlik (60m fetched, 5× aggregated)
  "1D":   { range: "1y",  interval: "1d"  },          // günlük
  "1W":   { range: "5y",  interval: "1wk" },          // haftalık
  "1Mo":  { range: "10y", interval: "1mo" },          // aylık
  // Günlük ve üstü (eski range-tabanlı — grafik sayfasında hâlâ kullanılıyor)
  "1G":   { range: "1d",  interval: "5m"  },
  "1H":   { range: "5d",  interval: "30m" },
  "1A":   { range: "1mo", interval: "1d"  },
  "3A":   { range: "3mo", interval: "1d"  },
  "1Y":   { range: "1y",  interval: "1d"  },
  "5Y":   { range: "5y",  interval: "1wk" },
  "MAX":  { range: "10y", interval: "1wk" },
}

/**
 * Yahoo'dan çekildikten sonra kaç barı tek bara birleştir.
 * 5S için: 60m bar'ları 5'er gruplayıp 5 saatlik bar üretiyoruz (Yahoo
 * 5h interval'ı doğrudan desteklemiyor).
 */
export const YAHOO_BUCKET_BY: Partial<Record<Timeframe, number>> = {
  "5S": 5,
}

/**
 * TEFAS fonları için `periyod` enum'ı — sabit set kabul ediyor.
 * Intraday yok (1G/1H gerçekçi değil → en yakın 1A'ya yuvarla).
 */
/**
 * TEFAS fonları intraday vermez. Tüm intraday timeframe'ler TEFAS'ta
 * 13 (1 hafta — en küçük) ile cevaplanır; UI label'ı yanıltıcı olur ama
 * en azından sayfa kırılmaz.
 */
export const TEFAS_PERIYOD: Record<Timeframe, number> = {
  "1dk":  13,
  "5dk":  13,
  "15dk": 13,
  "30dk": 13,
  "1S":   13,
  "5S":   13,
  "1D":   12,
  "1W":   60,
  "1Mo":  60,
  "1G":   13,
  "1H":   13,
  "1A":   1,
  "3A":   3,
  "1Y":   12,
  "5Y":   60,
  "MAX":  60,
}

export const ALL_TIMEFRAMES: Timeframe[] = [
  "1dk", "5dk", "15dk", "30dk",
  "1S", "5S", "1D", "1W", "1Mo",
  "1G", "1H", "1A", "3A", "1Y", "5Y", "MAX",
]

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "1dk":  "1dk",
  "5dk":  "5dk",
  "15dk": "15dk",
  "30dk": "30dk",
  "1S":   "Saatlik",
  "5S":   "5 Saatlik",
  "1D":   "Günlük",
  "1W":   "Haftalık",
  "1Mo":  "Aylık",
  "1G":   "1G",
  "1H":   "1H",
  "1A":   "1A",
  "3A":   "3A",
  "1Y":   "1Y",
  "5Y":   "5Y",
  "MAX":  "MAX",
}

/** Bir slug'ın hangi asset tipinde olduğunu söyler. */
export function parseAssetSlug(slug: string): {
  type: "hisse" | "doviz" | "altin" | "fon" | null
  code: string
} {
  const dash = slug.indexOf("-")
  if (dash === -1) return { type: null, code: "" }
  const type = slug.substring(0, dash)
  const code = slug.substring(dash + 1)
  if (type === "hisse" || type === "doviz" || type === "altin" || type === "fon") {
    return { type, code }
  }
  return { type: null, code }
}

/** Bir asset tipi candle (intraday OHLC) destekliyor mu? Fonlar için false. */
export function supportsCandles(assetType: "hisse" | "doviz" | "altin" | "fon"): boolean {
  return assetType !== "fon"
}
