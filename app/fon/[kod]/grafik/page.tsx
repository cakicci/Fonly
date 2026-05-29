import { ChartSection } from "@/components/chart/ChartSection";

type Params = { kod: string };

export default function FonGrafikPage({ params }: { params: Params }) {
  const kod = params.kod.toUpperCase();
  return (
    <div className="flex flex-col gap-3">
      <ChartSection
        slug={`fon-${kod}`}
        defaultTf="1Y"
        defaultType="line"
        supportsCandle={false}
        unit="₺"
        defaultIndicators={["sma20", "sma50", "bollinger"]}
        chartHeight={620}
      />
    </div>
  );
}
