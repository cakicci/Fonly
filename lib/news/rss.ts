/**
 * RSS 2.0 parser + fetcher.
 *
 * Bağımlılık olmadan basit regex ile parse — kaynak feed'leri (BloombergHT,
 * Habertürk) RSS 2.0 ve `<item>` etiketleri iyi formatlı. Tek dosya, küçük
 * yüzey alanı.
 *
 * Cache: `next: { revalidate: 3600 }` ile feed başına saatlik. Bir asset
 * sayfası kendi keyword filtresini bellekte uygular — feed yine tek istektir.
 */

import { NEWS_FEEDS, type FeedKind, type NewsFeed } from "./sources";

export interface FeedItem {
  id:          string;
  title:       string;
  description: string | null;
  link:        string;
  pubDate:     string;       // ISO string
  imageUrl:    string | null;
  source:      string;       // Feed adı (örn. "Bloomberg HT")
}

/** CDATA dahil olabilen bir tag içeriğini söker. Eşleşme yoksa null. */
function readTag(xml: string, tag: string): string | null {
  // <tag><![CDATA[...]]></tag>  ya da  <tag>...</tag>
  const re = new RegExp(
    `<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</${tag}>`,
    "i",
  );
  const m = xml.match(re);
  return m ? m[1].trim() : null;
}

/** Olası birden çok kaynaktan (enclosure / media:content / <image>) thumbnail çekmeyi dener. */
function readImageUrl(xml: string): string | null {
  // 1) <image>...</image> (BloombergHT)
  const imgTag = readTag(xml, "image");
  if (imgTag && /^https?:/i.test(imgTag)) return imgTag;

  // 2) <enclosure url="..." type="image/..."/>  (Dünya, Habertürk standart)
  const enc = xml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image\//i);
  if (enc) return enc[1];

  // 3) <media:content url="..." medium="image"/> (Habertürk)
  const media = xml.match(/<media:(?:content|thumbnail)[^>]*url=["']([^"']+)["']/i);
  if (media) return media[1];

  // 4) description içindeki <img src="..."> (fallback)
  const descImg = xml.match(/<img[^>]*src=["']([^"']+)["']/i);
  return descImg ? descImg[1] : null;
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePubDate(raw: string | null): string {
  if (!raw) return new Date(0).toISOString();
  const t = Date.parse(raw);
  return Number.isFinite(t) ? new Date(t).toISOString() : new Date(0).toISOString();
}

/** Exported: testler örnek XML ile parser davranışını doğrular. */
export function parseItems(xml: string, source: string): FeedItem[] {
  const items: FeedItem[] = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const body = m[1];
    const title   = readTag(body, "title");
    const link    = readTag(body, "link");
    const guid    = readTag(body, "guid");
    if (!title || !link) continue;
    const desc    = readTag(body, "description");
    const pubDate = readTag(body, "pubDate");
    items.push({
      id:          guid ?? link,
      title:       stripHtml(title),
      description: desc ? stripHtml(desc) : null,
      link,
      pubDate:     parsePubDate(pubDate),
      imageUrl:    readImageUrl(body),
      source,
    });
  }
  return items;
}

async function fetchOne(feed: NewsFeed): Promise<FeedItem[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "Mozilla/5.0 (Fonly)" },
      next:    { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseItems(xml, feed.name);
  } catch {
    return [];
  }
}

/**
 * Tüm yapılandırılmış feed'lerden (varsayılan: kind="general") haberleri
 * paralel çeker, URL bazlı tekilleştirip tarihe göre azalan sıralar.
 */
export async function fetchAllFeeds(kind: FeedKind | "all" = "general"): Promise<FeedItem[]> {
  const targets = kind === "all"
    ? NEWS_FEEDS
    : NEWS_FEEDS.filter(f => f.kind === kind);

  const lists = await Promise.all(targets.map(fetchOne));
  const seen  = new Set<string>();
  const out: FeedItem[] = [];
  for (const list of lists) {
    for (const item of list) {
      const key = item.link;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }
  out.sort((a, b) => b.pubDate.localeCompare(a.pubDate));
  return out;
}
