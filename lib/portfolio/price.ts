import { fetchTruncgilToday, getTruncgilAsset, fetchYahooChart } from "@/lib/market-data";
import { fetchFundDetail } from "@/lib/tefas";
import { GOLD_TYPE_MAP } from "@/data/gold-types";
import { parseAssetSlug } from "@/lib/chart/timeframe";

/** Canlı birim fiyat (TL) + günlük değişim yüzdesi. Değişim bilinmiyorsa null. */
export interface Quote {
  price: number;
  /** Önceki kapanışa göre günlük değişim yüzdesi; bilinmiyorsa null. */
  changePercent: number | null;
}

/**
 * Bir slug kümesi için canlı fiyat + günlük değişimi tek seferde toplar.
 *
 * Kaynak bazında gruplar:
 *   - doviz + altın → tek `fetchTruncgilToday()` çağrısı (Selling + Change)
 *   - hisse        → Yahoo `${SYM}.IS` (price + changePercent, paralel)
 *   - fon          → TEFAS `fonBilgiGetir` (sonFiyat + gunlukGetiri, paralel)
 *
 * Çekilemeyen her slug için değer `null` döner. Her dış çağrı kendi içinde 60s+
 * cache'li (revalidate), yani portföy/panel yenilemesi dış API'leri dövmüyor.
 */
export async function getQuotesForSlugs(
  slugs: string[]
): Promise<Map<string, Quote | null>> {
  const unique = Array.from(new Set(slugs));
  const result = new Map<string, Quote | null>();
  for (const s of unique) result.set(s, null);

  const needsTruncgil = unique.some((s) => {
    const { type } = parseAssetSlug(s);
    return type === "doviz" || type === "altin";
  });

  const truncgilPromise = needsTruncgil ? fetchTruncgilToday() : Promise.resolve(null);

  // Hisse ve fon çağrılarını topla.
  const tasks: Promise<void>[] = [];

  for (const slug of unique) {
    const { type, code } = parseAssetSlug(slug);

    if (type === "hisse") {
      const ticker = `${code.toUpperCase()}.IS`;
      tasks.push(
        fetchYahooChart(ticker).then((r) => {
          result.set(slug, r ? { price: r.price, changePercent: r.changePercent } : null);
        })
      );
    } else if (type === "fon") {
      tasks.push(
        fetchFundDetail(code.toUpperCase())
          .then((row) => {
            result.set(
              slug,
              row ? { price: row.sonFiyat, changePercent: row.gunlukGetiri ?? null } : null
            );
          })
          .catch(() => {
            result.set(slug, null);
          })
      );
    }
  }

  const [truncgil] = await Promise.all([truncgilPromise, ...tasks]);

  // truncgil snapshot geldiyse doviz/altın fiyat + değişimini doldur.
  if (truncgil) {
    for (const slug of unique) {
      const { type, code } = parseAssetSlug(slug);
      if (type === "doviz") {
        const asset = getTruncgilAsset(truncgil, code.toUpperCase());
        result.set(slug, asset ? { price: asset.Selling, changePercent: asset.Change ?? null } : null);
      } else if (type === "altin") {
        const meta = GOLD_TYPE_MAP[code.toLowerCase()];
        if (meta) {
          const asset = getTruncgilAsset(truncgil, meta.truncgilKey);
          result.set(slug, asset ? { price: asset.Selling, changePercent: asset.Change ?? null } : null);
        }
      }
    }
  }

  return result;
}

/**
 * Sadece birim fiyatları döner (`getQuotesForSlugs` üzerine ince sarmalayıcı).
 * Çekilemeyen her slug için `null` — aggregate katmanı bunu "—" olarak gösterir.
 */
export async function getPricesForSlugs(
  slugs: string[]
): Promise<Map<string, number | null>> {
  const quotes = await getQuotesForSlugs(slugs);
  const result = new Map<string, number | null>();
  for (const [slug, q] of quotes) result.set(slug, q?.price ?? null);
  return result;
}
