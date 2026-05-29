import { fmt } from "@/lib/market-data"
import { GOLD_TYPE_MAP, type GoldCategory } from "@/data/gold-types"
import { parseAssetSlug } from "@/lib/chart/timeframe"

/**
 * Varlık tipine göre fiyat hassasiyeti.
 * Investing.com tarzı: FX 4 ondalık, hisse/altın 2, fon NAV 4.
 */
export type AssetKind =
  | "currency"
  | "gold-standard"
  | "gold-coin"
  | "gold-purity"
  | "gold-silver"
  | "stock"
  | "stock-index"
  | "fund"

const DECIMALS: Record<AssetKind, number> = {
  "currency":      4,
  "gold-standard": 2,
  "gold-coin":     2,
  "gold-purity":   2,
  "gold-silver":   2,
  "stock":         2,
  "stock-index":   2,
  "fund":          4,
}

export function decimalsFor(kind: AssetKind): number {
  return DECIMALS[kind]
}

/**
 * Lightweight Charts series için price format ipuçları.
 * `minMove` = 10^(-precision) — örn. precision=4 → 0.0001.
 */
export function priceFormatFor(kind: AssetKind): { precision: number; minMove: number } {
  const precision = DECIMALS[kind]
  return { precision, minMove: Math.pow(10, -precision) }
}

/** Sayıyı varlık tipine göre tr-TR formatında biçimle. NaN/null → "—". */
export function fmtAsset(value: number | null | undefined, kind: AssetKind): string {
  if (value == null || !Number.isFinite(value)) return "—"
  return fmt(value, DECIMALS[kind])
}

/**
 * Yüzde formatlama — küçük yüzdeler (|x|<1) için 4 ondalık,
 * büyükleri için 2. İşaret/sembol dahil değil; arayan ekler.
 */
export function fmtPercent(pct: number | null | undefined): string {
  if (pct == null || !Number.isFinite(pct)) return "—"
  const decimals = Math.abs(pct) < 1 ? 4 : 2
  return fmt(pct, decimals)
}

/** Altın kategorisini AssetKind'a eşle. */
export function kindFromGoldCategory(category: GoldCategory): AssetKind {
  switch (category) {
    case "standart": return "gold-standard"
    case "antika":   return "gold-coin"
    case "ayar":     return "gold-purity"
    case "gumus":    return "gold-silver"
  }
}

/**
 * Asset slug'ından AssetKind çıkar. Bilinmiyorsa null.
 * XU100 endeks olduğu için ayrıca ele alınır.
 */
export function kindFromSlug(slug: string): AssetKind | null {
  const { type, code } = parseAssetSlug(slug)
  if (!type) return null
  switch (type) {
    case "doviz": return "currency"
    case "fon":   return "fund"
    case "hisse": return code === "XU100" ? "stock-index" : "stock"
    case "altin": {
      const meta = GOLD_TYPE_MAP[code.toLowerCase()]
      return meta ? kindFromGoldCategory(meta.category) : null
    }
  }
}
