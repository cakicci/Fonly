import { notFound } from "next/navigation";
import Link from "next/link";
import { TrendingDown, TrendingUp, Users, Wallet, BarChart3, Trophy } from "lucide-react";
import type { Metadata } from "next";
import { PriceChart } from "@/components/PriceChart";
import { AnalysisCard } from "@/components/AnalysisCard";
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

/** Büyük rakamları "1,2 mlr ₺" / "456 mn ₺" şeklinde okunabilir hâle getirir. */
function fmtTL(v: number | null | undefined): string {
  if (v == null) return "—";
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)} mlr ₺`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)} mn ₺`;
  if (v >= 1_000)         return `${(v / 1_000).toFixed(0)} bin ₺`;
  return `${v.toFixed(0)} ₺`;
}

export default async function FonDetailPage({ params }: { params: Params }) {
  const kod = params.kod.toUpperCase();

  // Detay + tüm getiriler paralel (ikincisi cache'ten gelir)
  const [detail, allReturns] = await Promise.all([
    fetchFundDetail(kod),
    fetchAllFundReturns("YAT").catch(() => []),
  ]);

  if (!detail) notFound();

  const returnRow = allReturns.find((r) => r.fonKodu === kod);
  const slug = `fon-${kod}`;
  const riskGroup = tefasRiskToCategory(returnRow?.riskDegeri ?? null);
  const semsiye = returnRow?.fonTurAciklama ?? "";

  // Tüm dönem getirileri tek satırda
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
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-5">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-mist/45">
          <Link href="/" className="transition hover:text-white">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/fonlar" className="transition hover:text-white">Fonlar</Link>
          <span>/</span>
          <span className="text-white">{kod}</span>
        </nav>

        {/* Hero kartı */}
        <div className="rounded-[1.75rem] border border-sky-200/16
                        bg-[linear-gradient(135deg,rgba(186,230,253,0.08),rgba(11,16,38,0.96))] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-sky-300/12 px-2 py-0.5 text-xs font-bold text-sky-300">
                  {kod}
                </span>
                <p className="text-xs text-mist/45">TEFAS</p>
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
              </div>
              <h1 className="mt-2 text-2xl font-semibold leading-snug text-white">{detail.fonUnvan}</h1>

              <div className="mt-4 flex items-end gap-3">
                <p className="text-4xl font-semibold text-white">
                  {fmt(detail.sonFiyat, 4)}
                  <span className="ml-1.5 text-xl font-normal text-mist/45">₺</span>
                </p>
                {detail.gunlukGetiri != null && (
                  <div className={`mb-1 flex items-center gap-1 text-sm font-semibold ${
                    detail.gunlukGetiri >= 0 ? "text-emerald-300" : "text-rose-300"
                  }`}>
                    {detail.gunlukGetiri >= 0
                      ? <TrendingUp className="h-4 w-4" />
                      : <TrendingDown className="h-4 w-4" />}
                    {detail.gunlukGetiri >= 0 ? "+" : ""}{fmt(detail.gunlukGetiri, 2)}%
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-mist/40">Pay başına fiyat · günlük değişim</p>
            </div>
          </div>

          {/* Stat satırı */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              icon={<Wallet className="h-3.5 w-3.5" />}
              label="Portföy"
              value={fmtTL(detail.portBuyukluk)}
            />
            <Stat
              icon={<Users className="h-3.5 w-3.5" />}
              label="Yatırımcı"
              value={detail.yatirimciSayi != null ? detail.yatirimciSayi.toLocaleString("tr-TR") : "—"}
            />
            <Stat
              icon={<Trophy className="h-3.5 w-3.5" />}
              label="Kategori sıra"
              value={
                detail.kategoriDerece && detail.kategoriFonSay
                  ? `${detail.kategoriDerece} / ${detail.kategoriFonSay}`
                  : "—"
              }
            />
            <Stat
              icon={<BarChart3 className="h-3.5 w-3.5" />}
              label="Pazar payı"
              value={detail.pazarPayi != null ? `%${fmt(detail.pazarPayi, 2)}` : "—"}
            />
          </div>
        </div>

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

        {/* Grafik kartı */}
        <div className="glass-card rounded-[1.75rem] p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">Pay Fiyatı Grafiği</h2>
          <p className="mb-5 text-xs text-mist/45">
            Yüzdesel değişim — {detail.fonUnvan} vs Gram Altın (dönem başı = 0%)
          </p>
          <PriceChart slug={slug} />
        </div>

        {/* Basit analiz */}
        <AnalysisCard slug={slug} type="fon" assetName={detail.fonUnvan} />

        {/* Gram altın karşılaştırma açıklaması */}
        <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-mist/35">
            Gram altın neden karşılaştırılıyor?
          </p>
          <p className="text-sm leading-6 text-mist/58">
            Türkiye&apos;de en yaygın bilinen yatırım aracı gram altındır. Bir fonun pay fiyatı,
            gram altına kıyasla değerlendirildiğinde &quot;gerçek anlamda kazandım mı?&quot; sorusunu
            yanıtlamak kolaylaşır. Grafikteki sarı çizgi gram altını, renkli çizgi ise bu fonu
            temsil eder; her ikisi de dönem başına göre % değişim olarak gösterilir.
          </p>
        </div>

        {/* Risk uyarısı */}
        <div className="rounded-2xl border border-rose-200/10 bg-rose-300/[0.03] p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-200/60">
            Risk uyarısı
          </p>
          <p className="text-sm leading-6 text-mist/55">
            Yatırım fonları kısa vadede dalgalı performans gösterebilir. Yönetim ücreti getiriyi
            azaltır; risk değeri (1–7) fonun geçmişteki oynaklığını ifade eder. Gösterilen veriler
            geçmişe aittir; gelecekteki kazancı garanti etmez. Yatırım kararı vermeden önce
            fonun KIID/izahnamesini incelemeniz önerilir.
          </p>
        </div>

      </div>
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
