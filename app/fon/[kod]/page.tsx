import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PriceChart } from "@/components/PriceChart";
import { AnalysisCard } from "@/components/AnalysisCard";
import { ChartSection } from "@/components/chart/ChartSection";
import { Tabs } from "@/components/chart/Tabs";
import { HistoricalWhatIfCalculator } from "@/components/HistoricalWhatIfCalculator";
import { AssetScoreCard } from "@/components/AssetScoreCard";
import { computeFonScore } from "@/lib/score/fon";
import { fetchAllFundReturns, fetchFundDetail } from "@/lib/tefas";

type Params = { kod: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const kod = params.kod.toUpperCase();
  return {
    title: `${kod} Fon Fiyatı ve Getirisi`,
    description: `${kod} TEFAS fonu: güncel fiyat, fon büyüklüğü, yatırımcı sayısı ve dönemsel getiriler.`,
  };
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return "—";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

export default async function FonGenelPage({ params }: { params: Params }) {
  const kod = params.kod.toUpperCase();

  const [detail, allReturns] = await Promise.all([
    fetchFundDetail(kod),
    fetchAllFundReturns("YAT").catch(() => []),
  ]);

  if (!detail) notFound();

  const returnRow = allReturns.find((r) => r.fonKodu === kod);
  const slug      = `fon-${kod}`;

  const periods: Array<{ label: string; value: number | null }> = [
    { label: "1 Ay",  value: returnRow?.getiri1a ?? null },
    { label: "3 Ay",  value: returnRow?.getiri3a ?? null },
    { label: "6 Ay",  value: returnRow?.getiri6a ?? null },
    { label: "YBI",   value: returnRow?.getiriyb ?? null },
    { label: "1 Yıl", value: returnRow?.getiri1y ?? null },
    { label: "3 Yıl", value: returnRow?.getiri3y ?? null },
    { label: "5 Yıl", value: returnRow?.getiri5y ?? null },
  ];

  return (
    <>
      <ChartSection
        slug={slug}
        defaultTf="1Y"
        defaultType="line"
        supportsCandle={false}
        unit="₺"
      />

      <AssetScoreCard
        axes={computeFonScore({
          getiri3a:       returnRow?.getiri3a ?? null,
          getiri1y:       returnRow?.getiri1y ?? null,
          kategoriDerece: detail.kategoriDerece,
          kategoriFonSay: detail.kategoriFonSay,
        })}
      />

      <div className="glass-card rounded-section p-6">
        <h2 className="mb-4 text-lg font-semibold text-mist">Dönem Getirileri</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
          {periods.map((p) => {
            const positive = p.value != null && p.value >= 0;
            return (
              <div key={p.label} className="rounded-xl border border-line bg-white/[0.025] px-3 py-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-mist-3">{p.label}</p>
                <p className={`mt-1 text-sm font-semibold ${
                  p.value == null ? "text-mist-3" :
                  positive ? "text-emerald-300" : "text-rose-300"
                }`}>
                  {fmtPct(p.value)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <Tabs
        defaultKey="comparison"
        tabs={[
          {
            key:   "comparison",
            label: "Altın Karşılaştırma",
            content: (
              <div className="glass-card rounded-section p-6">
                <h2 className="mb-1 text-lg font-semibold text-mist">Gram Altına Göre Performans</h2>
                <p className="mb-5 text-xs text-mist-3">
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
                <p className="text-sm leading-6 text-mist-3">
                  Yatırım fonları kısa vadede dalgalı performans gösterebilir. Yönetim ücreti getiriyi
                  azaltır; risk değeri (1–7) fonun geçmişteki oynaklığını ifade eder.
                </p>
              </div>
            ),
          },
        ]}
      />

      <HistoricalWhatIfCalculator slug={slug} assetName={detail.fonUnvan} />
    </>
  );
}
