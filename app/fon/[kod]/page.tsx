import { notFound } from "next/navigation";
import Link from "next/link";
import { Users, Wallet, BarChart3, Trophy } from "lucide-react";
import type { Metadata } from "next";
import { PriceChart } from "@/components/PriceChart";
import { AnalysisCard } from "@/components/AnalysisCard";
import { AssetHeader } from "@/components/chart/AssetHeader";
import { AssetHeaderActions } from "@/components/chart/AssetHeaderActions";
import { ChartSection } from "@/components/chart/ChartSection";
import { GlobalWatchlistDrawer } from "@/components/chart/GlobalWatchlistDrawer";
import { Tabs } from "@/components/chart/Tabs";
import { fetchAllFundReturns, fetchFundDetail, tefasRiskToCategory } from "@/lib/tefas";
import { fmt } from "@/lib/market-data";
import { RISK_COLORS, RISK_LABELS } from "@/data/stocks";

type Params = { kod: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const kod = params.kod.toUpperCase();
  return { title: `${kod} — Fonly` };
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return "—";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function fmtTL(v: number | null | undefined): string {
  if (v == null) return "—";
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)} mlr ₺`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)} mn ₺`;
  if (v >= 1_000)         return `${(v / 1_000).toFixed(0)} bin ₺`;
  return `${v.toFixed(0)} ₺`;
}

export default async function FonDetailPage({ params }: { params: Params }) {
  const kod = params.kod.toUpperCase();

  const [detail, allReturns] = await Promise.all([
    fetchFundDetail(kod),
    fetchAllFundReturns("YAT").catch(() => []),
  ]);

  if (!detail) notFound();

  const returnRow = allReturns.find((r) => r.fonKodu === kod);
  const slug      = `fon-${kod}`;
  const riskGroup = tefasRiskToCategory(returnRow?.riskDegeri ?? null);
  const semsiye   = returnRow?.fonTurAciklama ?? "";

  const periods: Array<{ label: string; value: number | null }> = [
    { label: "1 Ay",  value: returnRow?.getiri1a ?? null },
    { label: "3 Ay",  value: returnRow?.getiri3a ?? null },
    { label: "6 Ay",  value: returnRow?.getiri6a ?? null },
    { label: "YBI",   value: returnRow?.getiriyb ?? null },
    { label: "1 Yıl", value: returnRow?.getiri1y ?? null },
    { label: "3 Yıl", value: returnRow?.getiri3y ?? null },
    { label: "5 Yıl", value: returnRow?.getiri5y ?? null },
  ];

  const badges = (
    <>
      {riskGroup && (
        <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-medium ${RISK_COLORS[riskGroup]}`}>
          {RISK_LABELS[riskGroup]}
          {returnRow?.riskDegeri && (
            <span className="ml-1 opacity-70">({returnRow.riskDegeri})</span>
          )}
        </span>
      )}
      {semsiye && (
        <span className="inline-flex items-center rounded-lg border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-mist/60">
          {semsiye.replace(" Şemsiye Fonu", "")}
        </span>
      )}
    </>
  );

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-mist/45">
          <Link href="/" className="transition hover:text-white">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/fonlar" className="transition hover:text-white">Fonlar</Link>
          <span>/</span>
          <span className="text-white">{kod}</span>
        </nav>

        <AssetHeader
          tag={kod}
          market="TEFAS"
          name={detail.fonUnvan}
          price={detail.sonFiyat}
          unit="₺"
          changePct={detail.gunlukGetiri ?? null}
          badges={badges}
          subtitle="Pay başına fiyat · günlük değişim"
          slug={slug}
          actions={<AssetHeaderActions slug={slug} currentPrice={detail.sonFiyat} unit="₺" assetName={detail.fonUnvan} />}
        />

        {/* 4'lü Stat satırı */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={<Wallet className="h-3.5 w-3.5" />} label="Portföy"     value={fmtTL(detail.portBuyukluk)} />
          <Stat icon={<Users className="h-3.5 w-3.5" />}  label="Yatırımcı"   value={detail.yatirimciSayi != null ? detail.yatirimciSayi.toLocaleString("tr-TR") : "—"} />
          <Stat icon={<Trophy className="h-3.5 w-3.5" />} label="Kategori sıra" value={detail.kategoriDerece && detail.kategoriFonSay ? `${detail.kategoriDerece} / ${detail.kategoriFonSay}` : "—"} />
          <Stat icon={<BarChart3 className="h-3.5 w-3.5" />} label="Pazar payı" value={detail.pazarPayi != null ? `%${fmt(detail.pazarPayi, 2)}` : "—"} />
        </div>

        {/* Ana grafik — fon line-only zorla */}
        <ChartSection
          slug={slug}
          defaultTf="1Y"
          defaultType="line"
          supportsCandle={false}
          unit="₺"
        />

        {/* Dönem getirileri */}
        <div className="glass-card rounded-[1.75rem] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Dönem Getirileri</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
            {periods.map((p) => {
              const positive = p.value != null && p.value >= 0;
              return (
                <div key={p.label} className="rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-mist/40">{p.label}</p>
                  <p className={`mt-1 text-sm font-semibold ${
                    p.value == null ? "text-mist/40" :
                    positive ? "text-emerald-300" : "text-rose-300"
                  }`}>
                    {fmtPct(p.value)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

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
                    Yüzdesel değişim — {detail.fonUnvan} vs Gram Altın (dönem başı = 0%)
                  </p>
                  <PriceChart slug={slug} />
                </div>
              ),
            },
            {
              key:   "analysis",
              label: "Otomatik Analiz",
              content: <AnalysisCard slug={slug} type="fon" assetName={detail.fonUnvan} />,
            },
            {
              key:   "info",
              label: "Bilgi",
              content: (
                <div className="rounded-2xl border border-rose-200/10 bg-rose-300/[0.03] p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-200/60">Risk uyarısı</p>
                  <p className="text-sm leading-6 text-mist/55">
                    Yatırım fonları kısa vadede dalgalı performans gösterebilir. Yönetim ücreti getiriyi
                    azaltır; risk değeri (1–7) fonun geçmişteki oynaklığını ifade eder.
                  </p>
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

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2.5">
      <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-mist/40">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
