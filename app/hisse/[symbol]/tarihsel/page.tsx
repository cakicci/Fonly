import { notFound } from "next/navigation";
import { HistoricalTable } from "@/components/historical/HistoricalTable";
import { BIST_TICKERS } from "@/data/bist-tickers";

type Params = { symbol: string };

export default function HisseTarihselPage({ params }: { params: Params }) {
  const symbol = params.symbol.toUpperCase();
  const meta   = BIST_TICKERS.find(t => t.symbol === symbol);
  if (!meta) notFound();

  return <HistoricalTable slug={`hisse-${symbol}`} assetName={meta.name} />;
}
