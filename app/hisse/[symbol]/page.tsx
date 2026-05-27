import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { PriceChart } from "@/components/PriceChart";
import { AnalysisCard } from "@/components/AnalysisCard";
import { AssetHeader } from "@/components/chart/AssetHeader";
import { AssetHeaderActions } from "@/components/chart/AssetHeaderActions";
import { ChartSection } from "@/components/chart/ChartSection";
import { GlobalWatchlistDrawer } from "@/components/chart/GlobalWatchlistDrawer";
import { Tabs } from "@/components/chart/Tabs";
import { BIST_TICKERS } from "@/data/bist-tickers";
import { fetchYahooChart } from "@/lib/market-data";
import { stocks, RISK_LABELS, HORIZON_LABELS, RISK_COLORS, HORIZON_COLORS } from "@/data/stocks";

type Params = { symbol: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const sym  = params.symbol.toUpperCase();
  const meta = BIST_TICKERS.find(t => t.symbol === sym);
  return {
    title: meta ? `${sym} · ${meta.name} — Fonly` : `${sym} — Fonly`
  };
}

export default async function HisseDetailPage({ params }: { params: Params }) {
  const symbol = params.symbol.toUpperCase();
  const meta   = BIST_TICKERS.find(t => t.symbol === symbol);
  if (!meta) notFound();

  const slug      = `hisse-${symbol}`;
  const stockMeta = stocks.find(s => s.symbol === symbol);
  const result    = await fetchYahooChart(`${symbol}.IS`);

  const badges = stockMeta && (
    <>
      <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-medium ${RISK_COLORS[stockMeta.risk]}`}>
        {RISK_LABELS[stockMeta.risk]}
      </span>
      <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-medium ${HORIZON_COLORS[stockMeta.horizon]}`}>
        {HORIZON_LABELS[stockMeta.horizon]}
      </span>
    </>
  );

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-mist/45">
          <Link href="/" className="transition hover:text-white">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/hisseler" className="transition hover:text-white">Hisseler</Link>
          <span>/</span>
          <span className="text-white">{symbol}</span>
        </nav>

        {/* Asset header */}
        <AssetHeader
          tag={symbol}
          market="BIST"
          name={meta.name}
          price={result?.price ?? 0}
          unit="₺"
          changePct={result?.changePercent ?? null}
          badges={badges}
          slug={slug}
          actions={<AssetHeaderActions slug={slug} currentPrice={result?.price ?? 0} unit="₺" assetName={meta.name} />}
        />

        {/* Ana profesyonel grafik */}
        <ChartSection
          slug={slug}
          defaultTf="1Y"
          defaultType="candle"
          supportsCandle
          unit="₺"
        />

        {/* Alt sekmeler */}
        <Tabs
          defaultKey="comparison"
          tabs={[
            {
              key:   "comparison",
              label: "Altın Karşılaştırma",
              content: (
                <div className="glass-card rounded-[1.75rem] p-6">
                  <h2 className="mb-1 text-lg font-semibold text-white">Gram Altına Göre Performans</h2>
                  <p className="mb-5 text-xs text-mist/45">
                    Yüzdesel değişim — {meta.name} vs Gram Altın (dönem başı = 0%)
                  </p>
                  <PriceChart slug={slug} />
                </div>
              ),
            },
            {
              key:   "analysis",
              label: "Otomatik Analiz",
              content: (
                <AnalysisCard slug={slug} type="hisse" assetName={meta.name} />
              ),
            },
            {
              key:   "info",
              label: "Bilgi",
              content: (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-mist/35">
                      Gram altın neden karşılaştırılıyor?
                    </p>
                    <p className="text-sm leading-6 text-mist/58">
                      Türkiye&apos;de en yaygın bilinen yatırım aracı gram altındır. Hisse senedinin getirisi,
                      gram altına kıyasla değerlendirildiğinde &quot;gerçek anlamda kazandım mı?&quot; sorusunu
                      yanıtlamak kolaylaşır.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-200/10 bg-rose-300/[0.03] p-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-200/60">
                      Risk uyarısı
                    </p>
                    <p className="text-sm leading-6 text-mist/55">
                      Hisse senetleri yüksek risk içerebilir. Gösterilen veriler geçmiş performansa aittir
                      ve gelecekteki kazancı garanti etmez.
                    </p>
                  </div>
                </div>
              ),
            },
          ]}
        />

      </div>
      <GlobalWatchlistDrawer />
    </main>
  );
}
