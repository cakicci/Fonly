"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart2,
  CircleDollarSign,
  Gem,
  Lightbulb,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import type { MarketResponse } from "@/app/api/market/route";
import { isMarketResponseFresh } from "@/lib/market-helpers";
import { FlashPrice, parseTrPrice } from "./FlashPrice";

const REFRESH_INTERVAL = 5_000;

const TIPS = [
  "Yatırım yapmadan önce en az 3 aylık giderini acil fonda tut.",
  "Tek bir araca tüm parayı koymak yerine çeşitlendirme yapmak riski dağıtır.",
  "Gram altın, uzun vadede enflasyona karşı koruma sağlayabilir.",
  "BIST 100 endeksi, İstanbul Borsası'ndaki en büyük 100 şirketi takip eder.",
  "Döviz kurları günlük değişse de uzun vadede TL değer kaybetme eğilimindedir.",
  "Kısa vadeli fiyat hareketlerine bakarak karar vermek çoğu zaman yanıltıcıdır.",
  "Düşen piyasalar panik değil, uzun vadeli yatırımcı için fırsat olabilir.",
];

// ── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center justify-between py-2">
      <div className="h-3 w-24 rounded-md bg-white/8" />
      <div className="h-3 w-16 rounded-md bg-white/8" />
    </div>
  );
}

// ── Canlı nokta ──────────────────────────────────────────────────────────────
function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
    </span>
  );
}

// ── Grup başlığı ─────────────────────────────────────────────────────────────
function GroupLabel({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

// ── Veri satırı ──────────────────────────────────────────────────────────────
function Row({
  label,
  value,
  rawValue,
  flag,
  badge,
  isPositive,
  highlight = false,
  href,
}: {
  label: string;
  value: string;
  /** Numeric raw price for flash-on-change. Undefined → no flash. */
  rawValue?: number;
  flag?: string;
  badge?: string;
  isPositive?: boolean;
  highlight?: boolean;
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex items-center gap-1.5 min-w-0">
        {flag && <span className="text-xs shrink-0">{flag}</span>}
        <span className={`truncate text-sm ${highlight ? "font-medium text-mist" : "text-mist-2"}`}>
          {label}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {badge && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-emerald-300" : "text-rose-300"}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {badge}
          </span>
        )}
        <FlashPrice value={rawValue} className="text-sm font-semibold text-mist">
          {value}
        </FlashPrice>
      </div>
    </>
  );

  const cls = `flex items-center justify-between gap-2 py-2 ${
    highlight ? "rounded-lg px-2 -mx-2 bg-white/[0.03]" : ""
  } ${href ? "cursor-pointer rounded-xl px-1 -mx-1 transition hover:bg-white/[0.04]" : ""}`;

  return href ? (
    <Link href={href} className={cls}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

// ── Ana bileşen ──────────────────────────────────────────────────────────────
export function MarketSidebar() {
  const [data, setData] = useState<MarketResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Hydration güvenli: SSR + ilk render'da sabit (0), mount sonrası "günün"
  // ipucu seçilir. Math.random()'u render sırasında çağırmak sunucu/istemci
  // uyuşmazlığına (hydration error) yol açıyordu.
  const [tipIndex, setTipIndex] = useState(0);
  useEffect(() => {
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000
    );
    setTipIndex(dayOfYear % TIPS.length);
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch("/api/market", { cache: "no-store" });
      if (res.ok) {
        const json: MarketResponse = await res.json();
        setData(prev => (isMarketResponseFresh(json) || !prev ? json : prev));
      }
    } catch { /* sessiz */ } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const id = setInterval(() => fetchData(true), REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  // İlk eleman BIST 100 endeksi, kalanlar bireysel hisseler
  const endeks = data?.borsa[0] ?? null;
  const hisseler = data?.borsa.slice(1) ?? [];

  return (
    <aside className="glass-card sticky top-6 order-2 flex flex-col gap-4 rounded-panel p-5 lg:order-3 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">

      {/* Başlık */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-mist-3">Piyasa özeti</p>
            {!isLoading && <LiveDot />}
          </div>
          <h2 className="mt-1 text-xl font-semibold text-mist">Bugün ne oluyor?</h2>
        </div>
      </div>

      {/* ── Döviz ── */}
      <div className="rounded-2xl border border-line bg-white/[0.03] p-4">
        <GroupLabel icon={CircleDollarSign} label="Döviz" color="text-cyan-200" />
        <div className="mt-1 divide-y divide-white/6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
            : data?.doviz.slice(0, 4).map((item) => (
                <Row
                  key={item.code}
                  label={item.shortName}
                  value={`${item.value} TL`}
                  rawValue={item.rawValue}
                  flag={item.flag}
                  href={`/doviz/${item.code.toLowerCase()}`}
                />
              ))}
        </div>
        {!isLoading && (
          <Link
            href="/doviz"
            className="mt-2 block text-center text-[11px] text-cyan-200/60 transition hover:text-cyan-200"
          >
            Tüm kurlar →
          </Link>
        )}
      </div>

      {/* ── Altın ── */}
      <div className="rounded-2xl border border-amber-200/14 bg-amber-300/[0.04] p-4">
        <GroupLabel icon={Gem} label="Altın" color="text-amber-200" />
        <div className="mt-1 divide-y divide-white/6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
          ) : (
            <>
              <Row label="Gram"   value={data?.altin.gram   ?? "—"} rawValue={data?.altin.gramRaw}            highlight href="/altin/gram"   />
              <Row label="Çeyrek" value={data?.altin.ceyrek ?? "—"} rawValue={parseTrPrice(data?.altin.ceyrek)} href="/altin/ceyrek" />
              <Row label="Yarım"  value={data?.altin.yarim  ?? "—"} rawValue={parseTrPrice(data?.altin.yarim)}  href="/altin/yarim"  />
              <Row label="Tam"    value={data?.altin.tam    ?? "—"} rawValue={parseTrPrice(data?.altin.tam)}    href="/altin/tam"    />
            </>
          )}
        </div>
        {!isLoading && (
          <Link
            href="/altin"
            className="mt-2 block text-center text-[11px] text-amber-200/60 transition hover:text-amber-200"
          >
            Tüm altın türleri →
          </Link>
        )}
      </div>

      {/* ── Borsa — Endeks ── */}
      <div className="rounded-2xl border border-emerald-200/14 bg-emerald-300/[0.04] p-4">
        <GroupLabel icon={BarChart2} label="Borsa" color="text-emerald-200" />
        <div className="mt-1 divide-y divide-white/6">
          {isLoading ? (
            <SkeletonRow />
          ) : endeks && (
            <Row
              label={endeks.name}
              value={endeks.value}
              rawValue={parseTrPrice(endeks.value)}
              badge={endeks.changePercent}
              isPositive={endeks.isPositive}
              highlight
            />
          )}
        </div>

        {/* Hisseler */}
        {(isLoading || hisseler.length > 0) && (
          <>
            <p className="mt-4 mb-1 text-[10px] font-semibold uppercase tracking-wider text-mist-3">
              Popüler hisseler
            </p>
            <div className="divide-y divide-white/6">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : hisseler.map((item) => (
                    <Row
                      key={item.symbol}
                      label={`${item.symbol} · ${item.name}`}
                      value={item.value}
                      rawValue={parseTrPrice(item.value)}
                      badge={item.changePercent}
                      isPositive={item.isPositive}
                      href={`/hisse/${item.symbol.toLowerCase()}`}
                    />
                  ))}
            </div>
          </>
        )}
        {!isLoading && (
          <Link
            href="/hisseler"
            className="mt-2 block text-center text-[11px] text-emerald-200/60 transition hover:text-emerald-200"
          >
            Tüm hisseler →
          </Link>
        )}
      </div>

      {/* ── Günün İpucu ── */}
      <div className="rounded-2xl border border-line bg-white/[0.025] p-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-mist-3">
          <Lightbulb className="h-3.5 w-3.5 text-yellow-300/70" />
          Günün ipucu
        </div>
        <p className="mt-2 text-xs leading-5 text-mist-3">
          {TIPS[tipIndex]}
        </p>
      </div>

      {/* Son güncelleme */}
      {data?.updatedAt && !isLoading && (
        <p className="text-center text-xs text-mist-3">
          {new Date(data.updatedAt).toLocaleTimeString("tr-TR", {
            hour: "2-digit", minute: "2-digit", second: "2-digit"
          })}
        </p>
      )}
    </aside>
  );
}
