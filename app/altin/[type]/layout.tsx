import { notFound } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { AssetHeader } from "@/components/chart/AssetHeader";
import { AssetHeaderActions } from "@/components/chart/AssetHeaderActions";
import { SubNav } from "@/components/chart/SubNav";
import {
  GOLD_TYPE_MAP,
  GOLD_TYPES,
  GOLD_CATEGORY_LABELS,
} from "@/data/gold-types";
import { fetchTruncgilToday, getTruncgilAsset } from "@/lib/market-data";
import { fmtAsset, fmtPercent, kindFromGoldCategory } from "@/lib/format";
import { ALTIN_SUBNAV } from "@/lib/chart/subnav";

type Params = { type: string };

export default async function AltinLayout({
  children,
  params,
}: {
  children: ReactNode;
  params:   Params;
}) {
  const goldType = GOLD_TYPE_MAP[params.type.toLowerCase()];
  if (!goldType) notFound();

  const slug = `altin-${goldType.type}`;
  const truncgil = await fetchTruncgilToday();
  const t = getTruncgilAsset(truncgil, goldType.truncgilKey);
  const buying    = t?.Buying  || null;
  const selling   = t?.Selling ?? 0;
  const avg       = t ? ((t.Buying + t.Selling) / 2 || t.Selling) : 0;
  const changePct = t?.Change  ?? null;
  const spreadPct = (buying && selling && buying > 0)
    ? ((selling - buying) / buying) * 100
    : null;

  const sameCategory = GOLD_TYPES.filter(g => g.category === goldType.category);
  const goldKind     = kindFromGoldCategory(goldType.category);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <nav className="flex items-center gap-2 text-sm text-mist/45">
          <Link href="/" className="transition hover:text-white">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/altin" className="transition hover:text-white">Altın</Link>
          <span>/</span>
          <span className="text-white">{goldType.name}</span>
        </nav>

        <AssetHeader
          tag={goldType.category === "gumus" ? "🥈" : "🥇"}
          market={GOLD_CATEGORY_LABELS[goldType.category]}
          name={goldType.name}
          price={avg}
          unit="TL"
          changePct={changePct}
          slug={slug}
          actions={
            <AssetHeaderActions
              slug={slug}
              currentPrice={avg}
              unit="TL"
              assetName={goldType.name}
            />
          }
        />

        {buying != null && selling > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-xl border border-emerald-200/14 bg-emerald-300/[0.04] px-4 py-3">
              <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-emerald-200/70">
                <ArrowDownRight className="h-3 w-3" />
                Alış
              </p>
              <p className="mt-0.5 text-base font-semibold text-white">
                {fmtAsset(buying, goldKind)} <span className="text-xs font-normal text-mist/45">TL</span>
              </p>
            </div>
            <div className="rounded-xl border border-rose-200/14 bg-rose-300/[0.04] px-4 py-3">
              <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-rose-200/70">
                <ArrowUpRight className="h-3 w-3" />
                Satış
              </p>
              <p className="mt-0.5 text-base font-semibold text-white">
                {fmtAsset(selling, goldKind)} <span className="text-xs font-normal text-mist/45">TL</span>
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

        <SubNav basePath={`/altin/${goldType.type}`} tabs={ALTIN_SUBNAV} />

        {children}
      </div>
    </main>
  );
}
