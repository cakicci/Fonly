/**
 * AI buton tipleri — her tip Faz 12'de farklı bir prompt template'ine bağlanır.
 * Yeni AI yetkinliği eklendiğinde buraya ve `lib/ai/prompts.ts`'e eklenir.
 */
export type AIPromptType =
  | "chart-analysis"      // Chart toolbar — mevcut grafiği yorumla
  | "asset-summary"       // Genel sayfa — varlığın anlık genel durumu
  | "news-summary"        // Haberler sayfası — son haberleri özetle
  | "dividend-safety"     // Temettü sayfası — temettü sürdürülebilirliği
  | "growth-pricing"      // Finansallar — büyüme fiyatlandırılmış mı
  | "technical-summary"   // Teknik sayfası — teknik göstergeleri yorumla
  | "company-explainer"   // Profil — şirket ne yapar, sade Türkçe
  | "ownership-insight";  // Sahiplik — sahiplik yapısı ne anlatıyor

export interface AIContext {
  slug: string;
  /** Asset tipi — backend prompt template'inde kullanılır. */
  assetType: "hisse" | "doviz" | "altin" | "fon";
  /** Asset insan-okur ismi. */
  assetName: string;
  /** Tip-spesifik ek bağlam (timeframe, fiyat, indicator değerleri vs.). */
  extra?: Record<string, unknown>;
}
