import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PriceChart } from "@/components/PriceChart";
import { AnalysisCard } from "@/components/AnalysisCard";
import { ChartSection } from "@/components/chart/ChartSection";
import { Tabs } from "@/components/chart/Tabs";
import { GOLD_TYPE_MAP } from "@/data/gold-types";

type Params = { type: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const gold = GOLD_TYPE_MAP[params.type.toLowerCase()];
  if (!gold) return { title: "Altın Detayı" };
  return {
    title: `${gold.name} Fiyatı — Canlı Alış Satış`,
    description: `Canlı ${gold.name.toLowerCase()} fiyatı: anlık alış/satış, günlük değişim, geçmiş grafikler ve otomatik analiz.`,
  };
}

export default function AltinGenelPage({ params }: { params: Params }) {
  const goldType = GOLD_TYPE_MAP[params.type.toLowerCase()];
  if (!goldType) notFound();

  const slug = `altin-${goldType.type}`;
  const supportsCandle = !!goldType.weightG;

  const tabs = [
    {
      key:   "comparison",
      label: "Altın Karşılaştırma",
      content: supportsCandle ? (
        <div className="glass-card rounded-section p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">Dolar/TL Karşılaştırması</h2>
          <p className="mb-5 text-xs text-mist-3">
            Yüzdesel değişim — {goldType.name} vs Dolar/TL kuru (dönem başı = 0%)
          </p>
          <PriceChart slug={slug} />
        </div>
      ) : (
        <p className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-sm text-mist-3">
          {goldType.name} için geçmiş veri kaynağı yok (Yahoo Finance ticker&apos;ı bulunmuyor).
          Sadece anlık fiyat görüntülenebiliyor.
        </p>
      ),
    },
    ...(supportsCandle ? [{
      key:   "analysis",
      label: "Otomatik Analiz",
      content: <AnalysisCard slug={slug} type="altin" assetName={goldType.name} />,
    }] : []),
  ];

  return (
    <>
      {supportsCandle ? (
        <ChartSection
          slug={slug}
          defaultTf="1Y"
          defaultType="candle"
          supportsCandle
          unit="₺"
        />
      ) : (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
          <p className="text-sm text-mist-3">
            Bu altın türü için profesyonel grafik mevcut değil (Yahoo Finance ticker&apos;ı yok).
            Yukarıdaki anlık fiyat ve günlük değişim güncel verilerdir.
          </p>
        </div>
      )}

      <Tabs defaultKey="comparison" tabs={tabs} />
    </>
  );
}
