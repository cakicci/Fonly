"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, TrendingDown, TrendingUp } from "lucide-react";
import type { GoldTypeItem, MarketResponse } from "@/app/api/market/route";
import { isMarketResponseFresh } from "@/lib/market-helpers";
import { GOLD_CATEGORY_LABELS, type GoldCategory } from "@/data/gold-types";
import { FlashPrice } from "@/components/FlashPrice";

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

function fmtTr(n: number, max = 2) {
  return n.toLocaleString("tr-TR", { maximumFractionDigits: max, minimumFractionDigits: max });
}

function GoldRow({ item }: { item: GoldTypeItem }) {
  const router = useRouter();
  const hasChange = item.changePercent !== "—";
  const icon = item.category === "gumus" ? "🥈" : "🥇";
  return (
    <tr
      onClick={() => router.push(`/altin/${item.type}`)}
      className="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.03]"
    >
      {/* Sembol */}
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-300/12 text-base">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{item.nameShort}</div>
            <div className="truncate text-[11px] text-mist/45">
              {GOLD_CATEGORY_LABELS[item.category]}
            </div>
          </div>
        </div>
      </td>

      {/* Fiyat */}
      <td className="px-3 py-3 text-right">
        <FlashPrice value={item.rawValue} className="text-sm font-semibold text-white">
          {item.value}
          <span className="ml-1 text-xs font-normal text-mist/45">TL</span>
        </FlashPrice>
      </td>

      {/* Fark (%) */}
      <td className="px-3 py-3 text-right">
        {hasChange ? (
          <span
            className={`inline-flex items-center gap-1 text-sm font-medium tabular-nums ${
              item.isPositive ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {item.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {item.changePercent}
          </span>
        ) : (
          <span className="text-sm text-mist/30">—</span>
        )}
      </td>

      {/* Alış */}
      <td className="px-3 py-3 text-right text-sm tabular-nums text-mist/70">
        {item.buying != null ? fmtTr(item.buying) : <span className="text-mist/30">—</span>}
      </td>

      {/* Satış */}
      <td className="py-3 pl-3 pr-4 text-right text-sm tabular-nums text-mist/70">
        {item.selling != null ? fmtTr(item.selling) : <span className="text-mist/30">—</span>}
      </td>
    </tr>
  );
}

function RowSkeleton() {
  return (
    <tr className="border-b border-white/5">
      <td className="py-4 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-white/8" />
          <div className="space-y-1.5">
            <div className="h-3 w-24 animate-pulse rounded bg-white/8" />
            <div className="h-2.5 w-16 animate-pulse rounded bg-white/8" />
          </div>
        </div>
      </td>
      <td className="px-3 py-4 text-right">
        <div className="ml-auto h-3 w-20 animate-pulse rounded bg-white/8" />
      </td>
      <td className="px-3 py-4 text-right">
        <div className="ml-auto h-3 w-14 animate-pulse rounded bg-white/8" />
      </td>
      <td className="px-3 py-4 text-right">
        <div className="ml-auto h-3 w-16 animate-pulse rounded bg-white/8" />
      </td>
      <td className="py-4 pl-3 pr-4 text-right">
        <div className="ml-auto h-3 w-16 animate-pulse rounded bg-white/8" />
      </td>
    </tr>
  );
}

export default function AltinPage() {
  const [data,    setData]    = useState<MarketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<Tab>("all");
  const [query,   setQuery]   = useState("");

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/market", { cache: "no-store" });
      if (res.ok) {
        const json: MarketResponse = await res.json();
        setData(prev => (isMarketResponseFresh(json, "tumAltin") || !prev ? json : prev));
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
    { key: "all",      label: "Tümü" },
    { key: "standart", label: "Standart" },
    { key: "antika",   label: "Antika" },
    { key: "ayar",     label: "Ayar" },
    { key: "gumus",    label: "Gümüş" },
  ];

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
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
            <p className="text-sm font-medium text-amber-200">Serbest Piyasa</p>
            <h1 className="mt-1.5 text-3xl font-semibold text-white sm:text-4xl">
              Altın Fiyatları
            </h1>
            <p className="mt-2 text-sm text-mist/50">
              Gram, çeyrek, antika sikkeler, ayar altınlar ve gümüş — alış/satış fiyatları ile birlikte.
            </p>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <LiveDot active={!loading} />
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

        {/* Tablo */}
        <div className="overflow-x-auto rounded-2xl border border-white/8 bg-white/[0.02]">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] font-semibold uppercase tracking-wider text-mist/45">
                <th className="py-3 pl-4 pr-3 text-left">Sembol</th>
                <th className="px-3 py-3 text-right">Fiyat</th>
                <th className="px-3 py-3 text-right">Fark (%)</th>
                <th className="px-3 py-3 text-right">Alış</th>
                <th className="py-3 pl-3 pr-4 text-right">Satış</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-mist/40">
                    Sonuç bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map(item => <GoldRow key={item.type} item={item} />)
              )}
            </tbody>
          </table>
        </div>

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
