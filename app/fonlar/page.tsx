"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, Search, TrendingDown, TrendingUp } from "lucide-react";
import type { FundListItem } from "@/app/api/fonlar/route";
import { RISK_COLORS, RISK_LABELS } from "@/data/stocks";
import { normalizeTurkish } from "@/lib/tefas";
import { fmtPercent } from "@/lib/format";

type SortKey = "kod" | "getiri1y" | "getiri1a" | "getiriyb";

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

function fmtPct(value: number | null): string {
  if (value === null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${fmtPercent(value)}%`;
}

export default function FonlarPage() {
  const [allFunds, setAllFunds] = useState<FundListItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("getiri1y");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/fonlar", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setAllFunds(json.funds ?? []);
        setCategories(json.categories ?? []);
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
    let list = allFunds;

    if (selectedCategory !== "all") {
      list = list.filter((f) => f.kategori === selectedCategory);
    }

    const q = query.trim();
    if (q) {
      const qNorm = normalizeTurkish(q);
      list = list.filter((f) => {
        const kodMatch = f.kod.toLowerCase().includes(q.toLowerCase());
        const adMatch = normalizeTurkish(f.ad).includes(qNorm);
        return kodMatch || adMatch;
      });
    }

    const sorted = [...list];
    if (sortKey === "kod") {
      sorted.sort((a, b) => a.kod.localeCompare(b.kod));
    } else {
      // Sayısal getiri — null değerler en sona
      sorted.sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return bv - av; // büyükten küçüğe
      });
    }
    return sorted;
  }, [allFunds, selectedCategory, query, sortKey]);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-mist-3">
          <Link href="/" className="transition hover:text-white">Ana Sayfa</Link>
          <span>/</span>
          <span className="text-white">Tüm Fonlar</span>
        </nav>

        {/* Hero + arama + filtreler */}
        <div className="rounded-section border border-sky-200/14 bg-[linear-gradient(135deg,rgba(186,230,253,0.07),rgba(11,16,38,0.98))] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-sky-200">TEFAS</p>
                <LiveDot active={!loading} />
              </div>
              <h1 className="mt-1 text-3xl font-semibold text-white sm:text-4xl">Tüm Yatırım Fonları</h1>
              {!loading && (
                <p className="mt-1 text-sm text-mist-3">
                  {filtered.length} fon gösteriliyor
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
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-mist-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ara... (AAK, garanti portföy, altın)"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-mist-3"
            />
          </div>

          {/* Filtreler */}
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white outline-none transition hover:bg-white/[0.08]"
            >
              <option value="all">Tüm kategoriler</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white outline-none transition hover:bg-white/[0.08]"
            >
              <option value="getiri1y">Sırala: 1 yıllık getiri</option>
              <option value="getiriyb">Sırala: Yılbaşından</option>
              <option value="getiri1a">Sırala: 1 aylık getiri</option>
              <option value="kod">Sırala: Fon kodu</option>
            </select>
          </div>
        </div>

        {/* Fon listesi */}
        {loading ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 24 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-mist-3">Sonuç bulunamadı.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((fund, i) => {
              const primary =
                sortKey === "kod" ? fund.getiri1y :
                fund[sortKey];
              const isPositive = primary !== null && primary >= 0;

              return (
                <Link
                  key={fund.kod}
                  href={`/fon/${fund.kod.toLowerCase()}`}
                  className="animate-enter group flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3 transition hover:border-white/16 hover:bg-white/[0.05]"
                  style={{ "--enter-index": Math.min(i, 12) } as CSSProperties}
                >
                  {/* Sol: kod + ad + badge */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{fund.kod}</p>
                    <p className="mt-0.5 truncate text-xs text-mist-3" title={fund.ad}>{fund.ad}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {fund.riskGroup && (
                        <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${RISK_COLORS[fund.riskGroup]}`}>
                          {RISK_LABELS[fund.riskGroup]}
                          {fund.risk !== null && (
                            <span className="ml-1 opacity-70">({fund.risk})</span>
                          )}
                        </span>
                      )}
                      <span className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-mist-3">
                        {fund.kategori.replace(" Şemsiye Fonu", "")}
                      </span>
                    </div>
                  </div>

                  {/* Sağ: birincil getiri */}
                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-semibold ${
                      primary === null ? "text-mist-3" :
                      isPositive ? "text-emerald-300" : "text-rose-300"
                    }`}>
                      {fmtPct(primary)}
                    </p>
                    <p className="mt-0.5 flex items-center justify-end gap-0.5 text-[10px] font-medium text-mist-3">
                      {sortKey === "getiri1y" || sortKey === "kod" ? "1 yıl" :
                       sortKey === "getiriyb" ? "YBI" :
                       "1 ay"}
                      {primary !== null && (
                        isPositive
                          ? <TrendingUp className="h-3 w-3" />
                          : <TrendingDown className="h-3 w-3" />
                      )}
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
            className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-2.5 text-sm text-mist-3 transition hover:bg-white/[0.06] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Ana sayfaya dön
          </Link>
        </div>

      </div>
    </main>
  );
}
