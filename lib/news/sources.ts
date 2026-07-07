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

// NOT: parser yalnızca RSS 2.0 (<item>) destekler — Atom feed'ler (örn. NTV)
// eklenmeden önce lib/news/rss.ts genişletilmeli. Aday eklerken önce curl ile
// <rss doğrula (bigpara/paraanaliz RSS'i kaldırdı — 2026-07 denendi).
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
  {
    id:   "aa-ekonomi",
    name: "Anadolu Ajansı Ekonomi",
    url:  "https://www.aa.com.tr/tr/rss/default?cat=ekonomi",
    kind: "general",
  },
  {
    id:   "dunya",
    name: "Dünya Gazetesi",
    url:  "https://www.dunya.com/rss?dunya",
    kind: "general",
  },
  {
    id:   "investing-tr",
    name: "Investing Türkiye",
    url:  "https://tr.investing.com/rss/news.rss",
    kind: "general",
  },
];
