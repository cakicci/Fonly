import { ChartSection } from "@/components/chart/ChartSection";

type Params = { symbol: string };

export default function HisseGrafikPage({ params }: { params: Params }) {
  const slug = `hisse-${params.symbol.toUpperCase()}`;
  return (
    <div className="flex flex-col gap-3">
      <ChartSection
        slug={slug}
        defaultTf="1Y"
        defaultType="candle"
        supportsCandle
        unit="₺"
        defaultIndicators={["sma20", "sma50", "bollinger"]}
        defaultShowVolume
        chartHeight={620}
      />
    </div>
  );
}
