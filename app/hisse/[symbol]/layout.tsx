import { notFound } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";
import { AssetHeader } from "@/components/chart/AssetHeader";
import { AssetHeaderActions } from "@/components/chart/AssetHeaderActions";
import { SubNavWithToggle } from "@/components/chart/SubNavWithToggle";
import { MicroLessonCard } from "@/components/MicroLessonCard";
import { BIST_TICKERS } from "@/data/bist-tickers";
import { fetchYahooChart } from "@/lib/market-data";
import { HISSE_SUBNAV } from "@/lib/chart/subnav";
import {
  stocks,
  RISK_LABELS, HORIZON_LABELS,
  RISK_COLORS, HORIZON_COLORS,
} from "@/data/stocks";

type Params = { symbol: string };

export default async function HisseLayout({
  children,
  params,
}: {
  children: ReactNode;
  params:   Params;
}) {
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
        <nav className="flex items-center gap-2 text-sm text-mist-3">
          <Link href="/" className="transition hover:text-mist">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/hisseler" className="transition hover:text-mist">Hisseler</Link>
          <span>/</span>
          <span className="text-mist">{symbol}</span>
        </nav>

        <AssetHeader
          tag={symbol}
          market="BIST"
          name={meta.name}
          price={result?.price ?? 0}
          unit="₺"
          changePct={result?.changePercent ?? null}
          badges={badges}
          slug={slug}
          actions={
            <AssetHeaderActions
              slug={slug}
              currentPrice={result?.price ?? 0}
              unit="₺"
              assetName={meta.name}
            />
          }
        />

        <MicroLessonCard
          id="hisse"
          title="Hisse senedi nedir?"
          body="Bir hisse senedi aldığında, o şirketin küçük bir ortağı olursun. Şirket değer kazanırsa hissenin fiyatı da genelde yükselir; bazı şirketler kârının bir kısmını ortaklarına temettü olarak dağıtır."
          guideHref="/rehber/3"
        />

        <SubNavWithToggle basePath={`/hisse/${symbol}`} tabs={HISSE_SUBNAV} />

        {children}
      </div>
    </main>
  );
}
