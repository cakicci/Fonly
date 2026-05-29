import Link from "next/link";
import { Sparkles, ShieldCheck } from "lucide-react";
import { RISK_LABELS, HORIZON_LABELS, RISK_COLORS, HORIZON_COLORS } from "@/data/stocks";
import type { RiskLevel, Horizon } from "@/data/stocks";

export interface AnalyzedStock {
  symbol:        string;
  name:          string;
  risk:          RiskLevel;
  horizon:       Horizon;
  isWellKnown:   boolean;
  aiSummary:     string | null;
  aiExplanation: string | null;
  analyzedAt:    Date;
  modelVersion:  string;
}

function formatRelative(date: Date): string {
  const diffMs   = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "bugün";
  if (diffDays === 1) return "dün";
  if (diffDays < 30)  return `${diffDays} gün önce`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} ay önce`;
  return `${Math.floor(diffDays / 365)} yıl önce`;
}

export function AnalyzedStockCard({ stock }: { stock: AnalyzedStock }) {
  const isAI = stock.modelVersion !== "seed";

  return (
    <Link
      href={`/hisse/${stock.symbol.toLowerCase()}`}
      className="group block h-full"
    >
      <article className="glass-card h-full rounded-[1.25rem] p-5 transition group-hover:-translate-y-0.5 group-hover:border-white/16">

        {/* Üst satır: sembol + isim + rozet */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-200">{stock.symbol}</p>
            <h3 className="mt-1 truncate text-xl font-semibold text-white">{stock.name}</h3>
          </div>
          {stock.isWellKnown ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-cyan-200/25 bg-cyan-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-100">
              <ShieldCheck className="h-3 w-3" />
              BIST 30
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-fuchsia-200/25 bg-fuchsia-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-100">
              <Sparkles className="h-3 w-3" />
              AI seçimi
            </span>
          )}
        </div>

        {/* Risk + Vade */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-medium ${RISK_COLORS[stock.risk]}`}>
            {RISK_LABELS[stock.risk]}
          </span>
          <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-medium ${HORIZON_COLORS[stock.horizon]}`}>
            {HORIZON_LABELS[stock.horizon]}
          </span>
        </div>

        {/* AI özet */}
        {stock.aiSummary && (
          <p className="mt-5 rounded-2xl border border-cyan-200/12 bg-cyan-300/8 p-3 text-sm leading-6 text-cyan-50/84">
            {stock.aiSummary}
          </p>
        )}

        {/* Uzun açıklama */}
        {stock.aiExplanation && (
          <p className="mt-3 text-sm leading-6 text-mist/66">{stock.aiExplanation}</p>
        )}

        {/* Footer: kaynak + tarih */}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/8 pt-3 text-[11px] text-mist/45">
          <span>{isAI ? "AI analizi" : "Hazır içerik"}</span>
          <span>Güncelleme: {formatRelative(stock.analyzedAt)}</span>
        </div>

      </article>
    </Link>
  );
}
