import { notFound } from "next/navigation";
import { ChartSection } from "@/components/chart/ChartSection";
import { GOLD_TYPE_MAP } from "@/data/gold-types";
import { supportsCandleForSlug } from "@/lib/chart/ohlc";

type Params = { type: string };

export default function AltinGrafikPage({ params }: { params: Params }) {
  const goldType = GOLD_TYPE_MAP[params.type.toLowerCase()];
  if (!goldType) notFound();
  if (!goldType.weightG) {
    return (
      <div className="rounded-2xl border border-line bg-white/[0.02] p-6 text-sm text-mist-3">
        {goldType.name} için detaylı grafik mevcut değil (Yahoo Finance ticker&apos;ı yok).
      </div>
    );
  }

  const slug = `altin-${goldType.type}`;
  const canCandle = supportsCandleForSlug(slug);
  return (
    <div className="flex flex-col gap-3">
      <ChartSection
        slug={slug}
        defaultTf="1Y"
        defaultType={canCandle ? "candle" : "line"}
        supportsCandle={canCandle}
        unit="₺"
        defaultIndicators={["sma20", "sma50", "bollinger"]}
        defaultShowVolume
        chartHeight={620}
      />
    </div>
  );
}
