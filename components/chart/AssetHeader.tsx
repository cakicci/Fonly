"use client";

import { ReactNode, useEffect, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { fmt } from "@/lib/market-data";
import { useLivePriceStore } from "@/lib/store/livePriceStore";
import { parseAssetSlug } from "@/lib/chart/timeframe";
import type { MarketResponse } from "@/app/api/market/route";

const HEADER_POLL_MS = 60_000;

export interface AssetHeaderProps {
  /** Tag — küçük etikette gösterilir (örn. "THYAO", "TEFAS", "USD"). */
  tag:       string;
  /** Pazar tarif kelimesi — küçük lacivert metin (örn. "BIST", "TEFAS", "Döviz", "Altın"). */
  market:    string;
  /** Tam ad — H1 başlık. */
  name:      string;
  /** Server-render başlangıç fiyatı (ham sayı). Polling sonrası livePriceStore'dan güncellenir. */
  price:     number;
  /** Fiyat birimi simgesi (örn. "₺", "$"). */
  unit:      string;
  /** Server-render başlangıç değişim yüzdesi — null ise gösterilmez. */
  changePct: number | null;
  /** Sol tarafta opsiyonel rozet/kart slot — risk veya kategori chip'leri için. */
  badges?:   ReactNode;
  /** Fiyat altında ek küçük açıklama (örn. "Pay başına fiyat · günlük değişim"). */
  subtitle?: string;
  /** Sağ üstte client-side aksiyon butonları (watchlist/alarm) slot'u. */
  actions?:  ReactNode;
  /**
   * Asset slug — verilirse canlı fiyat polling devreye girer.
   *  - doviz/altin: kendi içinde /api/market (truncgil) 60sn polling
   *  - hisse:       livePriceStore subscription (ChartSection yazıyor)
   *  - fon:         polling yok, initial değerler
   */
  slug?:     string;
  /**
   * Görüntüleme için 1 raw birim kaç display birime karşılık geliyor (ör. JPY=100).
   * Polling'de raw rawValue'yu bu sayıyla çarpıyoruz.
   */
  displayPer?: number;
}

export function AssetHeader({
  tag, market, name, price, unit,
  changePct, badges, subtitle, actions, slug, displayPer = 1,
}: AssetHeaderProps) {
  const { type, code } = slug ? parseAssetSlug(slug) : { type: null, code: "" };

  // Hisse: ChartSection livePriceStore'a yazıyor — orayı okuyalım
  const storeLive = useLivePriceStore((s) => (slug ? s.prices[slug] : undefined));

  // Sadece altın için kendi polling — chart Yahoo GC=F (USD/oz) gösteriyor,
  // header TL gram göstermeli, farklı birimler. Döviz/hisse için chart'la
  // tutarlılık adına Yahoo (livePriceStore üzerinden) kullanıyoruz.
  const [truncgilLive, setTruncgilLive] =
    useState<{ price: number; changePct: number | null } | null>(null);

  useEffect(() => {
    if (type !== "altin") return;

    const poll = async () => {
      try {
        const res = await fetch("/api/market", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as MarketResponse;
        const item = json.tumAltin.find(g => g.type === code.toLowerCase());
        if (item && item.rawValue > 0) {
          setTruncgilLive({
            price:     item.rawValue,
            changePct: item.isPositive !== undefined
              ? parseFloat(item.changePercent.replace(/[%+]/g, "").replace(",", "."))
                * (item.isPositive ? 1 : -1)
              : null,
          });
        }
      } catch { /* sessiz */ }
    };
    poll();
    const id = setInterval(poll, HEADER_POLL_MS);
    return () => clearInterval(id);
  }, [type, code]);

  // Önceliklendirme:
  //  - hisse → storeLive (ChartSection Yahoo close yazıyor)
  //  - doviz → storeLive * displayPer (Yahoo ham/raw, JPY gibi displayPer'lı için skala)
  //  - altin → truncgilLive (chart USD/oz, header TL gram → farklı birim)
  //  - fon ya da slugsız → initial server props
  const live =
    type === "hisse" ? storeLive ?? null
    : type === "doviz" && storeLive
        ? { price: storeLive.price * displayPer, changePct: storeLive.changePct }
    : type === "altin" ? truncgilLive
    : null;

  const displayPrice     = live?.price     ?? price;
  const displayChangePct = live?.changePct ?? changePct;

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(45,227,168,0.06),rgba(11,16,38,0.95))] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-emerald-300/12 px-2 py-0.5 text-xs font-bold text-emerald-300">
              {tag}
            </span>
            <p className="text-xs text-mist/45">{market}</p>
            {displayChangePct != null && (
              <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                displayChangePct >= 0
                  ? "bg-emerald-300/10 text-emerald-300"
                  : "bg-rose-300/10 text-rose-300"
              }`}>
                {displayChangePct >= 0
                  ? <TrendingUp className="h-3 w-3" />
                  : <TrendingDown className="h-3 w-3" />}
                {displayChangePct >= 0 ? "+" : "-"}{fmt(Math.abs(displayChangePct), 2)}%
              </span>
            )}
            {badges}
          </div>

          <h1 className="mt-2 text-2xl font-semibold leading-snug text-white">{name}</h1>

          <div className="mt-4 flex items-end gap-3">
            <p className="text-4xl font-semibold text-white">
              {fmtPrice(displayPrice)}
              <span className="ml-2 text-xl font-normal text-mist/45">{unit}</span>
            </p>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-mist/40">{subtitle}</p>
          )}
        </div>

        {/* Aksiyon butonları slot — client component */}
        {actions}
      </div>
    </div>
  );
}

function fmtPrice(v: number): string {
  if (v >= 1000) return fmt(v, 0);
  if (v >= 10)   return fmt(v, 2);
  return fmt(v, 4);
}
