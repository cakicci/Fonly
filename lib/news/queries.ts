/**
 * Asset → keyword + kategori etiket eşlemesi.
 *
 * RSS feed'lerinde kategoriye özel akış yok → tek genel akıştan keyword
 * filtresiyle ilgili haberleri ayıklıyoruz. Hiç eşleşme yoksa
 * `fetchNews` "categoryLabel" altında genel akışa düşer.
 */

import { CURRENCY_MAP } from "@/data/currencies";
import { GOLD_TYPE_MAP } from "@/data/gold-types";
import { BIST_TICKERS } from "@/data/bist-tickers";
import { normalizeTurkish } from "@/lib/tefas";

export type AssetType = "doviz" | "altin" | "hisse" | "fon";

export interface AssetQuery {
  /** Eşleşmeyi tetikleyen kelime/ifade kümesi (normalize edilmiş). */
  keywords:      string[];
  /** Geniş akışın kullanıcıya gösterileceği etiket: "BIST", "Döviz", vb. */
  categoryLabel: string;
  /** Boş eşleşmede gösterilecek başlık ("ATAKP için" gibi). */
  assetLabel:    string;
}

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean)));
}

function norm(s: string): string {
  return normalizeTurkish(s);
}

export function buildAssetQuery(input:
  | { type: "doviz"; code:   string }
  | { type: "altin"; goldType: string }
  | { type: "hisse"; symbol: string }
  | { type: "fon";   kod:    string; fonAdi?: string; kategori?: string },
): AssetQuery | null {
  switch (input.type) {
    case "doviz": {
      const c = CURRENCY_MAP[input.code.toUpperCase()];
      if (!c) return null;
      return {
        keywords: uniq([
          norm(c.code),                       // "usd"
          norm(c.name),                       // "amerikan dolari"
          norm(c.shortName),                  // "us dolar"
          `${norm(c.code)}/try`,              // "usd/try"
        ]),
        categoryLabel: "Döviz piyasası",
        assetLabel:    c.shortName,
      };
    }
    case "altin": {
      const g = GOLD_TYPE_MAP[input.goldType.toLowerCase()];
      if (!g) return null;
      const isGumus = g.category === "gumus";
      return {
        keywords: uniq([
          norm(g.name),       // "gram altin", "ceyrek altin"
          norm(g.nameShort),  // "ceyrek"
          isGumus ? "gumus" : "altin",
        ]),
        categoryLabel: isGumus ? "Gümüş piyasası" : "Altın piyasası",
        assetLabel:    g.name,
      };
    }
    case "hisse": {
      const symbol = input.symbol.toUpperCase();
      const meta   = BIST_TICKERS.find(t => t.symbol === symbol);
      const name   = meta?.name ?? symbol;
      // Şirket adının "A.S." / "A.O." son ekleri haber metninde geçmez; çıkar.
      const cleanName = name.replace(/\s+A\.?S\.?$|\s+A\.O\.?$/i, "").trim();
      return {
        keywords: uniq([
          norm(symbol),
          norm(cleanName),
        ]),
        categoryLabel: "BIST & şirket haberleri",
        assetLabel:    cleanName,
      };
    }
    case "fon": {
      // Fon kodu (AAK, GBR…) haber metninde nadiren geçer → kategoriyle birlikte
      // "yatirim fonu" / "tefas" geniş anahtarlarına genişletilir. Eşleşme
      // tipik olarak 0 dönecek → genel akışa düşer (kasıtlı).
      const kod   = input.kod.toUpperCase();
      const adi   = input.fonAdi ?? "";
      const kat   = input.kategori ?? "";
      return {
        keywords: uniq([
          norm(kod),
          norm(adi),
          norm(kat),
          "yatirim fonu",
          "tefas",
        ]),
        categoryLabel: "Yatırım fonları & piyasa",
        assetLabel:    adi || kod,
      };
    }
  }
}
