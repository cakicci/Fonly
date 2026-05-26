import { notFound } from "next/navigation";
import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import { PriceChart } from "@/components/PriceChart";
import { AnalysisCard } from "@/components/AnalysisCard";
import { BIST_TICKERS } from "@/data/bist-tickers";
import { fetchYahooChart, fmt } from "@/lib/market-data";
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
  const symbol    = params.symbol.toUpperCase();
  const meta      = BIST_TICKERS.find(t => t.symbol === symbol);
  if (!meta) notFound();

  const slug      = `hisse-${symbol}`;
  const ticker    = `${symbol}.IS`;
  // data/stocks.ts'teki ek meta (risk, horizon) — olmayabilir
  const stockMeta = stocks.find(s => s.symbol === symbol);

  // Güncel fiyat (sunucu tarafı)
  const result = await fetchYahooChart(ticker);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-5">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-mist/45">
          <Link href="/" className="transition hover:text-white">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/#stocks" className="transition hover:text-white">Hisseler</Link>
          <span>/</span>
          <span className="text-white">{symbol}</span>
        </nav>

        {/* Hero kartı */}
        <div className="rounded-[1.75rem] border border-emerald-200/16
                        bg-[linear-gradient(135deg,rgba(45,227,168,0.08),rgba(12,24,22,0.96))] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-emerald-300/12 px-2 py-0.5 text-xs font-bold text-emerald-300">
                  {symbol}
                </span>
                <p className="text-xs text-mist/45">BIST</p>
                {/* Risk + Vade badge (sadece stocks.ts'te varsa) */}
                {stockMeta && (
                  <>
                    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-medium ${RISK_COLORS[stockMeta.risk]}`}>
                      {RISK_LABELS[stockMeta.risk]}
                    </span>
                    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-medium ${HORIZON_COLORS[stockMeta.horizon]}`}>
                      {HORIZON_LABELS[stockMeta.horizon]}
                    </span>
                  </>
                )}
              </div>
              <h1 className="mt-2 text-2xl font-semibold text-white">{meta.name}</h1>
              {result ? (
                <div className="mt-4 flex items-end gap-3">
                  <p className="text-4xl font-semibold text-white">
                    {fmt(result.price, 2)}
                    <span className="ml-1.5 text-xl font-normal text-mist/45">₺</span>
                  </p>
                  <div
                    className={`mb-1 flex items-center gap-1 text-sm font-semibold ${
                      result.changePercent >= 0 ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {result.changePercent >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {result.changePercent >= 0 ? "+" : ""}
                    {fmt(result.changePercent, 2)}%
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-mist/40">Veri yüklenemedi</p>
              )}
            </div>
          </div>
        </div>

        {/* Grafik kartı */}
        <div className="glass-card rounded-[1.75rem] p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">Fiyat Grafiği</h2>
          <p className="mb-5 text-xs text-mist/45">
            Yüzdesel değişim — {meta.name} vs Gram Altın (dönem başı = 0%)
          </p>
          <PriceChart slug={slug} />
        </div>

        {/* Basit analiz */}
        <AnalysisCard slug={slug} type="hisse" assetName={meta.name} />

        {/* Gram altın karşılaştırma açıklaması */}
        <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-mist/35">
            Gram altın neden karşılaştırılıyor?
          </p>
          <p className="text-sm leading-6 text-mist/58">
            Türkiye&apos;de en yaygın bilinen yatırım aracı gram altındır. Hisse senedinin getirisi,
            gram altına kıyasla değerlendirildiğinde &quot;gerçek anlamda kazandım mı?&quot; sorusunu
            yanıtlamak kolaylaşır. Grafikteki sarı çizgi gram altını, renkli çizgi ise bu hisseyi
            temsil eder; her ikisi de dönem başına göre % değişim olarak gösterilir.
          </p>
        </div>

        {/* Risk uyarısı */}
        <div className="rounded-2xl border border-rose-200/10 bg-rose-300/[0.03] p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-200/60">
            Risk uyarısı
          </p>
          <p className="text-sm leading-6 text-mist/55">
            Hisse senetleri yüksek risk içerebilir. Gösterilen veriler geçmiş performansa aittir
            ve gelecekteki kazancı garanti etmez. Yatırım kararı vermeden önce mali danışmanlık
            almanız önerilir.
          </p>
        </div>

      </div>
    </main>
  );
}
