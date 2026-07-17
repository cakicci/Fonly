"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { HistoryResponse } from "@/app/api/history/[slug]/route";

// ── Period seçenekleri ───────────────────────────────────────────────────────

const PERIODS = [
  { key: "1h", label: "1H" },
  { key: "3a", label: "3A" },
  { key: "1y", label: "1Y" },
  { key: "5y", label: "5Y" },
] as const;

type Period = (typeof PERIODS)[number]["key"];

// ── Tarih formatla ───────────────────────────────────────────────────────────

function fmtDate(dateStr: string, period: Period): string {
  const d = new Date(dateStr);
  if (period === "5y")
    return d.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" });
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

// ── Tooltip ──────────────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
  assetName,
  compName,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
  assetName: string;
  compName: string;
}) {
  if (!active || !payload?.length) return null;
  const date = label ? new Date(label).toLocaleDateString("tr-TR") : "";

  return (
    <div className="rounded-xl border border-white/10 bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 text-mist-3">{date}</p>
      {payload.map((p, i) => (
        <p
          key={i}
          className={`font-semibold ${
            p.name === "asset"
              ? p.value >= 0 ? "text-emerald-300" : "text-rose-300"
              : "text-amber-300"
          }`}
        >
          {i === 0 ? assetName : compName}:{" "}
          {p.value >= 0 ? "+" : ""}{p.value.toFixed(2)}%
        </p>
      ))}
    </div>
  );
}

// ── Ana bileşen ──────────────────────────────────────────────────────────────

interface Props {
  slug: string
  defaultPeriod?: Period
}

export function PriceChart({ slug, defaultPeriod = "1y" }: Props) {
  const [period,   setPeriod]   = useState<Period>(defaultPeriod);
  const [data,     setData]     = useState<HistoryResponse | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [showComp, setShowComp] = useState(true);

  const fetchData = useCallback(
    async (p: Period) => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/history/${slug}?range=${p}`);
        if (!res.ok) { setError(true); return; }
        setData(await res.json());
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [slug]
  );

  useEffect(() => { fetchData(period); }, [fetchData, period]);

  // Normalize her iki seriyi de başlangıca göre % değişim olarak hesapla
  const chartData = data
    ? (() => {
        const s0 = data.points[0]?.value ?? 1;
        const c0 = data.compPoints[0]?.value ?? 1;
        return data.points.map((p, i) => ({
          date:  p.date,
          asset: ((p.value - s0) / s0) * 100,
          comp:  data.compPoints[i]
            ? ((data.compPoints[i].value - c0) / c0) * 100
            : null,
        }));
      })()
    : [];

  const assetChange = data?.summary.changePercent ?? 0;
  const compChange  = data?.summary.compChangePercent ?? 0;
  const positive    = assetChange >= 0;

  const strokeMain = positive ? "#6ee7b7" : "#fda4af";

  return (
    <div>
      {/* Başlık satırı: değişim + period seçici */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!loading && data && (
            <span className={`text-sm font-semibold ${positive ? "text-emerald-300" : "text-rose-300"}`}>
              {assetChange >= 0 ? "+" : ""}{assetChange.toFixed(2)}%
            </span>
          )}
          <span className="text-xs text-mist-3">seçili dönemde</span>
        </div>

        <div className="flex rounded-xl border border-white/8 bg-white/[0.03] p-0.5">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                period === p.key
                  ? "bg-emerald-300 text-ink"
                  : "text-mist-3 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grafik */}
      {loading ? (
        <div className="flex h-52 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent" />
        </div>
      ) : error || chartData.length === 0 ? (
        <div className="flex h-52 items-center justify-center text-sm text-mist-3">
          Veri yüklenemedi. Lütfen daha sonra tekrar deneyin.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-main-${slug}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={strokeMain} stopOpacity={0.25} />
                <stop offset="95%" stopColor={strokeMain} stopOpacity={0}    />
              </linearGradient>
              <linearGradient id={`grad-comp-${slug}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#fbbf24" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}    />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />

            <XAxis
              dataKey="date"
              tickFormatter={d => fmtDate(d, period)}
              tick={{ fontSize: 10, fill: "rgba(216,247,238,0.35)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tickFormatter={v => `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`}
              tick={{ fontSize: 10, fill: "rgba(216,247,238,0.35)" }}
              axisLine={false}
              tickLine={false}
              width={48}
            />

            <Tooltip
              content={
                <CustomTooltip
                  assetName={data?.asset.name ?? "Varlık"}
                  compName={data?.comp.name ?? "Altın"}
                />
              }
            />

            <Area
              type="monotone"
              dataKey="asset"
              stroke={strokeMain}
              strokeWidth={2}
              fill={`url(#grad-main-${slug})`}
              dot={false}
              connectNulls
            />
            {showComp && (
              <Area
                type="monotone"
                dataKey="comp"
                stroke="#fbbf24"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                fill={`url(#grad-comp-${slug})`}
                dot={false}
                connectNulls
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Lejant */}
      {!loading && !error && data && (
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className={`h-0.5 w-4 rounded-full ${positive ? "bg-emerald-300" : "bg-rose-300"}`} />
            <span className="text-mist-3">{data.asset.name}</span>
            <span className={`font-semibold ${positive ? "text-emerald-300" : "text-rose-300"}`}>
              {assetChange >= 0 ? "+" : ""}{assetChange.toFixed(2)}%
            </span>
          </div>

          <button
            onClick={() => setShowComp(v => !v)}
            className={`flex items-center gap-1.5 transition ${showComp ? "" : "opacity-40"}`}
          >
            <div className="w-4 border-t-2 border-dashed border-amber-300 opacity-80" />
            <span className="text-mist-3">{data.comp.name}</span>
            <span className={`font-semibold ${compChange >= 0 ? "text-amber-300" : "text-rose-300"}`}>
              {compChange >= 0 ? "+" : ""}{compChange.toFixed(2)}%
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
