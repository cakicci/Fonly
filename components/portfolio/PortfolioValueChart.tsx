"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PortfolioHistoryResponse } from "@/app/api/portfolio/history/route";
import { assetDisplayName } from "@/lib/portfolio/asset";
import { useMounted } from "@/lib/hooks/useMounted";

type Range = "3a" | "1y";

// Koyu yüzeyde (surface #10172f) dataviz validator'dan geçen çift:
// değer #0eaf7b (yeşil), maliyet #8b5cf6 (mor, kesikli — ikincil kodlama).
// Açık yüzeyde (beyaz) aynı çift daha koyu tonlarla kontrastı korur.
const DARK_COLOR_VALUE = "#0eaf7b";
const DARK_COLOR_COST = "#8b5cf6";
const LIGHT_COLOR_VALUE = "#047857";
const LIGHT_COLOR_COST = "#7c3aed";

function tl(n: number): string {
  return n.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
}

function tickDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function ChartTooltip({
  active,
  payload,
  label,
  colorValue,
  colorCost,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number }>;
  label?: string;
  colorValue: string;
  colorCost: string;
}) {
  if (!active || !payload?.length || !label) return null;
  const value = payload.find((p) => p.dataKey === "value")?.value;
  const cost = payload.find((p) => p.dataKey === "cost")?.value;
  return (
    <div className="rounded-xl border border-line bg-ink/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="font-medium text-mist">
        {new Date(label).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
      </p>
      {value != null && (
        <p className="mt-1 flex items-center gap-1.5 text-mist-2">
          <span className="h-2 w-2 rounded-full" style={{ background: colorValue }} />
          Değer: {tl(value)} ₺
        </p>
      )}
      {cost != null && (
        <p className="mt-0.5 flex items-center gap-1.5 text-mist-2">
          <span className="h-2 w-2 rounded-full" style={{ background: colorCost }} />
          Maliyet: {tl(cost)} ₺
        </p>
      )}
    </div>
  );
}

interface PortfolioValueChartProps {
  /** true ise deneme portföyünün grafiği çekilir (gerçek portföyden tamamen ayrı). */
  demo?: boolean;
}

/** Portföy değerinin zaman içindeki seyri — maliyet çizgisiyle karşılaştırmalı. */
export function PortfolioValueChart({ demo = false }: PortfolioValueChartProps) {
  const [range, setRange] = useState<Range>("3a");
  const [data, setData] = useState<PortfolioHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isLight = mounted && resolvedTheme === "light";
  const COLOR_VALUE = isLight ? LIGHT_COLOR_VALUE : DARK_COLOR_VALUE;
  const COLOR_COST = isLight ? LIGHT_COLOR_COST : DARK_COLOR_COST;
  const gridColor = isLight ? "rgba(11,16,38,0.06)" : "rgba(216,247,238,0.06)";
  const tickColor = isLight ? "rgba(11,16,38,0.55)" : "rgba(216,247,238,0.4)";
  const cursorColor = isLight ? "rgba(11,16,38,0.2)" : "rgba(216,247,238,0.2)";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/portfolio/history?range=${range}${demo ? "&demo=1" : ""}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range, demo]);

  const points = data?.points ?? [];
  if (!loading && points.length < 2) return null; // grafik çizecek veri yok

  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-mist">Portföy değeri</h2>
          {/* Legend — iki seri: renk + metin (metin, metin token'ında) */}
          <div className="mt-1 flex items-center gap-4 text-xs text-mist-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: COLOR_VALUE }} />
              Değer
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded" style={{ background: COLOR_COST }} />
              Maliyet
            </span>
          </div>
        </div>
        <div className="flex rounded-xl border border-line p-0.5" role="group" aria-label="Zaman aralığı">
          {(["3a", "1y"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-[10px] px-3 py-1 text-xs font-semibold uppercase transition ${
                range === r ? "bg-white/10 text-mist" : "text-mist-3 hover:text-mist"
              }`}
            >
              {r === "3a" ? "3 Ay" : "1 Yıl"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-56 items-center justify-center text-sm text-mist-3">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Grafik hazırlanıyor…
        </div>
      ) : (
        <>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="pfValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLOR_VALUE} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={COLOR_VALUE} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={tickDate}
                  tick={{ fill: tickColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={48}
                />
                <YAxis
                  tickFormatter={(v: number) => tl(v)}
                  tick={{ fill: tickColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={64}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  content={<ChartTooltip colorValue={COLOR_VALUE} colorCost={COLOR_COST} />}
                  cursor={{ stroke: cursorColor, strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={COLOR_VALUE}
                  strokeWidth={2}
                  fill="url(#pfValue)"
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke={COLOR_COST}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {data && data.missingSlugs.length > 0 && (
            <p className="mt-3 text-xs text-amber-200/80">
              {data.missingSlugs.map(assetDisplayName).join(", ")} için geçmiş fiyat verisi yok —
              grafik bu varlıkları içermiyor.
            </p>
          )}
        </>
      )}
    </section>
  );
}
