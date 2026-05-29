/**
 * Asset bazlı birleşik haber çekici.
 *
 * Akış:
 *   1. Tüm "general" feed'leri çek (Bloomberg HT + Habertürk Ekonomi)
 *   2. AssetQuery keyword'lerini başlık+açıklamada ara (normalize edilmiş)
 *   3. Eşleşme varsa onları döndür; yoksa tüm feed'i `isGeneralFallback=true`
 *      ile döndür → UI üstte "spesifik haber bulunmadı, genel akış" bandı gösterir.
 *
 * NewsResult tipi `NewsSection` tarafından tüketilir.
 */

import { fetchAllFeeds, type FeedItem } from "./rss";
import { buildAssetQuery, type AssetQuery } from "./queries";
import { normalizeTurkish } from "@/lib/tefas";

export interface NewsItem {
  id:          string;
  title:       string;
  description: string | null;
  url:         string;
  source:      string;
  publishedAt: string;
  imageUrl:    string | null;
}

export type NewsResult =
  | { configured: false }
  | {
      configured:        true;
      articles:          NewsItem[];
      /** True → asset için doğrudan eşleşme yok, kategori akışı gösteriliyor. */
      isGeneralFallback: boolean;
      /** "Döviz piyasası" gibi başlık. Fallback bandında ve boş durumda kullanılır. */
      categoryLabel:     string;
      /** "ATAKP" / "Amerikan Doları" — fallback bandında "X için" şeklinde geçer. */
      assetLabel:        string;
    };

const MAX_ARTICLES = 20;

function toNewsItem(f: FeedItem): NewsItem {
  return {
    id:          f.id,
    title:       f.title,
    description: f.description,
    url:         f.link,
    source:      f.source,
    publishedAt: f.pubDate,
    imageUrl:    f.imageUrl,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Kısa keyword'ler (≤3 char) substring olarak çok yanlış pozitif veriyor —
 * "yen" → "yenilik", "ata" → "Atatürk", "ley" → "leylek". O yüzden ≤3
 * için tam-kelime sınırı; ≥4 için substring (Türkçe ek almış "dolarda",
 * "euronun" gibi formlar yakalanabilsin diye).
 */
function matchesAny(text: string, keywords: string[]): boolean {
  const n = normalizeTurkish(text);
  return keywords.some(k => {
    if (k.length < 2) return false;
    if (k.length <= 3) {
      return new RegExp(`\\b${escapeRegex(k)}\\b`).test(n);
    }
    return n.includes(k);
  });
}

export type FetchNewsInput =
  | { type: "doviz"; code:   string }
  | { type: "altin"; goldType: string }
  | { type: "hisse"; symbol: string }
  | { type: "fon";   kod:    string; fonAdi?: string; kategori?: string };

export async function fetchNews(input: FetchNewsInput): Promise<NewsResult> {
  const query: AssetQuery | null = buildAssetQuery(input);
  if (!query) {
    return {
      configured:        true,
      articles:          [],
      isGeneralFallback: false,
      categoryLabel:     "Piyasa",
      assetLabel:        "",
    };
  }

  const all = await fetchAllFeeds("general");

  // Yalnızca başlık eşleştir — açıklamada "altına indi" gibi prepozisyon
  // kullanımları "altın" kök yanılgısı yaratıyor. Başlık daha keskin sinyal.
  const matched = all.filter(item => matchesAny(item.title, query.keywords));

  if (matched.length > 0) {
    return {
      configured:        true,
      articles:          matched.slice(0, MAX_ARTICLES).map(toNewsItem),
      isGeneralFallback: false,
      categoryLabel:     query.categoryLabel,
      assetLabel:        query.assetLabel,
    };
  }

  return {
    configured:        true,
    articles:          all.slice(0, MAX_ARTICLES).map(toNewsItem),
    isGeneralFallback: true,
    categoryLabel:     query.categoryLabel,
    assetLabel:        query.assetLabel,
  };
}
