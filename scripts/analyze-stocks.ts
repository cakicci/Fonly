/**
 * Batch script: tüm BIST hisselerini analiz eder ve `StockAnalysis` tablosunu
 * günceller. Vercel Cron veya GitHub Actions ile günde bir kez tetiklenir.
 *
 * Şu an İSKELET: AI sağlayıcısı seçilmediği için yalnızca sayısal metrik
 * hesaplayan `MockClassifier` kullanır. Gerçek AI eklenince:
 *   1. `lib/ai/claude-classifier.ts` yazılır (StockClassifier implementer'ı)
 *   2. Aşağıdaki `classifier` değişkeni o sınıfa swap edilir
 *   3. Geri kalan akış aynı kalır
 *
 * TODO (AI entegrasyonu):
 *   - `lib/analysis/stock-metrics.ts` — Yahoo OHLC'den volatilite/CAGR/drawdown hesabı
 *   - `lib/ai/claude-classifier.ts` — Anthropic SDK + structured JSON output
 *   - .env'e ANTHROPIC_API_KEY eklenir
 *   - Bu dosyada rate limiting (~10 req/sn) + retry loop
 *
 * Çalıştırma:
 *   npx tsx scripts/analyze-stocks.ts
 */
import { PrismaClient } from "@prisma/client";
import { BIST_TICKERS } from "../data/bist-tickers";
import { isBist30 } from "../data/bist30";
import { MockClassifier, type StockClassifier, type StockMetrics } from "../lib/ai/classify-stock";

const prisma = new PrismaClient();

// AI entegre edildiğinde burayı `new ClaudeClassifier(...)` ile değiştir.
const classifier: StockClassifier = new MockClassifier();

async function fetchMetrics(symbol: string, name: string): Promise<StockMetrics> {
  // TODO: gerçek hesaplama. Şu an mock değerler döner.
  // İmplementasyon: `lib/chart/ohlc.ts` ile 5y daily data çek → hesapla.
  return {
    symbol,
    name,
    volatility1y:   null,
    maxDrawdown5y:  null,
    cagr5y:         null,
    avgDailyVolume: null,
    sector:         null,
  };
}

async function main() {
  console.log(`Analyzing ${BIST_TICKERS.length} BIST tickers via ${classifier.modelVersion}...`);

  let ok = 0, err = 0;

  for (const ticker of BIST_TICKERS) {
    try {
      const metrics = await fetchMetrics(ticker.symbol, ticker.name);
      const result  = await classifier.classify(metrics);

      await prisma.stockAnalysis.upsert({
        where: { symbol: ticker.symbol },
        create: {
          symbol:        ticker.symbol,
          name:          ticker.name,
          risk:          result.risk,
          horizon:       result.horizon,
          isWellKnown:   isBist30(ticker.symbol),
          aiScore:       result.aiScore,
          aiSummary:     result.aiSummary,
          aiExplanation: result.aiExplanation,
          modelVersion:  classifier.modelVersion,
        },
        update: {
          name:          ticker.name,
          risk:          result.risk,
          horizon:       result.horizon,
          isWellKnown:   isBist30(ticker.symbol),
          aiScore:       result.aiScore,
          aiSummary:     result.aiSummary,
          aiExplanation: result.aiExplanation,
          modelVersion:  classifier.modelVersion,
          analyzedAt:    new Date(),
        },
      });
      ok++;
    } catch (e) {
      console.error(`  ✗ ${ticker.symbol}:`, e);
      err++;
    }
  }

  console.log(`\nDone. OK: ${ok}, Errors: ${err}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
