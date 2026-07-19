"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Search, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import type { BistStock } from "@/app/api/bist/route";
import type { StockAnalysisResponse } from "@/app/api/stock-analysis/route";
import { RISK_LABELS, HORIZON_LABELS, RISK_COLORS, HORIZON_COLORS } from "@/data/stocks";
import type { RiskLevel, Horizon } from "@/data/stocks";
import { UpgradeModal } from "@/components/billing/UpgradeModal";

type RiskFilter    = "all" | RiskLevel;
type HorizonFilter = "all" | Horizon;
type SortKey        = "symbol" | "price" | "change" | "aiScore";

const RISK_OPTIONS: { key: RiskFilter; label: string }[] = [
  { key: "all",    label: "Tüm risk seviyeleri" },
  { key: "low",    label: "Düşük risk" },
  { key: "medium", label: "Orta risk" },
  { key: "high",   label: "Yüksek risk" },
];

const HORIZON_OPTIONS: { key: HorizonFilter; label: string }[] = [
  { key: "all",   label: "Tüm vadeler" },
  { key: "short", label: "Kısa vadeli" },
  { key: "long",  label: "Uzun vadeli" },
];

const SORT_OPTIONS: { key: SortKey; label: string; premium?: boolean }[] = [
  { key: "symbol",  label: "Sırala: İsim (A-Z)" },
  { key: "price",   label: "Sırala: Fiyat" },
  { key: "change",  label: "Sırala: Günlük değişim" },
  { key: "aiScore", label: "Sırala: AI Skoru", premium: true },
];

interface MergedStock {
  symbol:      string;
  name:        string;
  price:       string;
  change:      string;
  changeNum:   number;
  isPositive:  boolean;
  raw:         number;
  risk:        RiskLevel;
  horizon:     Horizon;
  isWellKnown: boolean;
  aiScore:     number;
}

function parseChangePct(change: string): number {
  const n = parseFloat(change.replace(",", ".").replace(/[+%]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function LiveDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      {active && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
      )}
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-300" : "bg-white/20"}`} />
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-line bg-white/[0.025] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-3 w-16 rounded bg-white/8" />
          <div className="h-2.5 w-28 rounded bg-white/6" />
        </div>
        <div className="space-y-1.5 text-right">
          <div className="h-3 w-20 rounded bg-white/8" />
          <div className="h-2.5 w-12 rounded bg-white/6" />
        </div>
      </div>
    </div>
  );
}

export default function HisselerPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [bistStocks, setBistStocks] = useState<BistStock[]>([]);
  const [analysis, setAnalysis]     = useState<StockAnalysisResponse | null>(null);
  const [loading, setLoading]       = useState(true);
  const [updatedAt, setUpdatedAt]   = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [selectedRisk, setSelectedRisk] = useState<RiskFilter>(() => {
    const r = searchParams.get("risk");
    return r === "low" || r === "medium" || r === "high" ? r : "all";
  });
  const [selectedHorizon, setSelectedHorizon] = useState<HorizonFilter>(() => {
    const h = searchParams.get("vade");
    return h === "short" || h === "long" ? h : "all";
  });
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    const s = searchParams.get("sirala");
    return SORT_OPTIONS.some(o => o.key === s) ? (s as SortKey) : "symbol";
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedRisk !== "all") params.set("risk", selectedRisk);
    if (selectedHorizon !== "all") params.set("vade", selectedHorizon);
    if (sortKey !== "symbol") params.set("sirala", sortKey);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [query, selectedRisk, selectedHorizon, sortKey, pathname, router]);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [bistRes, analysisRes] = await Promise.all([
        fetch("/api/bist", { cache: "no-store" }),
        fetch("/api/stock-analysis", { cache: "no-store" }),
      ]);
      if (bistRes.ok) {
        const json = await bistRes.json();
        setBistStocks(json.stocks ?? []);
        setUpdatedAt(json.updatedAt);
      }
      if (analysisRes.ok) {
        setAnalysis(await analysisRes.json());
      }
    } catch {
      /* sessiz */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const merged: MergedStock[] = useMemo(() => {
    if (!analysis) return [];
    const priceMap = new Map(bistStocks.map(s => [s.symbol, s]));
    return analysis.items.map((a): MergedStock => {
      const p = priceMap.get(a.symbol);
      return {
        symbol:      a.symbol,
        name:        a.name,
        price:       p?.price ?? "—",
        change:      p?.change ?? "—",
        changeNum:   p ? parseChangePct(p.change) : 0,
        isPositive:  p?.isPositive ?? true,
        raw:         p?.raw ?? 0,
        risk:        a.risk as RiskLevel,
        horizon:     a.horizon as Horizon,
        isWellKnown: a.isWellKnown,
        aiScore:     a.aiScore,
      };
    });
  }, [analysis, bistStocks]);

  const filtered = useMemo(() => {
    let list = merged;

    if (selectedRisk !== "all") list = list.filter(s => s.risk === selectedRisk);
    if (selectedHorizon !== "all") list = list.filter(s => s.horizon === selectedHorizon);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }

    const sorted = [...list];
    if (sortKey === "symbol") sorted.sort((a, b) => a.symbol.localeCompare(b.symbol));
    else if (sortKey === "price") sorted.sort((a, b) => b.raw - a.raw);
    else if (sortKey === "change") sorted.sort((a, b) => b.changeNum - a.changeNum);
    else if (sortKey === "aiScore") sorted.sort((a, b) => b.aiScore - a.aiScore);
    return sorted;
  }, [merged, selectedRisk, selectedHorizon, query, sortKey]);

  function onSortChange(key: SortKey) {
    const option = SORT_OPTIONS.find(o => o.key === key);
    if (option?.premium && !analysis?.premium) {
      setUpgradeOpen(true);
      return;
    }
    setSortKey(key);
  }

  const hiddenCount = analysis && !analysis.premium
    ? Math.max(0, analysis.totalCount - analysis.items.length)
    : 0;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-mist-3">
          <Link href="/" className="transition hover:text-mist">Ana Sayfa</Link>
          <span>/</span>
          <span className="text-mist">Tüm Hisseler</span>
        </nav>

        {/* Hero + arama + filtreler */}
        <div className="rounded-section border border-cyan-200/14 bg-[linear-gradient(135deg,rgba(165,243,252,0.07),var(--bg))] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-cyan-200">Borsa İstanbul</p>
                <LiveDot active={!loading} />
              </div>
              <h1 className="mt-1 text-3xl font-semibold text-mist sm:text-4xl">Tüm Hisseler</h1>
              {!loading && (
                <p className="mt-1 text-sm text-mist-3">
                  {filtered.length} hisse gösteriliyor
                  {!analysis?.premium && hiddenCount > 0 && (
                    <span className="text-fuchsia-200"> · +{hiddenCount} Premium&apos;da</span>
                  )}
                  {updatedAt && (
                    <span className="ml-2 text-mist-3">
                      · {new Date(updatedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Arama */}
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-line bg-white/[0.05] px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-mist-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ara... (THYAO, BİM)"
              className="w-full bg-transparent text-sm text-mist outline-none placeholder:text-mist-3"
            />
          </div>

          {/* Filtreler */}
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value as RiskFilter)}
              style={{ colorScheme: "dark" }}
              className="rounded-xl border border-line bg-white/[0.05] px-3 py-2 text-sm text-mist outline-none transition hover:bg-white/[0.08]"
            >
              {RISK_OPTIONS.map((r) => (
                <option key={r.key} value={r.key} className="bg-ink-light text-mist">{r.label}</option>
              ))}
            </select>

            <select
              value={selectedHorizon}
              onChange={(e) => setSelectedHorizon(e.target.value as HorizonFilter)}
              style={{ colorScheme: "dark" }}
              className="rounded-xl border border-line bg-white/[0.05] px-3 py-2 text-sm text-mist outline-none transition hover:bg-white/[0.08]"
            >
              {HORIZON_OPTIONS.map((h) => (
                <option key={h.key} value={h.key} className="bg-ink-light text-mist">{h.label}</option>
              ))}
            </select>

            <select
              value={sortKey}
              onChange={(e) => onSortChange(e.target.value as SortKey)}
              style={{ colorScheme: "dark" }}
              className="rounded-xl border border-line bg-white/[0.05] px-3 py-2 text-sm text-mist outline-none transition hover:bg-white/[0.08]"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.key} value={s.key} className="bg-ink-light text-mist">
                  {s.label}{s.premium && !analysis?.premium ? " 🔒" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hisse listesi */}
        {loading ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 24 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-mist-3">Sonuç bulunamadı.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((stock, i) => (
              <Link
                key={stock.symbol}
                href={`/hisse/${stock.symbol.toLowerCase()}`}
                className="animate-enter group flex items-center justify-between gap-3 rounded-2xl border border-line bg-white/[0.025] px-4 py-3 transition hover:border-line hover:bg-white/[0.05]"
                style={{ "--enter-index": Math.min(i, 12) } as CSSProperties}
              >
                {/* Sol: sembol + isim + badge */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-mist">{stock.symbol}</p>
                  <p className="mt-0.5 truncate text-xs text-mist-3">{stock.name}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${RISK_COLORS[stock.risk]}`}>
                      {RISK_LABELS[stock.risk]}
                    </span>
                    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${HORIZON_COLORS[stock.horizon]}`}>
                      {HORIZON_LABELS[stock.horizon]}
                    </span>
                    {sortKey === "aiScore" && analysis?.premium && (
                      <span className="inline-flex items-center gap-0.5 rounded-md border border-fuchsia-300/25 bg-fuchsia-300/10 px-1.5 py-0.5 text-[10px] font-medium text-fuchsia-200">
                        <Sparkles className="h-2.5 w-2.5" />
                        {stock.aiScore.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sağ: fiyat + değişim */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-mist">{stock.price}</p>
                  <p className={`mt-0.5 flex items-center justify-end gap-0.5 text-xs font-medium ${
                    stock.isPositive ? "text-emerald-300" : "text-rose-300"
                  }`}>
                    {stock.isPositive
                      ? <TrendingUp className="h-3 w-3" />
                      : <TrendingDown className="h-3 w-3" />}
                    {stock.change}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!analysis?.premium && hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setUpgradeOpen(true)}
            className="w-full rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/[0.04] px-5 py-4 text-center text-sm text-fuchsia-200 transition hover:bg-fuchsia-300/[0.08]"
          >
            BIST 30 dışındaki {hiddenCount} hisse ve AI Skoru sıralaması Premium&apos;da — yükseltmek için tıkla
          </button>
        )}

        {/* Geri dön */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white/[0.03] px-4 py-2.5 text-sm text-mist-3 transition hover:bg-white/[0.06] hover:text-mist"
          >
            <ArrowLeft className="h-4 w-4" />
            Ana sayfaya dön
          </Link>
        </div>

      </div>

      {upgradeOpen && (
        <UpgradeModal feature="Tüm BIST hisseleri ve AI Skoru sıralaması" onClose={() => setUpgradeOpen(false)} />
      )}
    </main>
  );
}
