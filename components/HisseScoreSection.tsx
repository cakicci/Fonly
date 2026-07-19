"use client";

import { useEffect, useState } from "react";
import { AssetScoreCard } from "./AssetScoreCard";
import { computeHisseScore } from "@/lib/score/hisse";
import type { FundamentalsResponse } from "@/lib/yahoo/fundamentals";

interface Props {
  symbol: string;
}

/**
 * /api/financials/[symbol]'ı çekip 5 eksenli basit skor kartını render eder.
 * Finansallar sekmesinden bağımsız, ayrı bir fetch — 1 saatlik upstream
 * cache sayesinde ek maliyeti düşük (bkz. app/api/financials/[symbol]/route.ts).
 */
export function HisseScoreSection({ symbol }: Props) {
  const [data, setData]       = useState<FundamentalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/financials/${symbol}`)
      .then(r => {
        if (!r.ok) throw new Error("not ok");
        return r.json() as Promise<FundamentalsResponse>;
      })
      .then(json => { if (!cancelled) setData(json); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [symbol]);

  if (loading) {
    return (
      <div className="glass-card animate-pulse rounded-2xl p-5">
        <div className="h-4 w-32 rounded bg-white/8" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-white/8" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  return <AssetScoreCard axes={computeHisseScore(data.stats)} />;
}
