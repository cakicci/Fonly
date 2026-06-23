import { parseAssetSlug } from "@/lib/chart/timeframe";
import { CURRENCY_MAP } from "@/data/currencies";
import { GOLD_TYPE_MAP } from "@/data/gold-types";
import { BIST_TICKERS } from "@/data/bist-tickers";

/**
 * Portföy varlık slug'ı yardımcıları. Watchlist/alert ile aynı slug biçimi:
 * "hisse-THYAO" | "doviz-USD" | "altin-gram" | "fon-AAK".
 */

export type AssetType = "hisse" | "doviz" | "altin" | "fon";

/** Fon kodu: 2–6 harf/rakam (TEFAS statik listesi yok, biçimsel doğrulama). */
const FUND_CODE = /^[A-Z0-9]{2,6}$/;

/**
 * Slug'ı kanonik biçime getirir ve geçerliyse döner, değilse null.
 * Döviz/hisse/fon kodu büyük harf, altın türü küçük harf. Bilinen varlıklara
 * göre doğrular (fon hariç — biçimsel kontrol).
 */
export function normalizeAssetSlug(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const { type, code } = parseAssetSlug(raw.trim());
  if (!type || !code) return null;

  switch (type) {
    case "doviz": {
      const c = code.toUpperCase();
      return CURRENCY_MAP[c] ? `doviz-${c}` : null;
    }
    case "altin": {
      const c = code.toLowerCase();
      return GOLD_TYPE_MAP[c] ? `altin-${c}` : null;
    }
    case "hisse": {
      const c = code.toUpperCase();
      return BIST_TICKERS.some((t) => t.symbol === c) ? `hisse-${c}` : null;
    }
    case "fon": {
      const c = code.toUpperCase();
      return FUND_CODE.test(c) ? `fon-${c}` : null;
    }
  }
}

/** Slug için insan-okur ad. Bilinmiyorsa kodu döner. */
export function assetDisplayName(slug: string): string {
  const { type, code } = parseAssetSlug(slug);
  switch (type) {
    case "doviz":
      return CURRENCY_MAP[code.toUpperCase()]?.name ?? code.toUpperCase();
    case "altin":
      return GOLD_TYPE_MAP[code.toLowerCase()]?.name ?? code;
    case "hisse":
      return BIST_TICKERS.find((t) => t.symbol === code.toUpperCase())?.name ?? code.toUpperCase();
    case "fon":
      return code.toUpperCase();
    default:
      return slug;
  }
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  hisse: "Hisse",
  doviz: "Döviz",
  altin: "Altın",
  fon: "Fon",
};

/** Slug'ın varlık tipini döner (UI etiketleri için). */
export function assetTypeOf(slug: string): AssetType | null {
  const { type } = parseAssetSlug(slug);
  return type as AssetType | null;
}

/** Slug → varlık detay sayfası linki. */
export function assetHref(slug: string): string {
  const { type, code } = parseAssetSlug(slug);
  switch (type) {
    case "doviz":
      return `/doviz/${code.toUpperCase()}`;
    case "altin":
      return `/altin/${code.toLowerCase()}`;
    case "hisse":
      return `/hisse/${code.toUpperCase()}`;
    case "fon":
      return `/fon/${code.toUpperCase()}`;
    default:
      return "/";
  }
}
