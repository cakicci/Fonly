/**
 * Türkçe finans haberleri için RSS kaynakları.
 *
 * Hepsi RSS 2.0 — `lib/news/rss.ts` ortak parser ile işler. Yeni kaynak eklemek
 * için burayı genişletmek yeterli; UI dokunulmaz.
 */

export type FeedKind =
  | "general"   // Geniş finans/ekonomi akışı (varsayılan kaynak)
  | "sirket";   // Şirket/borsa odaklı (gelecekte ayrıştırılırsa)

export interface NewsFeed {
  id:   string;
  name: string;
  url:  string;
  kind: FeedKind;
}

export const NEWS_FEEDS: NewsFeed[] = [
  {
    id:   "bloomberght",
    name: "Bloomberg HT",
    url:  "https://www.bloomberght.com/rss",
    kind: "general",
  },
  {
    id:   "haberturk-ekonomi",
    name: "Habertürk Ekonomi",
    url:  "https://www.haberturk.com/rss/ekonomi.xml",
    kind: "general",
  },
];
