import { NextRequest, NextResponse } from "next/server";
import { fetchFundamentals } from "@/lib/yahoo/fundamentals";
import { BIST_TICKERS } from "@/data/bist-tickers";

/**
 * GET /api/financials/[symbol]
 *
 * Yahoo Finance temel verisini sembol için döner — gelir tablosu (4 yıllık)
 * + anahtar oranlar. TR hisselerinde bilanço / nakit akışı boş gelir; istemci
 * `hasBalanceSheet`/`hasCashflow` flag'lerini kontrol ederek karar verir.
 *
 * 1 saat upstream cache (revalidate=3600). Sayfa server component'i edge'de
 * SSR ediyorsa bu noktada zaten cache hit olur; ek client polling yok.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { symbol: string } },
) {
  const symbol = params.symbol.toUpperCase();
  if (!BIST_TICKERS.find(t => t.symbol === symbol)) {
    return NextResponse.json(
      { error: "Sembol bulunamadı." },
      { status: 404 },
    );
  }

  const data = await fetchFundamentals(symbol);
  if (!data) {
    return NextResponse.json(
      { error: "Finansal veri çekilemedi." },
      { status: 502 },
    );
  }

  return NextResponse.json(data);
}
