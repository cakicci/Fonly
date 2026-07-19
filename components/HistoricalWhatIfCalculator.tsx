"use client";

import { useEffect, useState } from "react";
import type { HistoryResponse } from "@/app/api/history/[slug]/route";

const PERIODS = [
  { key: "1h", label: "1 hafta önce" },
  { key: "3a", label: "3 ay önce" },
  { key: "1y", label: "1 yıl önce" },
  { key: "5y", label: "5 yıl önce" },
] as const;

type PeriodKey = (typeof PERIODS)[number]["key"];

interface Props {
  slug:      string;
  assetName: string;
}

/**
 * "1000 TL'yi X'e yatırsaydım bugün ne olurdu?" hesaplayıcısı. Yeni bir veri
 * kaynağı gerektirmez — /api/history/[slug]'ın zaten döndürdüğü
 * summary.changePercent'i kullanır (bkz. lib/history/series.ts).
 */
export function HistoricalWhatIfCalculator({ slug, assetName }: Props) {
  const [amount, setAmount]   = useState("1000");
  const [period, setPeriod]   = useState<PeriodKey>("1y");
  const [data, setData]       = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`/api/history/${slug}?range=${period}`)
      .then(r => {
        if (!r.ok) throw new Error("not ok");
        return r.json() as Promise<HistoryResponse>;
      })
      .then(json => { if (!cancelled) setData(json); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug, period]);

  const n = parseFloat(amount.replace(",", "."));
  const changePct = data?.summary.changePercent ?? null;
  const result = Number.isFinite(n) && changePct != null ? n * (1 + changePct / 100) : null;
  const positive = (changePct ?? 0) >= 0;

  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="text-sm font-semibold text-mist">Geçmişe dönük hesaplayıcı</p>
      <p className="mt-1 text-xs text-mist-3">
        Bu tutarı geçmişte {assetName}&apos;a yatırsaydın bugün ne kadar olurdu?
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-mist-3">
            Tutar (TL)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="1000"
            className="w-full rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 text-sm text-mist outline-none focus:border-emerald-300/40"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-mist-3">
            Ne zaman yatırsaydın
          </label>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as PeriodKey)}
            className="w-full rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 text-sm text-mist outline-none focus:border-emerald-300/40"
          >
            {PERIODS.map(p => (
              <option key={p.key} value={p.key} className="bg-[#0d1430]">
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] px-4 py-3">
        {loading ? (
          <p className="text-sm text-mist-3">Hesaplanıyor…</p>
        ) : error || result == null ? (
          <p className="text-sm text-mist-3">Bu dönem için veri bulunamadı.</p>
        ) : (
          <p className="text-lg font-semibold text-mist">
            Bugün yaklaşık{" "}
            <span className="text-emerald-200">
              {result.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} TL
            </span>{" "}
            olurdu{" "}
            <span className={positive ? "text-emerald-300" : "text-rose-300"}>
              ({changePct! >= 0 ? "+" : ""}
              {changePct!.toFixed(1)}%)
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
