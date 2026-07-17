import { ArrowUpRight } from "lucide-react";
import type { Fund } from "@/data/funds";

type FundCardProps = {
  fund: Fund;
};

export function FundCard({ fund }: FundCardProps) {
  const riskTone =
    fund.riskLevel === "Düşük"
      ? "bg-emerald-300/12 text-emerald-100"
      : fund.riskLevel === "Orta"
        ? "bg-cyan-300/12 text-cyan-100"
        : "bg-amber-300/14 text-amber-100";

  return (
    <article className="glass-card flex h-full flex-col rounded-card p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold leading-7 text-white">{fund.name}</h3>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${riskTone}`}>
          {fund.riskLevel} risk
        </span>
      </div>
      <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.04] p-4">
        <p className="text-xs text-mist-3">Son 1 yıl</p>
        <p className="mt-1 text-3xl font-semibold text-emerald-200">{fund.oneYearReturn}</p>
      </div>
      <p className="mt-5 flex-1 text-sm leading-6 text-mist-2">{fund.explanation}</p>
      <button className="btn btn-sm btn-secondary mt-6 px-4">
        Detayları Gör
        <ArrowUpRight className="h-4 w-4" />
      </button>
    </article>
  );
}
