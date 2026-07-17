import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { fetchStockEvents } from "@/lib/yahoo/events";
import { DividendSection } from "@/components/events/DividendSection";
import { BIST_TICKERS } from "@/data/bist-tickers";

type Params = { symbol: string };

export default async function HisseTemettuPage({ params }: { params: Params }) {
  const symbol = params.symbol.toUpperCase();
  if (!BIST_TICKERS.find(t => t.symbol === symbol)) notFound();

  const events = await fetchStockEvents(symbol);

  if (!events) {
    return (
      <div className="glass-card flex items-start gap-3 rounded-2xl p-6">
        <div className="rounded-lg bg-rose-300/10 p-2">
          <AlertTriangle className="h-4 w-4 text-rose-200" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Temettü verisi alınamadı</h2>
          <p className="mt-1 text-sm text-mist-3">
            Yahoo Finance şu anda {symbol} için temettü verisi sunmuyor.
          </p>
        </div>
      </div>
    );
  }

  return <DividendSection payments={events.dividends} />;
}
