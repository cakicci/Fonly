/**
 * BIST 30 endeksi bileşenleri — Borsa İstanbul tarafından çeyrek yılda bir
 * güncellenir. "Bilindik / blue chip" eşiği olarak kullanılır:
 * free kullanıcılar yalnızca bu listede olan hisseleri kategori sayfalarında görebilir.
 *
 * Güncel liste için: https://www.borsaistanbul.com/tr/endeksler/bist-pay-endeksleri/bist-30
 * Son güncelleme: 2026-Q1
 */
export const BIST30_SYMBOLS = [
  "AKBNK", // Akbank
  "AKSEN", // Aksa Enerji
  "ARCLK", // Arçelik
  "ASELS", // Aselsan
  "ASTOR", // Astor Enerji
  "BIMAS", // BİM Mağazalar
  "CIMSA", // Çimsa
  "DOAS",  // Doğuş Otomotiv
  "EKGYO", // Emlak Konut GYO
  "ENKAI", // Enka İnşaat
  "EREGL", // Ereğli Demir Çelik
  "FROTO", // Ford Otosan
  "GARAN", // Garanti Bankası
  "GUBRF", // Gübre Fabrikaları
  "HEKTS", // Hektaş
  "ISCTR", // İş Bankası (C)
  "KCHOL", // Koç Holding
  "KOZAA", // Koza Madencilik
  "KOZAL", // Koza Altın
  "KRDMD", // Kardemir (D)
  "MGROS", // Migros
  "ODAS",  // Odaş Elektrik
  "PETKM", // Petkim
  "PGSUS", // Pegasus
  "SAHOL", // Sabancı Holding
  "SASA",  // SASA Polyester
  "SISE",  // Şişe Cam
  "TCELL", // Turkcell
  "THYAO", // Türk Hava Yolları
  "TOASO", // Tofaş
  "TTKOM", // Türk Telekom
  "TUPRS", // Tüpraş
  "VAKBN", // Vakıfbank
  "YKBNK", // Yapı Kredi
] as const;

const BIST30_SET = new Set<string>(BIST30_SYMBOLS);

export function isBist30(symbol: string): boolean {
  return BIST30_SET.has(symbol.toUpperCase());
}
