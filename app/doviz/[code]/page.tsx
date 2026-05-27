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
import { CURRENCY_MAP } from "@/data/currencies";
import { fetchTruncgilToday, getTruncgilAsset, fmt } from "@/lib/market-data";

type Params = { code: string };

// Yahoo'da grafik ticker'ı olan dövizler — diğerlerinde line zorla
const YAHOO_FOREX_AVAILABLE = new Set(["USD", "EUR", "GBP", "CHF", "JPY", "CNY", "CAD", "AUD"]);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const currency = CURRENCY_MAP[params.code.toUpperCase()];
  return {
    title: currency
      ? `${currency.name} (${currency.code}) — Fonly`
      : "Döviz Detayı — Fonly",
  };
}

export default async function DovizDetailPage({ params }: { params: Params }) {
  const code     = params.code.toUpperCase();
  const currency = CURRENCY_MAP[code];
  if (!currency) notFound();

  const slug = `doviz-${code}`;
  const truncgil = await fetchTruncgilToday();
  const t = getTruncgilAsset(truncgil, code);

  const buying    = t?.Buying  ?? null;
  const selling   = t?.Selling ?? null;
  const avg       = t ? (t.Buying + t.Selling) / 2 : 0;
  const changePct = t?.Change  ?? null;
  const spreadPct = (buying && selling && buying > 0)
    ? ((selling - buying) / buying) * 100
    : null;
  const displayAvg     = avg * currency.displayPer;
  const displayBuying  = buying  != null ? buying  * currency.displayPer : null;
  const displaySelling = selling != null ? selling * currency.displayPer : null;

  const candleSupported = YAHOO_FOREX_AVAILABLE.has(code);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-mist/45">
          <Link href="/" className="transition hover:text-white">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/doviz" className="transition hover:text-white">Döviz</Link>
          <span>/</span>
          <span className="text-white">{currency.shortName}</span>
        </nav>

        {/* Asset header */}
        <AssetHeader
          tag={code}
          market={`${currency.flag} ${currency.shortName}`}
          name={currency.name}
          price={displayAvg}
          unit="TL"
          changePct={changePct}
          subtitle={currency.displayPer > 1 ? `${currency.displayPer} ${currency.code} = ${fmt(displayAvg, 2)} TL` : undefined}
          slug={slug}
          displayPer={currency.displayPer}
          actions={<AssetHeaderActions slug={slug} currentPrice={avg} unit="TL" assetName={currency.name} />}
        />

        {/* Alış / Satış / Makas */}
        {displayBuying != null && displaySelling != null && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-xl border border-emerald-200/14 bg-emerald-300/[0.04] px-4 py-3">
              <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-emerald-200/70">
                <ArrowDownRight className="h-3 w-3" />
                Alış
              </p>
              <p className="mt-0.5 text-base font-semibold text-white">
                {fmt(displayBuying, 2)} <span className="text-xs font-normal text-mist/45">TL</span>
              </p>
            </div>
            <div className="rounded-xl border border-rose-200/14 bg-rose-300/[0.04] px-4 py-3">
              <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-rose-200/70">
                <ArrowUpRight className="h-3 w-3" />
                Satış
              </p>
              <p className="mt-0.5 text-base font-semibold text-white">
                {fmt(displaySelling, 2)} <span className="text-xs font-normal text-mist/45">TL</span>
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

        {/* Ana grafik */}
        <ChartSection
          slug={slug}
          defaultTf="1Y"
          defaultType="candle"
          supportsCandle={candleSupported}
          unit=""
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

      </div>
      <GlobalWatchlistDrawer />
    </main>
  );
}
