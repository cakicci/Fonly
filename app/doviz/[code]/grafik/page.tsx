import { notFound } from "next/navigation";
import { ChartSection } from "@/components/chart/ChartSection";
import { CURRENCY_MAP } from "@/data/currencies";
import { supportsCandleForSlug } from "@/lib/chart/ohlc";

type Params = { code: string };

export default function DovizGrafikPage({ params }: { params: Params }) {
  const code = params.code.toUpperCase();
  if (!CURRENCY_MAP[code]) notFound();

  const slug = `doviz-${code}`;
  const canCandle = supportsCandleForSlug(slug);
  return (
    <div className="flex flex-col gap-3">
      <ChartSection
        slug={slug}
        defaultTf="1Y"
        defaultType={canCandle ? "candle" : "line"}
        supportsCandle={canCandle}
        unit=""
        defaultIndicators={["sma20", "sma50", "bollinger"]}
        defaultShowVolume
        chartHeight={620}
      />
    </div>
  );
}
