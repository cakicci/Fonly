"use client";

import { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { fmt } from "@/lib/market-data";
import { fmtAsset, fmtPercent, kindFromSlug, type AssetKind } from "@/lib/format";
import { useLivePriceStore } from "@/lib/store/livePriceStore";
import { useFlashClass } from "@/lib/hooks/useFlashOnChange";
import { parseAssetSlug } from "@/lib/chart/timeframe";

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
   * Asset slug — verilirse livePriceStore aboneliği üzerinden canlı fiyat
   * gelir (ChartSection 60sn'de bir yazar). Tüm asset tipleri (hisse/döviz/
   * altın/fon) aynı store'u kullanır — chart ile header anlık eşleşir.
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
  const { type } = slug ? parseAssetSlug(slug) : { type: null };

  // Tüm asset tipleri için tek kaynak: livePriceStore.
  // ChartSection canlı fiyatı yazar (hisse/döviz/altın 60sn polling, fon ilk yük).
  // Header burada subscribe olur → chart son barı ile header tam senkron.
  // Döviz için displayPer (JPY=100 gibi) skalası uygulanır.
  const storeLive = useLivePriceStore((s) => (slug ? s.prices[slug] : undefined));
  const live = storeLive
    ? type === "doviz"
      ? { price: storeLive.price * displayPer, changePct: storeLive.changePct }
      : storeLive
    : null;

  const displayPrice     = live?.price     ?? price;
  const displayChangePct = live?.changePct ?? changePct;

  const flashCls = useFlashClass(displayPrice);

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
                {displayChangePct >= 0 ? "+" : "-"}{fmtPercent(Math.abs(displayChangePct))}%
              </span>
            )}
            {badges}
          </div>

          <h1 className="mt-2 text-2xl font-semibold leading-snug text-white">{name}</h1>

          <div className="mt-4 flex items-end gap-3">
            <p className="text-4xl font-semibold text-white">
              <span
                className={`inline-block rounded-md px-1.5 transition-colors duration-150 ${flashCls}`}
              >
                {fmtPrice(displayPrice, slug)}
              </span>
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

/**
 * Slug verilirse varlık tipine göre hassasiyet (FX=4, hisse/altın=2, fon=4).
 * Slug yoksa eski büyüklük-tabanlı auto davranış (landing card mock'ları için).
 */
function fmtPrice(v: number, slug?: string): string {
  const kind: AssetKind | null = slug ? kindFromSlug(slug) : null;
  if (kind) return fmtAsset(v, kind);
  if (v >= 1000) return fmt(v, 0);
  if (v >= 10)   return fmt(v, 2);
  return fmt(v, 4);
}
