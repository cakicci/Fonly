import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { Stock } from "@/data/stocks";
import { RISK_LABELS, HORIZON_LABELS, RISK_COLORS, HORIZON_COLORS } from "@/data/stocks";

type StockCardProps = {
  stock: Stock;
};

export function StockCard({ stock }: StockCardProps) {
  const isPositive = stock.dailyChange.startsWith("+");
  const TrendIcon  = isPositive ? TrendingUp : TrendingDown;

  return (
    <Link
      href={`/hisse/${stock.symbol.toLowerCase()}`}
      className="group block h-full"
    >
      <article className="glass-card glass-card-interactive h-full rounded-card p-5">

        {/* Üst satır: sembol + trend ikonu */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-200">{stock.symbol}</p>
            <h3 className="mt-1 text-xl font-semibold text-white">{stock.name}</h3>
            <p className="mt-1 text-sm text-mist-3">Geçmiş performans özeti</p>
          </div>
          <div
            className={
              isPositive
                ? "rounded-2xl bg-emerald-300/12 p-3 text-emerald-200"
                : "rounded-2xl bg-rose-300/12 p-3 text-rose-200"
            }
          >
            <TrendIcon className="h-5 w-5" />
          </div>
        </div>

        {/* Risk + Vade badge */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-medium ${RISK_COLORS[stock.risk]}`}>
            {RISK_LABELS[stock.risk]}
          </span>
          <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-medium ${HORIZON_COLORS[stock.horizon]}`}>
            {HORIZON_LABELS[stock.horizon]}
          </span>
        </div>

        {/* Fiyat satırı */}
        <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/8 pt-5">
          <div>
            <p className="text-xs text-mist-3">Fiyat</p>
            <p className="mt-1 text-2xl font-semibold text-white">{stock.price}</p>
          </div>
          <p className={isPositive ? "font-semibold text-emerald-200" : "font-semibold text-rose-200"}>
            {stock.dailyChange}
          </p>
        </div>

        {/* 5 yıl + altın kıyası */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
            <p className="text-xs text-mist-3">5 yılda hisse</p>
            <p className="mt-1 text-xl font-semibold text-emerald-200">{stock.fiveYearReturn}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
            <p className="text-xs text-mist-3">Altınla kıyas</p>
            <p className="mt-1 text-sm leading-5 text-mist-2">{stock.goldComparison}</p>
          </div>
        </div>

        <p className="mt-4 rounded-2xl border border-cyan-200/12 bg-cyan-300/8 p-3 text-sm leading-6 text-cyan-50/84">
          {stock.simpleTakeaway}
        </p>
        <p className="mt-5 text-sm leading-6 text-mist-2">{stock.explanation}</p>

      </article>
    </Link>
  );
}
