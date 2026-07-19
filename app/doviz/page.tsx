"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, TrendingDown, TrendingUp } from "lucide-react";
import type { CurrencyItem, MarketResponse } from "@/app/api/market/route";
import { isMarketResponseFresh } from "@/lib/market-helpers";
import { CURRENCY_MAP } from "@/data/currencies";
import { FlashPrice } from "@/components/FlashPrice";
import { ConverterWidget } from "@/components/ConverterWidget";

const POLL_MS = 5_000;
type Tab = "major" | "other";

function LiveDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-2 w-2">
      {active && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
      )}
      <span
        className={`relative inline-flex h-2 w-2 rounded-full ${
          active ? "bg-emerald-300" : "bg-white/20"
        }`}
      />
    </span>
  );
}

function CurrencyCard({ item }: { item: CurrencyItem }) {
  return (
    <Link
      href={`/doviz/${item.code.toLowerCase()}`}
      className="group flex flex-col rounded-2xl border border-line bg-white/[0.025] p-5
                 transition hover:border-cyan-200/25 hover:bg-white/[0.045]"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-3xl">{item.flag}</span>
        <span
          className={`flex items-center gap-1 text-xs font-medium ${
            item.isPositive ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {item.isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {item.changePercent}
        </span>
      </div>

      <p className="text-[11px] font-semibold text-mist-3">
        {item.code}
        {item.displayPer > 1 ? ` (${item.displayPer})` : ""}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium text-mist-2">{item.shortName}</p>

      <FlashPrice value={item.rawValue} className="mt-4 text-2xl font-semibold text-mist">
        {item.value}
        <span className="ml-1 text-sm font-normal text-mist-3">TL</span>
      </FlashPrice>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-line bg-white/[0.025] p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-8 w-8 rounded-full bg-white/8" />
        <div className="h-3 w-12 rounded bg-white/8" />
      </div>
      <div className="h-3 w-10 rounded bg-white/8" />
      <div className="mt-1 h-4 w-24 rounded bg-white/8" />
      <div className="mt-4 h-7 w-28 rounded bg-white/8" />
    </div>
  );
}

export default function DovizPage() {
  const [data,    setData]    = useState<MarketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<Tab>("major");
  const [query,   setQuery]   = useState("");

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/market", { cache: "no-store" });
      if (res.ok) {
        const json: MarketResponse = await res.json();
        // Truncgil hiccup'larında tüm değerler "—" dönebiliyor — bu durumda
        // ekrana yansıtmayıp eski state'i koru. İlk yükte istisna yok (initial
        // load null state'te zaten skeleton/uyarı gösteriyor).
        setData(prev => (isMarketResponseFresh(json, "doviz") || !prev ? json : prev));
      }
    } catch { /* sessiz */ }
    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(() => fetchData(true), POLL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!data?.doviz) return [];
    const list = data.doviz.filter((item) => {
      const meta = CURRENCY_MAP[item.code];
      return meta?.category === tab;
    });
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) =>
      item.code.toLowerCase().includes(q) ||
      item.shortName.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q)
    );
  }, [data, tab, query]);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-mist-3 transition hover:text-mist"
        >
          <ArrowLeft className="h-4 w-4" />
          Ana Sayfa
        </Link>

        {/* Başlık */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-cyan-200">Canlı kurlar</p>
            <h1 className="mt-1.5 text-3xl font-semibold text-mist sm:text-4xl">
              Döviz Kurları
            </h1>
            <p className="mt-2 text-sm text-mist-3">
              Tüm kurlar Türk Lirası (TL) cinsinden. JPY, IQD ve HUF 100 birim; IDR 1000 birim olarak gösterilir.
            </p>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <LiveDot active={!loading} />
          </div>
        </div>

        {/* Hızlı çevirici */}
        <div className="mb-6">
          <ConverterWidget data={data} />
        </div>

        {/* Sekmeler + arama */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-2xl border border-line bg-white/[0.03] p-1">
            <button
              onClick={() => setTab("major")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                tab === "major"
                  ? "bg-cyan-300/15 text-cyan-100"
                  : "text-mist-3 hover:text-mist"
              }`}
            >
              Yaygın 8
            </button>
            <button
              onClick={() => setTab("other")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                tab === "other"
                  ? "bg-cyan-300/15 text-cyan-100"
                  : "text-mist-3 hover:text-mist"
              }`}
            >
              Diğer Dövizler
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-line bg-white/[0.04] px-3 py-2 sm:w-72">
            <Search className="h-4 w-4 shrink-0 text-mist-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ara (USD, ruble, riyal)"
              className="w-full bg-transparent text-sm text-mist outline-none placeholder:text-mist-3"
            />
          </div>
        </div>

        {/* Kart grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-mist-3">Sonuç bulunamadı.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map(item => <CurrencyCard key={item.code} item={item} />)}
          </div>
        )}

        {/* Son güncelleme */}
        {data?.updatedAt && !loading && (
          <p className="mt-6 text-center text-xs text-mist-3">
            Son güncelleme:{" "}
            {new Date(data.updatedAt).toLocaleTimeString("tr-TR", {
              hour: "2-digit", minute: "2-digit", second: "2-digit"
            })}
          </p>
        )}

      </div>
    </main>
  );
}
