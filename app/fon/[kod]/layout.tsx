import { notFound } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";
import { Users, Wallet, BarChart3, Trophy } from "lucide-react";
import { AssetHeader } from "@/components/chart/AssetHeader";
import { AssetHeaderActions } from "@/components/chart/AssetHeaderActions";
import { SubNav } from "@/components/chart/SubNav";
import { fetchAllFundReturns, fetchFundDetail, tefasRiskToCategory } from "@/lib/tefas";
import { fmtPercent } from "@/lib/format";
import { RISK_COLORS, RISK_LABELS } from "@/data/stocks";
import { FON_SUBNAV } from "@/lib/chart/subnav";

type Params = { kod: string };

function fmtTL(v: number | null | undefined): string {
  if (v == null) return "—";
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)} mlr ₺`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)} mn ₺`;
  if (v >= 1_000)         return `${(v / 1_000).toFixed(0)} bin ₺`;
  return `${v.toFixed(0)} ₺`;
}

export default async function FonLayout({
  children,
  params,
}: {
  children: ReactNode;
  params:   Params;
}) {
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
          actions={
            <AssetHeaderActions
              slug={slug}
              currentPrice={detail.sonFiyat}
              unit="₺"
              assetName={detail.fonUnvan}
            />
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={<Wallet className="h-3.5 w-3.5" />}     label="Portföy"       value={fmtTL(detail.portBuyukluk)} />
          <Stat icon={<Users className="h-3.5 w-3.5" />}      label="Yatırımcı"     value={detail.yatirimciSayi != null ? detail.yatirimciSayi.toLocaleString("tr-TR") : "—"} />
          <Stat icon={<Trophy className="h-3.5 w-3.5" />}     label="Kategori sıra" value={detail.kategoriDerece && detail.kategoriFonSay ? `${detail.kategoriDerece} / ${detail.kategoriFonSay}` : "—"} />
          <Stat icon={<BarChart3 className="h-3.5 w-3.5" />}  label="Pazar payı"    value={detail.pazarPayi != null ? `%${fmtPercent(detail.pazarPayi)}` : "—"} />
        </div>

        <SubNav basePath={`/fon/${kod}`} tabs={FON_SUBNAV} />

        {children}
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
