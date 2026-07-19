import { notFound } from "next/navigation";
import { TechnicalSection } from "@/components/chart/TechnicalSection";
import { GOLD_TYPE_MAP } from "@/data/gold-types";

type Params = { type: string };

export default function AltinTeknikPage({ params }: { params: Params }) {
  const goldType = GOLD_TYPE_MAP[params.type.toLowerCase()];
  if (!goldType) notFound();
  if (!goldType.weightG) {
    return (
      <div className="rounded-2xl border border-line bg-white/[0.02] p-6 text-sm text-mist-3">
        Antika / ayar / gümüş türleri için teknik analiz mevcut değil; geçmiş OHLC verisi olmadan
        indikatör hesaplanamıyor.
      </div>
    );
  }
  return <TechnicalSection slug={`altin-${goldType.type}`} defaultTf="1D" />;
}
