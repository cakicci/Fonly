import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { fetchFundamentals } from "@/lib/yahoo/fundamentals";
import { FinancialsSection } from "@/components/financials/FinancialsSection";
import { BIST_TICKERS } from "@/data/bist-tickers";

type Params = { symbol: string };

export default async function HisseFinansallarPage({ params }: { params: Params }) {
  const symbol = params.symbol.toUpperCase();
  if (!BIST_TICKERS.find(t => t.symbol === symbol)) notFound();

  const data = await fetchFundamentals(symbol);

  if (!data) {
    return (
      <div className="glass-card flex items-start gap-3 rounded-2xl p-6">
        <div className="rounded-lg bg-rose-300/10 p-2">
          <AlertTriangle className="h-4 w-4 text-rose-200" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-mist">Veri yüklenemedi</h2>
          <p className="mt-1 text-sm text-mist-3">
            Yahoo Finance şu anda {symbol} için temel veri sunmuyor. Birkaç dakika sonra yeniden deneyin.
          </p>
        </div>
      </div>
    );
  }

  return <FinancialsSection data={data} />;
}
