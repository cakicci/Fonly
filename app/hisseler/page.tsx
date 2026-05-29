"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, TrendingDown, TrendingUp } from "lucide-react";
import type { BistStock } from "@/app/api/bist/route";
import { stocks, RISK_LABELS, HORIZON_LABELS, RISK_COLORS, HORIZON_COLORS } from "@/data/stocks";

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
    <div className="animate-pulse rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3">
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
  const [allStocks, setAllStocks] = useState<BistStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const metaMap = useMemo(() => new Map(stocks.map((s) => [s.symbol, s])), []);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/bist", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setAllStocks(json.stocks ?? []);
        setUpdatedAt(json.updatedAt);
      }
    } catch {
      /* sessiz */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allStocks;
    return allStocks.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
    );
  }, [allStocks, query]);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-mist/45">
          <Link href="/" className="transition hover:text-white">Ana Sayfa</Link>
          <span>/</span>
          <span className="text-white">Tüm Hisseler</span>
        </nav>

        {/* Hero + arama */}
        <div className="rounded-[1.75rem] border border-cyan-200/14 bg-[linear-gradient(135deg,rgba(165,243,252,0.07),rgba(11,16,38,0.98))] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-cyan-200">Borsa İstanbul</p>
                <LiveDot active={!loading} />
              </div>
              <h1 className="mt-1 text-3xl font-semibold text-white sm:text-4xl">Tüm Hisseler</h1>
              {!loading && (
                <p className="mt-1 text-sm text-mist/45">
                  {filtered.length} hisse gösteriliyor
                  {updatedAt && (
                    <span className="ml-2 text-mist/30">
                      · {new Date(updatedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Arama */}
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-mist/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ara... (THYAO, BİM)"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-mist/35"
            />
          </div>
        </div>

        {/* Hisse listesi */}
        {loading ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 24 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-mist/40">Sonuç bulunamadı.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((stock) => {
              const meta = metaMap.get(stock.symbol);
              return (
                <Link
                  key={stock.symbol}
                  href={`/hisse/${stock.symbol.toLowerCase()}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3 transition hover:border-white/16 hover:bg-white/[0.05]"
                >
                  {/* Sol: sembol + isim + badge */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{stock.symbol}</p>
                    <p className="mt-0.5 truncate text-xs text-mist/50">{stock.name}</p>
                    {meta && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${RISK_COLORS[meta.risk]}`}>
                          {RISK_LABELS[meta.risk]}
                        </span>
                        <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${HORIZON_COLORS[meta.horizon]}`}>
                          {HORIZON_LABELS[meta.horizon]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sağ: fiyat + değişim */}
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-white">{stock.price}</p>
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
              );
            })}
          </div>
        )}

        {/* Geri dön */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-2.5 text-sm text-mist/60 transition hover:bg-white/[0.06] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Ana sayfaya dön
          </Link>
        </div>

      </div>
    </main>
  );
}
