import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PriceChart } from "@/components/PriceChart";
import { AnalysisCard } from "@/components/AnalysisCard";
import { ChartSection } from "@/components/chart/ChartSection";
import { Tabs } from "@/components/chart/Tabs";
import { CURRENCY_MAP } from "@/data/currencies";
import { supportsCandleForSlug } from "@/lib/chart/ohlc";

type Params = { code: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const currency = CURRENCY_MAP[params.code.toUpperCase()];
  if (!currency) return { title: "Döviz Detayı" };
  return {
    title: `${currency.name} (${currency.code}) Kuru — Canlı Alış Satış`,
    description: `Canlı ${currency.name} kuru: anlık alış/satış, günlük değişim, geçmiş grafikler ve otomatik analiz.`,
  };
}

export default function DovizGenelPage({ params }: { params: Params }) {
  const code     = params.code.toUpperCase();
  const currency = CURRENCY_MAP[code];
  if (!currency) notFound();

  const slug = `doviz-${code}`;
  const candleSupported = supportsCandleForSlug(slug);

  return (
    <>
      <ChartSection
        slug={slug}
        defaultTf="1Y"
        defaultType="candle"
        supportsCandle={candleSupported}
        unit=""
      />

      <Tabs
        defaultKey="comparison"
        tabs={[
          {
            key:   "comparison",
            label: "Altın Karşılaştırma",
            content: (
              <div className="glass-card rounded-section p-6">
                <h2 className="mb-1 text-lg font-semibold text-white">Gram Altına Göre Performans</h2>
                <p className="mb-5 text-xs text-mist-3">
                  Yüzdesel değişim — {currency.shortName} vs Gram Altın (dönem başı = 0%)
                </p>
                <PriceChart slug={slug} />
              </div>
            ),
          },
          {
            key:   "analysis",
            label: "Otomatik Analiz",
            content: <AnalysisCard slug={slug} type="doviz" assetName={currency.name} />,
          },
        ]}
      />
    </>
  );
}
