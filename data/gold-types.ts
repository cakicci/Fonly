export type GoldCategory = "standart" | "antika" | "ayar" | "gumus"

export interface GoldTypeMeta {
  /** URL slug (örn. "gram", "ceyrek", "cumhuriyet", "14ayar"). */
  type: string
  /** Tam ad (örn. "Cumhuriyet Altını"). */
  name: string
  /** Kısa ad (kart/sidebar için). */
  nameShort: string
  /** truncgil JSON'undaki anahtar (örn. "GRA", "CEYREKALTIN", "14AYARALTIN", "GUMUS"). */
  truncgilKey: string
  /** Kategori grupları — /altin sayfasında sekmeli görünüm için. */
  category: GoldCategory
  /**
   * Yahoo Finance + USDTRY üzerinden geçmiş grafik hesaplaması için gram ağırlık.
   * Sadece "standart" türlerde mevcut; diğerlerinde geçmiş grafik gösterilmez
   * (truncgil geçmiş veri vermiyor, Yahoo'da Cumhuriyet/14 ayar gibi ticker yok).
   */
  weightG?: number
}

export const GOLD_TYPES: GoldTypeMeta[] = [
  // ── Standart altın (gram bazlı ticari) ──────────────────────────────────
  { type: "gram",   name: "Gram Altın",   nameShort: "Gram",   truncgilKey: "GRA",         category: "standart", weightG: 1     },
  { type: "ceyrek", name: "Çeyrek Altın", nameShort: "Çeyrek", truncgilKey: "CEYREKALTIN", category: "standart", weightG: 1.748 },
  { type: "yarim",  name: "Yarım Altın",  nameShort: "Yarım",  truncgilKey: "YARIMALTIN",  category: "standart", weightG: 3.496 },
  { type: "tam",    name: "Tam Altın",    nameShort: "Tam",    truncgilKey: "TAMALTIN",    category: "standart", weightG: 6.992 },

  // ── Antika altın (eski sikkeler) ────────────────────────────────────────
  { type: "cumhuriyet", name: "Cumhuriyet Altını", nameShort: "Cumhuriyet", truncgilKey: "CUMHURIYETALTINI", category: "antika" },
  { type: "ata",        name: "Ata Altın",         nameShort: "Ata",        truncgilKey: "ATAALTIN",         category: "antika" },
  { type: "resat",      name: "Reşat Altını",      nameShort: "Reşat",      truncgilKey: "RESATALTIN",       category: "antika" },
  { type: "hamit",      name: "Hamit Altını",      nameShort: "Hamit",      truncgilKey: "HAMITALTIN",       category: "antika" },

  // ── Ayar bazlı ──────────────────────────────────────────────────────────
  { type: "14ayar", name: "14 Ayar Altın", nameShort: "14 Ayar", truncgilKey: "14AYARALTIN", category: "ayar" },
  { type: "18ayar", name: "18 Ayar Altın", nameShort: "18 Ayar", truncgilKey: "18AYARALTIN", category: "ayar" },

  // ── Gümüş ───────────────────────────────────────────────────────────────
  { type: "gumus", name: "Gram Gümüş", nameShort: "Gümüş", truncgilKey: "GUMUS", category: "gumus" },
]

export const GOLD_TYPE_MAP = Object.fromEntries(
  GOLD_TYPES.map(g => [g.type, g])
) as Record<string, GoldTypeMeta>

export const STANDART_GOLD = GOLD_TYPES.filter(g => g.category === "standart")
export const ANTIKA_GOLD   = GOLD_TYPES.filter(g => g.category === "antika")
export const AYAR_GOLD     = GOLD_TYPES.filter(g => g.category === "ayar")
export const GUMUS_TYPES   = GOLD_TYPES.filter(g => g.category === "gumus")

export const GOLD_CATEGORY_LABELS: Record<GoldCategory, string> = {
  standart: "Standart Altın",
  antika:   "Antika Altın",
  ayar:     "Ayar Altın",
  gumus:    "Gümüş",
}
