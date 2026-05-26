import { NextResponse } from "next/server";
import { BIST_TICKERS } from "@/data/bist-tickers";

export interface BistStock {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
  raw: number;
}

const BATCH = 20; // paralel istek boyutu

async function fetchOne(symbol: string): Promise<{ price: number; changePercent: number } | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.IS?interval=1d&range=2d`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 60 }
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    const price: number = meta.regularMarketPrice;
    const prev: number = meta.chartPreviousClose ?? price;
    return { price, changePercent: ((price - prev) / prev) * 100 };
  } catch {
    return null;
  }
}

function fmt(v: number, d = 2) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
}

export async function GET() {
  const stocks: BistStock[] = [];

  // Batch'ler halinde paralel fetch
  for (let i = 0; i < BIST_TICKERS.length; i += BATCH) {
    const batch = BIST_TICKERS.slice(i, i + BATCH);
    const results = await Promise.all(batch.map((t) => fetchOne(t.symbol)));

    for (let j = 0; j < batch.length; j++) {
      const ticker = batch[j];
      const result = results[j];
      if (!result) continue;

      stocks.push({
        symbol: ticker.symbol,
        name: ticker.name,
        price: `${fmt(result.price, 2)} ₺`,
        change: `${result.changePercent >= 0 ? "+" : ""}${fmt(result.changePercent, 2)}%`,
        isPositive: result.changePercent >= 0,
        raw: result.price
      });
    }
  }

  // İsme göre sırala
  stocks.sort((a, b) => a.symbol.localeCompare(b.symbol));

  return NextResponse.json({ stocks, updatedAt: new Date().toISOString() });
}
