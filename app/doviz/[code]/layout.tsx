import { notFound } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { AssetHeader } from "@/components/chart/AssetHeader";
import { AssetHeaderActions } from "@/components/chart/AssetHeaderActions";
import { SubNav } from "@/components/chart/SubNav";
import { CURRENCY_MAP } from "@/data/currencies";
import { fetchTruncgilToday, getTruncgilAsset } from "@/lib/market-data";
import { fmtAsset, fmtPercent } from "@/lib/format";
import { DOVIZ_SUBNAV } from "@/lib/chart/subnav";

type Params = { code: string };

export default async function DovizLayout({
  children,
  params,
}: {
  children: ReactNode;
  params:   Params;
}) {
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

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <nav className="flex items-center gap-2 text-sm text-mist/45">
          <Link href="/" className="transition hover:text-white">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/doviz" className="transition hover:text-white">Döviz</Link>
          <span>/</span>
          <span className="text-white">{currency.shortName}</span>
        </nav>

        <AssetHeader
          tag={code}
          market={`${currency.flag} ${currency.shortName}`}
          name={currency.name}
          price={displayAvg}
          unit="TL"
          changePct={changePct}
          subtitle={currency.displayPer > 1
            ? `${currency.displayPer} ${currency.code} = ${fmtAsset(displayAvg, "currency")} TL`
            : undefined}
          slug={slug}
          displayPer={currency.displayPer}
          actions={
            <AssetHeaderActions
              slug={slug}
              currentPrice={avg}
              unit="TL"
              assetName={currency.name}
            />
          }
        />

        {displayBuying != null && displaySelling != null && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-xl border border-emerald-200/14 bg-emerald-300/[0.04] px-4 py-3">
              <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-emerald-200/70">
                <ArrowDownRight className="h-3 w-3" />
                Alış
              </p>
              <p className="mt-0.5 text-base font-semibold text-white">
                {fmtAsset(displayBuying, "currency")} <span className="text-xs font-normal text-mist/45">TL</span>
              </p>
            </div>
            <div className="rounded-xl border border-rose-200/14 bg-rose-300/[0.04] px-4 py-3">
              <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-rose-200/70">
                <ArrowUpRight className="h-3 w-3" />
                Satış
              </p>
              <p className="mt-0.5 text-base font-semibold text-white">
                {fmtAsset(displaySelling, "currency")} <span className="text-xs font-normal text-mist/45">TL</span>
              </p>
            </div>
            {spreadPct != null && (
              <div className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-mist/40">Makas</p>
                <p className="mt-0.5 text-base font-semibold text-white">%{fmtPercent(spreadPct)}</p>
              </div>
            )}
          </div>
        )}

        <SubNav basePath={`/doviz/${code}`} tabs={DOVIZ_SUBNAV} />

        {children}
      </div>
    </main>
  );
}
