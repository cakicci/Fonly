import { notFound } from "next/navigation";
import { HistoricalTable } from "@/components/historical/HistoricalTable";
import { GOLD_TYPE_MAP } from "@/data/gold-types";

type Params = { type: string };

export default function AltinTarihselPage({ params }: { params: Params }) {
  const goldType = GOLD_TYPE_MAP[params.type.toLowerCase()];
  if (!goldType) notFound();
  if (!goldType.weightG) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-sm text-mist/55">
        Bu altın türü için tarihsel OHLC verisi yok.
      </div>
    );
  }
  return <HistoricalTable slug={`altin-${goldType.type}`} assetName={goldType.name} />;
}
