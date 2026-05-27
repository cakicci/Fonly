import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { PriceChart } from "@/components/PriceChart";
import { AnalysisCard } from "@/components/AnalysisCard";
import { AssetHeader } from "@/components/chart/AssetHeader";
import { AssetHeaderActions } from "@/components/chart/AssetHeaderActions";
import { ChartSection } from "@/components/chart/ChartSection";
import { GlobalWatchlistDrawer } from "@/components/chart/GlobalWatchlistDrawer";
import { Tabs } from "@/components/chart/Tabs";
import {
  GOLD_TYPE_MAP,
  GOLD_TYPES,
  GOLD_CATEGORY_LABELS,
} from "@/data/gold-types";
import { fetchTruncgilToday, getTruncgilAsset, fmt } from "@/lib/market-data";

type Params = { type: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const gold = GOLD_TYPE_MAP[params.type.toLowerCase()];
  return {
    title: gold ? `${gold.name} — Fonly` : "Altın Detayı — Fonly",
  };
}

async function loadPrice(goldType: typeof GOLD_TYPES[number]) {
  const truncgil = await fetchTruncgilToday();
  const t = getTruncgilAsset(truncgil, goldType.truncgilKey);
  if (!t) return { buying: null, selling: 0, avg: 0, changePct: null };
  return {
    buying:    t.Buying || null,
    selling:   t.Selling,
    avg:       (t.Buying + t.Selling) / 2 || t.Selling,
    changePct: t.Change,
  };
}

export default async function AltinDetailPage({ params }: { params: Params }) {
  const goldType = GOLD_TYPE_MAP[params.type.toLowerCase()];
  if (!goldType) notFound();

  const slug  = `altin-${goldType.type}`;
  const price = await loadPrice(goldType);
  const spreadPct = (price.buying && price.selling && price.buying > 0)
    ? ((price.selling - price.buying) / price.buying) * 100
    : null;

  const sameCategory = GOLD_TYPES.filter(g => g.category === goldType.category);

  // Yahoo'da yalnızca standart 4'ün ticker'ı var (GC=F + ağırlık dönüşümü)
  const supportsCandle = !!goldType.weightG;

  const tabs = [
    {
      key:   "comparison",
      label: "Altın Karşılaştırma",
      content: supportsCandle ? (
        <div className="glass-card rounded-[1.75rem] p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">Dolar/TL Karşılaştırması</h2>
          <p className="mb-5 text-xs text-mist/45">
            Yüzdesel değişim — {goldType.name} vs Dolar/TL kuru (dönem başı = 0%)
          </p>
          <PriceChart slug={slug} />
        </div>
      ) : (
        <p className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-sm text-mist/45">
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
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-mist/45">
          <Link href="/" className="transition hover:text-white">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/altin" className="transition hover:text-white">Altın</Link>
          <span>/</span>
          <span className="text-white">{goldType.name}</span>
        </nav>

        <AssetHeader
          tag={goldType.category === "gumus" ? "🥈" : "🥇"}
          market={GOLD_CATEGORY_LABELS[goldType.category]}
          name={goldType.name}
          price={price.avg}
          unit="TL"
          changePct={price.changePct}
          slug={slug}
          actions={<AssetHeaderActions slug={slug} currentPrice={price.avg} unit="TL" assetName={goldType.name} />}
        />

        {/* Alış / Satış / Makas */}
        {price.buying != null && price.selling > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-xl border border-emerald-200/14 bg-emerald-300/[0.04] px-4 py-3">
              <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-emerald-200/70">
                <ArrowDownRight className="h-3 w-3" />
                Alış
              </p>
              <p className="mt-0.5 text-base font-semibold text-white">
                {fmt(price.buying, 2)} <span className="text-xs font-normal text-mist/45">TL</span>
              </p>
            </div>
            <div className="rounded-xl border border-rose-200/14 bg-rose-300/[0.04] px-4 py-3">
              <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-rose-200/70">
                <ArrowUpRight className="h-3 w-3" />
                Satış
              </p>
              <p className="mt-0.5 text-base font-semibold text-white">
                {fmt(price.selling, 2)} <span className="text-xs font-normal text-mist/45">TL</span>
              </p>
            </div>
            {spreadPct != null && (
              <div className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-mist/40">Makas</p>
                <p className="mt-0.5 text-base font-semibold text-white">%{fmt(spreadPct, 2)}</p>
              </div>
            )}
          </div>
        )}

        {/* Kategori içi hızlı gezinme */}
        <div className="flex flex-wrap gap-2">
          {sameCategory.map(g => (
            <Link
              key={g.type}
              href={`/altin/${g.type}`}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                g.type === goldType.type
                  ? "border-amber-300/40 bg-amber-300/12 text-amber-200"
                  : "border-white/8 text-mist/50 hover:border-white/20 hover:text-white"
              }`}
            >
              {g.nameShort}
            </Link>
          ))}
        </div>

        {/* Ana grafik — sadece standart 4 için */}
        {supportsCandle ? (
          <ChartSection
            slug={slug}
            defaultTf="1Y"
            defaultType="candle"
            supportsCandle
            unit="$"
          />
        ) : (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
            <p className="text-sm text-mist/55">
              Bu altın türü için profesyonel grafik mevcut değil (Yahoo Finance ticker&apos;ı yok).
              Yukarıdaki anlık fiyat ve günlük değişim güncel verilerdir.
            </p>
          </div>
        )}

        <Tabs defaultKey="comparison" tabs={tabs} />

      </div>
      <GlobalWatchlistDrawer />
    </main>
  );
}
