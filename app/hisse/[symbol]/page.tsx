import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PriceChart } from "@/components/PriceChart";
import { AnalysisCard } from "@/components/AnalysisCard";
import { ChartSection } from "@/components/chart/ChartSection";
import { Tabs } from "@/components/chart/Tabs";
import { BIST_TICKERS } from "@/data/bist-tickers";

type Params = { symbol: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const sym  = params.symbol.toUpperCase();
  const meta = BIST_TICKERS.find(t => t.symbol === sym);
  if (!meta) return { title: sym };
  return {
    title: `${sym} · ${meta.name} Hisse Fiyatı`,
    description: `${meta.name} (${sym}) canlı hisse fiyatı, grafik, teknik analiz, finansallar, temettü geçmişi ve haberler.`,
  };
}

export default async function HisseGenelPage({ params }: { params: Params }) {
  const symbol = params.symbol.toUpperCase();
  const meta   = BIST_TICKERS.find(t => t.symbol === symbol);
  if (!meta) notFound();

  const slug = `hisse-${symbol}`;

  return (
    <>
      <ChartSection
        slug={slug}
        defaultTf="1Y"
        defaultType="candle"
        supportsCandle
        unit="₺"
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
                  Yüzdesel değişim — {meta.name} vs Gram Altın (dönem başı = 0%)
                </p>
                <PriceChart slug={slug} />
              </div>
            ),
          },
          {
            key:   "analysis",
            label: "Otomatik Analiz",
            content: <AnalysisCard slug={slug} type="hisse" assetName={meta.name} />,
          },
          {
            key:   "info",
            label: "Bilgi",
            content: (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-mist-3">
                    Gram altın neden karşılaştırılıyor?
                  </p>
                  <p className="text-sm leading-6 text-mist-3">
                    Türkiye&apos;de en yaygın bilinen yatırım aracı gram altındır. Hisse senedinin getirisi,
                    gram altına kıyasla değerlendirildiğinde &quot;gerçek anlamda kazandım mı?&quot; sorusunu
                    yanıtlamak kolaylaşır.
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-200/10 bg-rose-300/[0.03] p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-200/60">
                    Risk uyarısı
                  </p>
                  <p className="text-sm leading-6 text-mist-3">
                    Hisse senetleri yüksek risk içerebilir. Gösterilen veriler geçmiş performansa aittir
                    ve gelecekteki kazancı garanti etmez.
                  </p>
                </div>
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
