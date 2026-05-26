import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import { PriceChart } from "@/components/PriceChart";
import { AnalysisCard } from "@/components/AnalysisCard";
import { CURRENCY_MAP } from "@/data/currencies";
import {
  fetchTruncgilToday,
  getTruncgilAsset,
  fmt,
} from "@/lib/market-data";

type Params = { code: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const currency = CURRENCY_MAP[params.code.toUpperCase()];
  return {
    title: currency
      ? `${currency.name} (${currency.code}) — Fonly`
      : "Döviz Detayı — Fonly"
  };
}

export default async function DovizDetailPage({ params }: { params: Params }) {
  const code     = params.code.toUpperCase();
  const currency = CURRENCY_MAP[code];
  if (!currency) notFound();

  const slug = `doviz-${code}`;

  // Truncgil — alış/satış spread'i ve günlük değişim
  const truncgil = await fetchTruncgilToday();
  const t        = getTruncgilAsset(truncgil, code);

  const buying    = t?.Buying  ?? null;
  const selling   = t?.Selling ?? null;
  const avg       = t ? (t.Buying + t.Selling) / 2 : 0;
  const changePct = t?.Change  ?? null;

  const displayAvg     = avg * currency.displayPer;
  const displayBuying  = buying  != null ? buying  * currency.displayPer : null;
  const displaySelling = selling != null ? selling * currency.displayPer : null;
  const spreadPct      = (buying && selling && buying > 0)
    ? ((selling - buying) / buying) * 100
    : null;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-5">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-mist/45">
          <Link href="/" className="transition hover:text-white">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/doviz" className="transition hover:text-white">Döviz</Link>
          <span>/</span>
          <span className="text-white">{currency.shortName}</span>
        </nav>

        {/* Hero kartı */}
        <div className="glass-card rounded-[1.75rem] p-6">
          <div className="flex flex-wrap items-start gap-4">
            <span className="text-5xl">{currency.flag}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-medium text-cyan-200">{currency.code}</p>
                {changePct != null && (
                  <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                    changePct >= 0
                      ? "bg-emerald-300/10 text-emerald-300"
                      : "bg-rose-300/10 text-rose-300"
                  }`}>
                    {changePct >= 0
                      ? <TrendingUp className="h-3 w-3" />
                      : <TrendingDown className="h-3 w-3" />}
                    {changePct >= 0 ? "+" : ""}{fmt(Math.abs(changePct), 2)}%
                  </span>
                )}
              </div>
              <h1 className="mt-0.5 text-2xl font-semibold text-white">
                {currency.name}
              </h1>
              {avg > 0 ? (
                <div className="mt-4">
                  {currency.displayPer > 1 && (
                    <p className="text-xs text-mist/50">
                      {currency.displayPer} {currency.code} =
                    </p>
                  )}
                  <p className="text-4xl font-semibold text-white">
                    {fmt(displayAvg, 2)}
                    <span className="ml-2 text-xl font-normal text-mist/45">TL</span>
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-mist/40 text-sm">Veri yüklenemedi</p>
              )}
            </div>
          </div>

          {/* Alış/Satış spread satırı — sadece truncgil verisi varsa */}
          {displayBuying != null && displaySelling != null && (
            <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-xl border border-emerald-200/14 bg-emerald-300/[0.04] px-3 py-2.5">
                <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-emerald-200/70">
                  <ArrowDownRight className="h-3 w-3" />
                  Alış
                </p>
                <p className="mt-0.5 text-base font-semibold text-white">
                  {fmt(displayBuying, 2)} <span className="text-xs font-normal text-mist/45">TL</span>
                </p>
              </div>
              <div className="rounded-xl border border-rose-200/14 bg-rose-300/[0.04] px-3 py-2.5">
                <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-rose-200/70">
                  <ArrowUpRight className="h-3 w-3" />
                  Satış
                </p>
                <p className="mt-0.5 text-base font-semibold text-white">
                  {fmt(displaySelling, 2)} <span className="text-xs font-normal text-mist/45">TL</span>
                </p>
              </div>
              {spreadPct != null && (
                <div className="rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-mist/40">
                    Makas
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-white">
                    %{fmt(spreadPct, 2)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Grafik kartı */}
        <div className="glass-card rounded-[1.75rem] p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">Fiyat Grafiği</h2>
          <p className="mb-5 text-xs text-mist/45">
            Yüzdesel değişim — {currency.shortName} vs Gram Altın (dönem başı = 0%)
          </p>
          <PriceChart slug={slug} />
        </div>

        {/* Basit analiz */}
        <AnalysisCard slug={slug} type="doviz" assetName={currency.name} />

      </div>
    </main>
  );
}
