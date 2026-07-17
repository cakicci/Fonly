"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BarChart2, Coins, ExternalLink, Gem, TrendingDown, TrendingUp } from "lucide-react";
import type { MarketResponse } from "@/app/api/market/route";
import { isMarketResponseFresh } from "@/lib/market-helpers";
import { FlashPrice, parseTrPrice } from "./FlashPrice";

const POLL_MS = 5_000;

// ── Canlı göstergesi ───────────────────────────────────────────────────────
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

// ── Skeleton satırı ────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center justify-between animate-pulse">
      <div className="h-4 w-20 rounded-lg bg-white/8" />
      <div className="h-5 w-24 rounded-lg bg-white/8" />
    </div>
  );
}

// ── Son güncelleme ─────────────────────────────────────────────────────────
function UpdatedAt({ iso }: { iso: string }) {
  const time = new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
  return <p className="mt-4 text-right text-xs text-mist-3">{time}</p>;
}

// ── Döviz Paneli ───────────────────────────────────────────────────────────
function DovizPanel({ data, loading }: { data: MarketResponse | null; loading: boolean }) {
  // Gösterilecek dövizler (panel için ilk 5)
  const displayCurrencies = data?.doviz.slice(0, 5) ?? [];

  return (
    <div className="flex flex-col rounded-panel border border-white/8 bg-white/[0.03] p-5">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200">
          <Coins className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-mist-3">Canlı kur</p>
          <h3 className="text-base font-semibold text-white">Döviz</h3>
        </div>
        <LiveDot active={!loading} />
        <Link
          href="/doviz"
          className="ml-1 flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-mist-3
                     transition hover:bg-white/8 hover:text-cyan-200"
        >
          Tümü <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {loading || !data
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          : displayCurrencies.map(item => (
              <Link
                key={item.code}
                href={`/doviz/${item.code.toLowerCase()}`}
                className="flex items-center justify-between rounded-xl px-2 py-1
                           transition hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{item.flag}</span>
                  <span className="text-sm text-mist-2">
                    {item.shortName}
                    {item.displayPer > 1 && (
                      <span className="ml-1 text-xs text-mist-3">({item.displayPer})</span>
                    )}
                  </span>
                </div>
                <div className="text-right">
                  <FlashPrice value={item.rawValue} className="text-sm font-semibold text-white">
                    {item.value}
                    <span className="ml-1 text-xs font-normal text-mist-3">TL</span>
                  </FlashPrice>
                  <span
                    className={`ml-2 text-xs font-medium ${
                      item.isPositive ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {item.changePercent}
                  </span>
                </div>
              </Link>
            ))}
      </div>

      {data && <UpdatedAt iso={data.updatedAt} />}
    </div>
  );
}

// ── Altın Paneli ───────────────────────────────────────────────────────────
function AltinPanel({ data, loading }: { data: MarketResponse | null; loading: boolean }) {
  return (
    <div className="flex flex-col rounded-panel border border-amber-200/14
                    bg-[linear-gradient(135deg,rgba(251,191,36,0.06),rgba(255,255,255,0.02))] p-5">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-300/12 text-amber-200">
          <Gem className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-mist-3">Anlık fiyat</p>
          <h3 className="text-base font-semibold text-white">Altın</h3>
        </div>
        <LiveDot active={!loading} />
        <Link
          href="/altin"
          className="ml-1 flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-mist-3
                     transition hover:bg-white/8 hover:text-amber-200"
        >
          Tümü <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {loading || !data ? (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : (
        <div className="space-y-3">
          <Link href="/altin/gram" className="block rounded-xl px-2 py-1 transition hover:bg-white/[0.04]">
            <p className="text-xs text-mist-3">Gram altın</p>
            <FlashPrice
              value={data.altin.gramRaw}
              className="mt-1 text-3xl font-semibold text-amber-200"
            >
              {data.altin.gram}
            </FlashPrice>
          </Link>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: "Çeyrek", value: data.altin.ceyrek, type: "ceyrek" },
              { label: "Yarım",  value: data.altin.yarim,  type: "yarim"  },
              { label: "Tam",    value: data.altin.tam,    type: "tam"    },
            ].map(({ label, value, type }) => (
              <Link
                key={type}
                href={`/altin/${type}`}
                className="rounded-xl border border-white/8 bg-white/[0.04] p-2.5 text-center
                           transition hover:border-amber-200/20 hover:bg-white/[0.07]"
              >
                <p className="text-[10px] text-mist-3">{label}</p>
                <FlashPrice value={parseTrPrice(value)} className="mt-1 text-xs font-semibold text-white">
                  {value}
                </FlashPrice>
              </Link>
            ))}
          </div>

          <div className="px-2">
            <p className="text-xs text-mist-3">Ons (USD)</p>
            <FlashPrice value={parseTrPrice(data.altin.oz)} className="mt-0.5 text-sm font-semibold text-white">
              {data.altin.oz}
            </FlashPrice>
          </div>
        </div>
      )}

      {data && <UpdatedAt iso={data.updatedAt} />}
    </div>
  );
}

// ── Borsa Paneli ───────────────────────────────────────────────────────────
function BorsaPanel({ data, loading }: { data: MarketResponse | null; loading: boolean }) {
  // İlk eleman BIST 100, kalanlar bireysel hisseler
  const endeks  = data?.borsa[0] ?? null;
  const hisseler = data?.borsa.slice(1) ?? [];

  return (
    <div className="flex flex-col rounded-panel border border-emerald-200/14
                    bg-[linear-gradient(135deg,rgba(45,227,168,0.06),rgba(255,255,255,0.02))] p-5">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-300/12 text-emerald-200">
          <BarChart2 className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-mist-3">Anlık endeks</p>
          <h3 className="text-base font-semibold text-white">Borsa</h3>
        </div>
        <LiveDot active={!loading} />
        <Link
          href="/hisseler"
          className="ml-1 flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-mist-3
                     transition hover:bg-white/8 hover:text-emerald-200"
        >
          Tümü <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {loading || !data ? (
        <div className="space-y-3">
          <div className="animate-pulse">
            <div className="h-9 w-36 rounded-lg bg-white/8" />
            <div className="mt-2 h-5 w-20 rounded-lg bg-white/8" />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* BIST 100 endeksi */}
          {endeks && (
            <div>
              <p className="text-xs text-mist-3">{endeks.name}</p>
              <FlashPrice
                value={parseTrPrice(endeks.value)}
                className="mt-1 text-3xl font-semibold text-white"
              >
                {endeks.value}
              </FlashPrice>
              <div
                className={`mt-2 flex items-center gap-1 text-sm font-semibold ${
                  endeks.isPositive ? "text-emerald-200" : "text-rose-200"
                }`}
              >
                {endeks.isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {endeks.changePercent}
              </div>
            </div>
          )}

          {/* Bireysel hisseler */}
          {hisseler.length > 0 && (
            <div className="mt-1 space-y-1 pt-2 border-t border-white/6">
              {hisseler.map(item => (
                <Link
                  key={item.symbol}
                  href={`/hisse/${item.symbol.toLowerCase()}`}
                  className="flex items-center justify-between rounded-xl px-2 py-1.5
                             transition hover:bg-white/[0.05]"
                >
                  <div>
                    <p className="text-xs font-semibold text-white">{item.symbol}</p>
                    <p className="text-[10px] text-mist-3">{item.name}</p>
                  </div>
                  <div className="text-right">
                    <FlashPrice value={parseTrPrice(item.value)} className="text-xs font-semibold text-white">
                      {item.value}
                    </FlashPrice>
                    <p
                      className={`text-[10px] font-medium ${
                        item.isPositive ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {item.changePercent}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {data && <UpdatedAt iso={data.updatedAt} />}
    </div>
  );
}

// ── Ana bileşen ─────────────────────────────────────────────────────────────
export function LiveMarketPanels() {
  const [data,    setData]    = useState<MarketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/market", { cache: "no-store" });
      if (res.ok) {
        const json: MarketResponse = await res.json();
        setData(prev => (isMarketResponseFresh(json) || !prev ? json : prev));
      }
    } catch { /* sessizce geç */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchData]);

  return (
    <section className="rounded-section border border-white/8 bg-white/[0.015] p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-200">Canlı piyasa</p>
          <h2 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
            Anlık fiyatlar
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-xs text-mist-3">
          <LiveDot active={!loading} />
          <span>5 sn&apos;de bir güncellenir</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <DovizPanel  data={data} loading={loading} />
        <AltinPanel  data={data} loading={loading} />
        <BorsaPanel  data={data} loading={loading} />
      </div>
    </section>
  );
}
