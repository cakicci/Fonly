/**
 * Hisse sınıflandırma — AI adapter katmanı.
 *
 * Bu dosya AI sağlayıcısına bağımsız tip tanımları ve mock implementation içerir.
 * AI sağlayıcısı seçildiğinde (Anthropic Claude / OpenAI vs.) gerçek classifier
 * bu interface'i implement eder, `scripts/analyze-stocks.ts` o classifier'ı çağırır.
 *
 * Hibrit yaklaşım:
 *   1. Sayısal metrikler `lib/analysis/stock-metrics.ts` ile hesaplanır (volatilite,
 *      max drawdown, 5y getiri) — bu kısım deterministik.
 *   2. LLM yalnızca kategoriyi atar + Türkçe açıklama yazar. Asla fiyat hedefi /
 *      al-sat sinyali üretmez.
 */
import type { RiskLevel, Horizon } from "@/data/stocks";

export interface StockMetrics {
  symbol:          string;
  name:            string;
  /** Son 1 yıllık yıllıklaştırılmış volatilite (%). */
  volatility1y:    number | null;
  /** Son 5 yıldaki en büyük düşüş (%). */
  maxDrawdown5y:   number | null;
  /** Yıllıklaştırılmış 5 yıllık getiri (%). */
  cagr5y:          number | null;
  /** Günlük ortalama işlem hacmi (TL). */
  avgDailyVolume:  number | null;
  /** Sektör adı (varsa). */
  sector:          string | null;
}

export interface ClassificationResult {
  risk:          RiskLevel;
  horizon:       Horizon;
  /** 0-100, premium kullanıcı sayfasında sıralama için. */
  aiScore:       number;
  /** Tek cümle özet — kart üstü vurgulu kutuda gösterilir. */
  aiSummary:     string;
  /** 2-3 cümle daha uzun açıklama — kart altı. */
  aiExplanation: string;
}

export interface StockClassifier {
  /** Sağlayıcı kimliği — `StockAnalysis.modelVersion`'a yazılır. */
  modelVersion: string;
  classify(metrics: StockMetrics): Promise<ClassificationResult>;
}

/**
 * Mock classifier — sayısal metriklere göre basit kural-bazlı atama yapar.
 * AI sağlayıcısı entegre edilene kadar `scripts/analyze-stocks.ts` bunu kullanabilir.
 * Gerçek AI gelince `ClaudeClassifier` veya `OpenAIClassifier` yazılıp swap edilir.
 */
export class MockClassifier implements StockClassifier {
  readonly modelVersion = "mock-rules-v1";

  async classify(metrics: StockMetrics): Promise<ClassificationResult> {
    const vol = metrics.volatility1y ?? 30;

    let risk: RiskLevel;
    if      (vol < 25) risk = "low";
    else if (vol < 45) risk = "medium";
    else               risk = "high";

    const horizon: Horizon = (metrics.cagr5y ?? 0) > 25 ? "long" : "short";

    const aiScore = Math.min(100, Math.max(0, 50 + (metrics.cagr5y ?? 0) / 2 - vol / 4));

    return {
      risk,
      horizon,
      aiScore,
      aiSummary:     `${metrics.name} için risk profili: ${risk}, vade önerisi: ${horizon}.`,
      aiExplanation: `Bu değerlendirme son dönem volatilite ve uzun vadeli getiri verilerine dayanmaktadır. Yatırım tavsiyesi değildir.`,
    };
  }
}
