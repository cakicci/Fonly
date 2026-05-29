/**
 * Seed: `data/stocks.ts` içindeki 18 elle yazılmış hisseyi `StockAnalysis`
 * tablosuna yazar. AI batch'i devreye girmeden önce kategori sayfalarının
 * boş kalmaması için. AI run'ı bu satırların üstüne yazıp `modelVersion`'ı
 * "seed" → "claude-opus-4-7" (veya benzeri) yapar.
 *
 * Çalıştırma:
 *   npx tsx scripts/seed-stock-analysis.ts
 */
import { PrismaClient } from "@prisma/client";
import { stocks } from "../data/stocks";
import { isBist30 } from "../data/bist30";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${stocks.length} stocks → StockAnalysis...`);

  for (const stock of stocks) {
    await prisma.stockAnalysis.upsert({
      where: { symbol: stock.symbol },
      create: {
        symbol:        stock.symbol,
        name:          stock.name,
        risk:          stock.risk,
        horizon:       stock.horizon,
        isWellKnown:   isBist30(stock.symbol),
        aiScore:       50,
        aiSummary:     stock.simpleTakeaway,
        aiExplanation: stock.explanation,
        modelVersion:  "seed",
      },
      update: {
        name:          stock.name,
        risk:          stock.risk,
        horizon:       stock.horizon,
        isWellKnown:   isBist30(stock.symbol),
        aiSummary:     stock.simpleTakeaway,
        aiExplanation: stock.explanation,
        modelVersion:  "seed",
        analyzedAt:    new Date(),
      },
    });
    console.log(`  ✓ ${stock.symbol.padEnd(6)} ${isBist30(stock.symbol) ? "[BIST30]" : "        "} ${stock.risk}/${stock.horizon}`);
  }

  const total = await prisma.stockAnalysis.count();
  const wellKnown = await prisma.stockAnalysis.count({ where: { isWellKnown: true } });
  console.log(`\nDone. Total: ${total}, BIST 30 (well-known): ${wellKnown}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
