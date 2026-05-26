export type CurrencyCategory = "major" | "other"

export interface CurrencyMeta {
  code: string
  name: string                  // "Amerikan Doları"
  shortName: string             // "Dolar"
  flag: string                  // "🇺🇸"
  /**
   * Görüntülemede kaç birimin TL karşılığı gösterilecek.
   * 1 = "1 USD = 45,89 TL", 100 = "100 JPY = 30,12 TL".
   * Çok küçük değerli para birimlerinde okunabilirlik için artırılır.
   */
  displayPer: number
  /**
   * "major" = yaygın 8 döviz (sidebar ve liste üst sekmesinde).
   * "other" = diğer 22 döviz (sadece /doviz alt sekmesinde).
   */
  category: CurrencyCategory
}

export const CURRENCIES: CurrencyMeta[] = [
  // ── Yaygın 8 (sidebar + üst sekme) ──────────────────────────────────────
  { code: "USD", name: "Amerikan Doları",   shortName: "Dolar",                flag: "🇺🇸", displayPer: 1,   category: "major" },
  { code: "EUR", name: "Euro",              shortName: "Euro",                 flag: "🇪🇺", displayPer: 1,   category: "major" },
  { code: "GBP", name: "İngiliz Sterlini",  shortName: "Sterlin",              flag: "🇬🇧", displayPer: 1,   category: "major" },
  { code: "CHF", name: "İsviçre Frangı",    shortName: "Frang",                flag: "🇨🇭", displayPer: 1,   category: "major" },
  { code: "JPY", name: "Japon Yeni",        shortName: "Yen",                  flag: "🇯🇵", displayPer: 100, category: "major" },
  { code: "CNY", name: "Çin Yuanı",         shortName: "Yuan",                 flag: "🇨🇳", displayPer: 1,   category: "major" },
  { code: "CAD", name: "Kanada Doları",     shortName: "Kanada Doları",        flag: "🇨🇦", displayPer: 1,   category: "major" },
  { code: "AUD", name: "Avustralya Doları", shortName: "Avustralya Doları",    flag: "🇦🇺", displayPer: 1,   category: "major" },

  // ── Diğer dövizler ──────────────────────────────────────────────────────
  { code: "RUB", name: "Rus Rublesi",          shortName: "Ruble",              flag: "🇷🇺", displayPer: 1,    category: "other" },
  { code: "SAR", name: "Suudi Riyali",         shortName: "Riyal",              flag: "🇸🇦", displayPer: 1,    category: "other" },
  { code: "AED", name: "BAE Dirhemi",          shortName: "Dirhem",             flag: "🇦🇪", displayPer: 1,    category: "other" },
  { code: "KWD", name: "Kuveyt Dinarı",        shortName: "Dinar",              flag: "🇰🇼", displayPer: 1,    category: "other" },
  { code: "BHD", name: "Bahreyn Dinarı",       shortName: "Dinar",              flag: "🇧🇭", displayPer: 1,    category: "other" },
  { code: "LYD", name: "Libya Dinarı",         shortName: "Dinar",              flag: "🇱🇾", displayPer: 1,    category: "other" },
  { code: "ILS", name: "İsrail Şekeli",        shortName: "Şekel",              flag: "🇮🇱", displayPer: 1,    category: "other" },
  { code: "IQD", name: "Irak Dinarı",          shortName: "Dinar",              flag: "🇮🇶", displayPer: 100,  category: "other" },
  { code: "SEK", name: "İsveç Kronu",          shortName: "İsveç Kronu",        flag: "🇸🇪", displayPer: 1,    category: "other" },
  { code: "NOK", name: "Norveç Kronu",         shortName: "Norveç Kronu",       flag: "🇳🇴", displayPer: 1,    category: "other" },
  { code: "DKK", name: "Danimarka Kronu",      shortName: "Danimarka Kronu",    flag: "🇩🇰", displayPer: 1,    category: "other" },
  { code: "PLN", name: "Polonya Zlotisi",      shortName: "Zloti",              flag: "🇵🇱", displayPer: 1,    category: "other" },
  { code: "CZK", name: "Çek Korunası",         shortName: "Koruna",             flag: "🇨🇿", displayPer: 1,    category: "other" },
  { code: "HUF", name: "Macar Forinti",        shortName: "Forint",             flag: "🇭🇺", displayPer: 100,  category: "other" },
  { code: "RON", name: "Rumen Leyi",           shortName: "Ley",                flag: "🇷🇴", displayPer: 1,    category: "other" },
  { code: "ZAR", name: "Güney Afrika Randı",   shortName: "Rand",               flag: "🇿🇦", displayPer: 1,    category: "other" },
  { code: "INR", name: "Hindistan Rupisi",     shortName: "Rupi",               flag: "🇮🇳", displayPer: 1,    category: "other" },
  { code: "IDR", name: "Endonezya Rupiahı",    shortName: "Rupiah",             flag: "🇮🇩", displayPer: 1000, category: "other" },
  { code: "MXN", name: "Meksika Pesosu",       shortName: "Peso",               flag: "🇲🇽", displayPer: 1,    category: "other" },
  { code: "BRL", name: "Brezilya Reali",       shortName: "Real",               flag: "🇧🇷", displayPer: 1,    category: "other" },
  { code: "ARS", name: "Arjantin Pesosu",      shortName: "Peso",               flag: "🇦🇷", displayPer: 1,    category: "other" },
  { code: "NZD", name: "Yeni Zelanda Doları",  shortName: "Yeni Zelanda Doları", flag: "🇳🇿", displayPer: 1,    category: "other" },
]

export const CURRENCY_MAP = Object.fromEntries(
  CURRENCIES.map(c => [c.code, c])
) as Record<string, CurrencyMeta>

/** Yaygın 8 döviz — sidebar ve liste üst sekmesi için. */
export const MAJOR_CURRENCIES = CURRENCIES.filter(c => c.category === "major")

/** Diğer 22 döviz — alt sekme veya genişletilmiş liste için. */
export const OTHER_CURRENCIES = CURRENCIES.filter(c => c.category === "other")
