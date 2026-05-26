"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Search, TrendingDown, TrendingUp } from "lucide-react";
import type { GoldTypeItem, MarketResponse } from "@/app/api/market/route";
import { isMarketResponseFresh } from "@/lib/market-helpers";
import { GOLD_CATEGORY_LABELS, type GoldCategory } from "@/data/gold-types";

const POLL_MS = 30_000;
type Tab = GoldCategory | "all";

function LiveDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-2 w-2">
      {active && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-60" />
      )}
      <span
        className={`relative inline-flex h-2 w-2 rounded-full ${
          active ? "bg-amber-300" : "bg-white/20"
        }`}
      />
    </span>
  );
}

function GoldCard({ item }: { item: GoldTypeItem }) {
  const showSpread = item.buying != null && item.selling != null;
  return (
    <Link
      href={`/altin/${item.type}`}
      className="group flex flex-col rounded-2xl border border-white/8 bg-white/[0.025] p-5
                 transition hover:border-amber-200/30 hover:bg-white/[0.045]"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/12 text-xl">
          {item.category === "gumus" ? "🥈" : "🥇"}
        </div>
        {item.changePercent !== "—" && (
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              item.isPositive ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {item.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {item.changePercent}
          </span>
        )}
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-200/60">
        {GOLD_CATEGORY_LABELS[item.category]}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium text-mist/70">{item.name}</p>

      <p className="mt-4 text-2xl font-semibold text-white">
        {item.value}
        <span className="ml-1 text-sm font-normal text-mist/40">TL</span>
      </p>

      {showSpread && (
        <p className="mt-1.5 text-[11px] text-mist/40">
          A: {item.buying!.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}{" "}
          · S: {item.selling!.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
        </p>
      )}
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/8 bg-white/[0.025] p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-10 w-10 rounded-xl bg-white/8" />
        <div className="h-3 w-12 rounded bg-white/8" />
      </div>
      <div className="h-3 w-20 rounded bg-white/8" />
      <div className="mt-1 h-4 w-28 rounded bg-white/8" />
      <div className="mt-4 h-7 w-32 rounded bg-white/8" />
    </div>
  );
}

export default function AltinPage() {
  const [data,       setData]       = useState<MarketResponse | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab,        setTab]        = useState<Tab>("standart");
  const [query,      setQuery]      = useState("");

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("/api/market", { cache: "no-store" });
      if (res.ok) {
        const json: MarketResponse = await res.json();
        setData(prev => (isMarketResponseFresh(json, "tumAltin") || !prev ? json : prev));
      }
    } catch { /* sessiz */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(() => fetchData(true), POLL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!data?.tumAltin) return [];
    const list = tab === "all"
      ? data.tumAltin
      : data.tumAltin.filter(item => item.category === tab);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(item =>
      item.type.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.nameShort.toLowerCase().includes(q)
    );
  }, [data, tab, query]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "standart", label: "Standart" },
    { key: "antika",   label: "Antika" },
    { key: "ayar",     label: "Ayar" },
    { key: "gumus",    label: "Gümüş" },
  ];

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-mist/50 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Ana Sayfa
        </Link>

        {/* Başlık */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-amber-200">Canlı fiyatlar</p>
            <h1 className="mt-1.5 text-3xl font-semibold text-white sm:text-4xl">
              Altın ve Gümüş
            </h1>
            <p className="mt-2 text-sm text-mist/50">
              Gram, çeyrek, antika sikkeler, ayar altınlar ve gümüş — alış/satış fiyatları ile birlikte.
            </p>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <LiveDot active={!loading} />
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              aria-label="Yenile"
              className="rounded-xl border border-white/8 p-2 text-mist/40 transition hover:bg-white/8 hover:text-white disabled:opacity-40"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Sekmeler + arama */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  tab === key
                    ? "bg-amber-300/15 text-amber-100"
                    : "text-mist/60 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 sm:w-72">
            <Search className="h-4 w-4 shrink-0 text-mist/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ara (gram, cumhuriyet, gümüş)"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-mist/35"
            />
          </div>
        </div>

        {/* Kart grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-mist/40">Sonuç bulunamadı.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(item => <GoldCard key={item.type} item={item} />)}
          </div>
        )}

        {/* Son güncelleme */}
        {data?.updatedAt && !loading && (
          <p className="mt-6 text-center text-xs text-mist/28">
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
