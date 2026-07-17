"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, TrendingDown, TrendingUp } from "lucide-react";
import type { BistStock } from "@/app/api/bist/route";
import { FlashPrice } from "./FlashPrice";

const REFRESH_MS = 60_000; // 1 dakika (batch fetch ağır olduğundan)

function LiveDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      {active && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />}
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-300" : "bg-white/20"}`} />
    </span>
  );
}

function StockRow({ stock }: { stock: BistStock }) {
  return (
    <Link
      href={`/hisse/${stock.symbol.toLowerCase()}`}
      className="flex items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-white/[0.05]"
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold text-white">{stock.symbol}</p>
        <p className="mt-0.5 truncate text-[10px] text-mist-3">{stock.name}</p>
      </div>
      <div className="shrink-0 text-right">
        <FlashPrice value={stock.raw} className="text-xs font-semibold text-white">
          {stock.price}
        </FlashPrice>
        <p className={`mt-0.5 flex items-center justify-end gap-0.5 text-[10px] font-medium ${
          stock.isPositive ? "text-emerald-300" : "text-rose-300"
        }`}>
          {stock.isPositive
            ? <TrendingUp className="h-2.5 w-2.5" />
            : <TrendingDown className="h-2.5 w-2.5" />}
          {stock.change}
        </p>
      </div>
    </Link>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center justify-between px-3 py-2.5">
          <div className="space-y-1.5">
            <div className="h-3 w-14 rounded bg-white/8" />
            <div className="h-2.5 w-24 rounded bg-white/6" />
          </div>
          <div className="space-y-1.5 text-right">
            <div className="h-3 w-16 rounded bg-white/8" />
            <div className="h-2.5 w-10 rounded bg-white/6" />
          </div>
        </div>
      ))}
    </>
  );
}

export function BistPanel() {
  const [stocks, setStocks] = useState<BistStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/bist", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setStocks(json.stocks ?? []);
        setUpdatedAt(json.updatedAt);
      }
    } catch { /* sessiz */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const id = setInterval(() => fetchData(true), REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stocks;
    return stocks.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [stocks, query]);

  return (
    <aside className="glass-card sticky top-6 order-3 flex w-full max-h-[70vh] flex-col rounded-panel lg:order-1 lg:w-64 lg:max-h-[calc(100vh-3rem)]">

      {/* Başlık */}
      <div className="flex items-center justify-between gap-2 p-4 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-mist-3">Borsa İstanbul</p>
            <LiveDot active={!loading} />
          </div>
          <h2 className="mt-0.5 text-base font-semibold text-white">Tüm Hisseler</h2>
        </div>
      </div>

      {/* Arama */}
      <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2">
        <Search className="h-3.5 w-3.5 shrink-0 text-mist-3" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ara... (THYAO, BİM)"
          className="w-full bg-transparent text-xs text-white outline-none placeholder:text-mist-3"
        />
      </div>

      {/* Hisse sayısı */}
      {!loading && (
        <p className="px-4 pb-1 text-[10px] text-mist-3">
          {filtered.length} hisse gösteriliyor
        </p>
      )}

      {/* Liste */}
      <div className="min-h-0 flex-1 overflow-y-auto px-1">
        {loading ? (
          <SkeletonRows />
        ) : filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-mist-3">Sonuç bulunamadı.</p>
        ) : (
          filtered.map((stock) => <StockRow key={stock.symbol} stock={stock} />)
        )}
      </div>

      {/* Son güncelleme */}
      {updatedAt && !loading && (
        <p className="p-3 text-center text-[10px] text-mist-3">
          {new Date(updatedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      )}
    </aside>
  );
}
