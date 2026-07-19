"use client";

import { useState } from "react";
import { Lock, Sparkles, TrendingUp, BarChart3, LineChart } from "lucide-react";
import { UpgradeModal } from "./UpgradeModal";

interface TechnicalLockedProps {
  /** Modal başlığı — örn. fon kodu veya tam isim. */
  assetName?: string;
}

/**
 * Free kullanıcı `/fon/[kod]/teknik` sayfasına geldiğinde gösterilen paywall.
 * Tüm teknik analiz (hareketli ortalamalar, göstergeler, AI özet) premium'a kilitlidir.
 */
export function TechnicalLocked({ assetName }: TechnicalLockedProps) {
  const [open, setOpen] = useState(false);
  const feature = assetName
    ? `${assetName} · Teknik Analiz`
    : "Fon Teknik Analizi";

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-300/8 via-purple-300/4 to-emerald-300/8 p-8">
        <div className="pointer-events-none absolute inset-0 select-none opacity-30 blur-md">
          <div className="grid gap-4">
            <div className="h-24 rounded-2xl bg-white/8" />
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="h-48 rounded-2xl bg-white/6" />
              <div className="h-48 rounded-2xl bg-white/6" />
            </div>
          </div>
        </div>

        <div className="relative flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-fuchsia-300/30 bg-ink/80 text-fuchsia-100 shadow-lg backdrop-blur-sm">
            <Lock className="h-7 w-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-300/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-fuchsia-100 backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            Premium özellik
          </div>

          <div className="max-w-md">
            <h2 className="text-xl font-semibold text-mist">
              Teknik analiz Premium aboneliğe özel
            </h2>
            <p className="mt-2 text-sm text-mist-3">
              Hareketli ortalamalar, RSI, MACD, Bollinger ve AI destekli yorumların
              tamamı Premium üyelerle paylaşılır.
            </p>
          </div>

          <ul className="mt-1 grid w-full max-w-md gap-2 text-left text-sm text-mist-2">
            <li className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 shrink-0 text-emerald-300" />
              SMA & EMA (5/10/20/50/100/200) sinyalleri
            </li>
            <li className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 shrink-0 text-emerald-300" />
              RSI, MACD, Stoch, ADX, Bollinger ve daha fazlası
            </li>
            <li className="flex items-center gap-2">
              <LineChart className="h-4 w-4 shrink-0 text-emerald-300" />
              AI ile özetlenmiş yorum ve genel görünüm
            </li>
          </ul>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn btn-sm btn-premium mt-2 px-5"
          >
            <Sparkles className="h-4 w-4" />
            Premium&apos;a yükselt
          </button>
        </div>
      </div>

      {open && <UpgradeModal feature={feature} onClose={() => setOpen(false)} />}
    </>
  );
}
