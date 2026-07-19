"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Lock } from "lucide-react";
import { useMounted } from "@/lib/hooks/useMounted";
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
import { BIST_TICKERS } from "@/data/bist-tickers";
import { UpgradeModal } from "@/components/billing/UpgradeModal";

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
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lg">
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

// ── Karşılaştırma varlığı seçenekleri ───────────────────────────────────────

interface CompOption {
  key:  string;
  label: string;
  /** undefined → sunucu tip bazlı varsayılana düşer (gram altın / dolar). */
  comp?: string;
  /** Premium gerektirir mi — sadece "default" ücretsizdir, diğer karşılaştırmalar premium. */
  premium?: boolean;
}

function compPresetsFor(slug: string): CompOption[] {
  const type = slug.split("-")[0];
  if (type === "altin") {
    const opts: CompOption[] = [{ key: "default", label: "Dolar" }];
    if (slug !== "altin-gram") opts.push({ key: "gram", label: "Gram Altın", comp: "altin-gram", premium: true });
    opts.push({ key: "xu100", label: "BIST 100", comp: "xu100", premium: true });
    return opts;
  }
  return [
    { key: "default", label: "Gram Altın" },
    { key: "usd",      label: "Dolar",     comp: "doviz-USD", premium: true },
    { key: "xu100",    label: "BIST 100",  comp: "xu100",     premium: true },
  ];
}

export function PriceChart({ slug, defaultPeriod = "1y" }: Props) {
  const { data: session, status: authStatus } = useSession();
  const isPremium  = session?.user?.isPremium === true;
  const authLoading = authStatus === "loading";
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isLight = mounted && resolvedTheme === "light";

  const [period,     setPeriod]     = useState<Period>(defaultPeriod);
  const [data,       setData]       = useState<HistoryResponse | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);
  const [showComp,   setShowComp]   = useState(true);
  const [compParam,  setCompParam]  = useState<string | undefined>(undefined);
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const presets = compPresetsFor(slug);

  function onPresetClick(opt: CompOption) {
    if (opt.premium && !isPremium && !authLoading) {
      setUpgradeOpen(true);
      return;
    }
    setCompParam(opt.comp);
    setCustomMode(false);
  }

  function onCustomToggle() {
    if (!isPremium && !authLoading) {
      setUpgradeOpen(true);
      return;
    }
    setCustomMode(v => !v);
  }

  function applyCustom() {
    const code = customInput.trim().toUpperCase();
    if (!code) return;
    const isStock = BIST_TICKERS.some(t => t.symbol === code);
    const newSlug = isStock ? `hisse-${code}` : `fon-${code}`;
    if (newSlug === slug) return; // kendisiyle kıyaslama anlamsız
    setCompParam(newSlug);
  }

  const fetchData = useCallback(
    async (p: Period) => {
      setLoading(true);
      setError(false);
      try {
        const url = `/api/history/${slug}?range=${p}` + (compParam ? `&comp=${encodeURIComponent(compParam)}` : "");
        const res = await fetch(url);
        if (!res.ok) { setError(true); return; }
        setData(await res.json());
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [slug, compParam]
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

  const strokeMain = positive ? (isLight ? "#047857" : "#6ee7b7") : (isLight ? "#be123c" : "#fda4af");
  const strokeComp = isLight ? "#b45309" : "#fbbf24";
  const gridColor = isLight ? "rgba(11,16,38,0.06)" : "rgba(255,255,255,0.04)";
  const refLineColor = isLight ? "rgba(11,16,38,0.15)" : "rgba(255,255,255,0.12)";
  const tickColor = isLight ? "rgba(11,16,38,0.55)" : "rgba(216,247,238,0.35)";

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

        <div className="flex rounded-xl border border-line bg-white/[0.03] p-0.5">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                period === p.key
                  ? "bg-emerald-300 text-ink-fixed"
                  : "text-mist-3 hover:text-mist"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Karşılaştırma varlığı seçici */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="mr-0.5 text-mist-3">Karşılaştır:</span>
        {presets.map(opt => {
          const locked = opt.premium === true && !isPremium && !authLoading;
          return (
            <button
              key={opt.key}
              onClick={() => onPresetClick(opt)}
              title={locked ? "Premium özellik — yükseltmek için tıkla" : opt.label}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition ${
                !customMode && compParam === opt.comp
                  ? "bg-emerald-300/15 text-emerald-100"
                  : locked
                    ? "text-mist-3 hover:bg-fuchsia-300/8 hover:text-fuchsia-200"
                    : "text-mist-3 hover:text-mist"
              }`}
            >
              {opt.label}
              {locked && <Lock className="h-2.5 w-2.5 opacity-70" />}
            </button>
          );
        })}
        <button
          onClick={onCustomToggle}
          title={!isPremium && !authLoading ? "Premium özellik — yükseltmek için tıkla" : "Başka…"}
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition ${
            customMode
              ? "bg-emerald-300/15 text-emerald-100"
              : !isPremium && !authLoading
                ? "text-mist-3 hover:bg-fuchsia-300/8 hover:text-fuchsia-200"
                : "text-mist-3 hover:text-mist"
          }`}
        >
          Başka…
          {!isPremium && !authLoading && <Lock className="h-2.5 w-2.5 opacity-70" />}
        </button>
        {customMode && (
          <form
            onSubmit={e => { e.preventDefault(); applyCustom(); }}
            className="flex items-center gap-1.5"
          >
            <input
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              placeholder="Hisse/fon kodu"
              className="w-28 rounded-lg border border-line bg-white/[0.03] px-2 py-1 text-mist outline-none focus:border-emerald-300/40"
            />
            <button
              type="submit"
              className="rounded-lg bg-emerald-300/15 px-2.5 py-1 font-medium text-emerald-100 transition hover:bg-emerald-300/25"
            >
              Uygula
            </button>
          </form>
        )}
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
                <stop offset="5%"  stopColor={strokeComp} stopOpacity={0.15} />
                <stop offset="95%" stopColor={strokeComp} stopOpacity={0}    />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <ReferenceLine y={0} stroke={refLineColor} strokeDasharray="4 4" />

            <XAxis
              dataKey="date"
              tickFormatter={d => fmtDate(d, period)}
              tick={{ fontSize: 10, fill: tickColor }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tickFormatter={v => `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`}
              tick={{ fontSize: 10, fill: tickColor }}
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
                stroke={strokeComp}
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

      {upgradeOpen && (
        <UpgradeModal
          feature="Gelişmiş karşılaştırma (BIST 100 / Dolar / özel varlık)"
          onClose={() => setUpgradeOpen(false)}
        />
      )}
    </div>
  );
}
