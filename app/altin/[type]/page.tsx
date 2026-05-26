import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import { PriceChart } from "@/components/PriceChart";
import { AnalysisCard } from "@/components/AnalysisCard";
import {
  GOLD_TYPE_MAP,
  GOLD_TYPES,
  GOLD_CATEGORY_LABELS,
  type GoldCategory,
} from "@/data/gold-types";
import {
  fetchTruncgilToday,
  getTruncgilAsset,
  fmt,
} from "@/lib/market-data";

type Params = { type: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const gold = GOLD_TYPE_MAP[params.type.toLowerCase()];
  return {
    title: gold ? `${gold.name} — Fonly` : "Altın Detayı — Fonly"
  };
}

/** Truncgil verilerinden alış/satış/değişim çıkarır. Veri yoksa avg=0. */
async function loadPrice(goldType: typeof GOLD_TYPES[number]) {
  const truncgil = await fetchTruncgilToday();
  const t        = getTruncgilAsset(truncgil, goldType.truncgilKey);

  if (!t) {
    return { buying: null, selling: 0, avg: 0, changePct: null };
  }
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

  const slug   = `altin-${goldType.type}`;
  const price  = await loadPrice(goldType);
  const spreadPct = (price.buying && price.selling && price.buying > 0)
    ? ((price.selling - price.buying) / price.buying) * 100
    : null;

  // Kategoriler için linkler (üst gezinti)
  const sameCategory = GOLD_TYPES.filter(g => g.category === goldType.category);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-5">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-mist/45">
          <Link href="/" className="transition hover:text-white">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/altin" className="transition hover:text-white">Altın</Link>
          <span>/</span>
          <span className="text-white">{goldType.name}</span>
        </nav>

        {/* Hero kartı */}
        <div className="rounded-[1.75rem] border border-amber-200/18
                        bg-[linear-gradient(135deg,rgba(251,191,36,0.10),rgba(12,24,22,0.95))] p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl
                            bg-amber-300/15 text-3xl">
              {goldType.category === "gumus" ? "🥈" : "🥇"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-medium text-amber-200">
                  {GOLD_CATEGORY_LABELS[goldType.category]} · Canlı fiyat
                </p>
                {price.changePct != null && (
                  <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                    price.changePct >= 0
                      ? "bg-emerald-300/10 text-emerald-300"
                      : "bg-rose-300/10 text-rose-300"
                  }`}>
                    {price.changePct >= 0
                      ? <TrendingUp className="h-3 w-3" />
                      : <TrendingDown className="h-3 w-3" />}
                    {price.changePct >= 0 ? "+" : ""}{fmt(Math.abs(price.changePct), 2)}%
                  </span>
                )}
              </div>
              <h1 className="mt-0.5 text-2xl font-semibold text-white">{goldType.name}</h1>
              {price.avg > 0 ? (
                <p className="mt-4 text-4xl font-semibold text-amber-200">
                  {fmt(price.avg, 0)}
                  <span className="ml-2 text-xl font-normal text-amber-200/60">TL</span>
                </p>
              ) : (
                <p className="mt-4 text-sm text-mist/40">Veri yüklenemedi</p>
              )}
            </div>
          </div>

          {/* Alış / Satış / Makas — sadece truncgil verisi varsa */}
          {price.buying != null && price.selling > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-xl border border-emerald-200/14 bg-emerald-300/[0.04] px-3 py-2.5">
                <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-emerald-200/70">
                  <ArrowDownRight className="h-3 w-3" />
                  Alış
                </p>
                <p className="mt-0.5 text-base font-semibold text-white">
                  {fmt(price.buying, 2)} <span className="text-xs font-normal text-mist/45">TL</span>
                </p>
              </div>
              <div className="rounded-xl border border-rose-200/14 bg-rose-300/[0.04] px-3 py-2.5">
                <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-rose-200/70">
                  <ArrowUpRight className="h-3 w-3" />
                  Satış
                </p>
                <p className="mt-0.5 text-base font-semibold text-white">
                  {fmt(price.selling, 2)} <span className="text-xs font-normal text-mist/45">TL</span>
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

        {/* Grafik kartı — sadece standart 4 (Yahoo'da ticker var) */}
        {goldType.weightG && (
          <div className="glass-card rounded-[1.75rem] p-6">
            <h2 className="mb-1 text-lg font-semibold text-white">Fiyat Grafiği</h2>
            <p className="mb-5 text-xs text-mist/45">
              Yüzdesel değişim — {goldType.name} vs Dolar/TL kuru (dönem başı = 0%)
            </p>
            <PriceChart slug={slug} />
          </div>
        )}

        {/* Basit analiz — sadece grafiği olanlar için */}
        {goldType.weightG && (
          <AnalysisCard slug={slug} type="altin" assetName={goldType.name} />
        )}

        {/* Bilgi notu */}
        <div className="rounded-2xl border border-amber-200/10 bg-amber-300/[0.03] p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-200/50">
            {goldType.category === "gumus" ? "Gümüş hakkında" : "Altın hakkında"}
          </p>
          <p className="text-sm leading-6 text-mist/58">
            {goldType.category === "standart" && (
              <>Gram altın fiyatı, uluslararası ons fiyatı (USD) ve dolar/TL kuru birlikte hesaplanır.
              Bu nedenle hem küresel altın talebi hem de TL&apos;nin dolar karşısındaki değeri gram altın
              fiyatını etkiler. Türk altın sikkeleri (çeyrek, yarım, tam) belirli ağırlıklara karşılık
              gelir: çeyrek = 1,748 g · yarım = 3,496 g · tam = 6,992 g.</>
            )}
            {goldType.category === "antika" && (
              <>{goldType.nameShort} altın, eski Osmanlı/Cumhuriyet dönemi sikkelerinden biridir.
              Standart ağırlıkta basıldığı için tahsil ve sigorta kıymeti yüksek tutulur; piyasa fiyatı
              hem gram altın hem de koleksiyon talebine göre değişir.</>
            )}
            {goldType.category === "ayar" && (
              <>Ayar altın, mücevher sektöründe kullanılan karışım altındır. 14 ayar yaklaşık %58,5,
              18 ayar yaklaşık %75 saf altın içerir; geri kalanı bakır, gümüş ve diğer metallerden oluşur.
              Bu nedenle fiyatı saf gram altının altında kalır.</>
            )}
            {goldType.category === "gumus" && (
              <>Gümüş, altına göre çok daha düşük birim fiyatlıdır; küresel sanayi talebi
              (elektronik, fotovoltaik) ve yatırım talebiyle birlikte hareket eder. Altın/gümüş oranı
              piyasada izlenen önemli bir göstergedir.</>
            )}
          </p>
        </div>

      </div>
    </main>
  );
}
