"use client";

import { useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { UpgradeModal } from "./UpgradeModal";

interface BlurredStockCardProps {
  /** Modal başlığı için kategori adı. */
  categoryTitle: string;
  /** Gerçek hisseden bağımsız bir sıra numarası — ghost'ları görsel olarak çeşitlendirir. */
  index: number;
}

// Sahte içerik — gerçek bir sembol/isim render etmiyoruz.
// Premium hisse leak'i olmasın diye HTML'e sadece bu sahte değerler gider.
const FAKE_SYMBOLS = ["XXXXXX", "XXXXX", "XXXXXXX", "XXXX"];
const FAKE_NAMES   = ["Gizli Hisse", "AI Seçimi", "Premium Hisse", "Kilitli Varlık"];

/**
 * Free kullanıcının kategori sayfasında "kilitli hisse" yerine gösterilen kart.
 * Tıklanınca UpgradeModal açılır.
 *
 * GÜVENLİK: Component'in render ettiği HTML'de hiçbir GERÇEK sembol veya isim yoktur.
 * Sayfa server component'inde premium hisseler hiç çekilmez (`isWellKnown: true`
 * filter'ı uygulanır), sadece kaç tane gizli olduğu bilinir → o kadar ghost render edilir.
 */
export function BlurredStockCard({ categoryTitle, index }: BlurredStockCardProps) {
  const [open, setOpen] = useState(false);

  const fakeSymbol = FAKE_SYMBOLS[index % FAKE_SYMBOLS.length];
  const fakeName   = FAKE_NAMES[index % FAKE_NAMES.length];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block h-full w-full text-left"
        aria-label="Premium ile kilitli hisseyi gör"
      >
        <article className="relative h-full overflow-hidden rounded-card border border-fuchsia-300/15 bg-gradient-to-br from-fuchsia-300/5 via-purple-300/3 to-emerald-300/5 p-5 transition group-hover:-translate-y-0.5 group-hover:border-fuchsia-300/35">

          {/* Blur'lu sahte içerik — okunmasın diye blur, kopyalanmasın diye select-none */}
          <div className="pointer-events-none select-none blur-md opacity-50">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-emerald-200">{fakeSymbol}</p>
                <h3 className="mt-1 text-xl font-semibold text-mist">{fakeName}</h3>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-fuchsia-200/25 bg-fuchsia-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-100">
                <Sparkles className="h-3 w-3" />
                AI seçimi
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center rounded-lg border border-line bg-white/8 px-2 py-0.5 text-[11px] font-medium text-white/40">
                XXXXXX
              </span>
              <span className="inline-flex items-center rounded-lg border border-line bg-white/8 px-2 py-0.5 text-[11px] font-medium text-white/40">
                XXXXXXX
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-line bg-white/4 p-3">
              <div className="h-3 w-3/4 rounded bg-white/10" />
              <div className="mt-2 h-3 w-5/6 rounded bg-white/8" />
              <div className="mt-2 h-3 w-2/3 rounded bg-white/8" />
            </div>

            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded bg-white/6" />
              <div className="h-3 w-4/5 rounded bg-white/6" />
            </div>
          </div>

          {/* Kilit overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-fuchsia-300/30 bg-ink/80 text-fuchsia-100 shadow-lg backdrop-blur-sm">
              <Lock className="h-6 w-6" />
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-300/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-100 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              Premium
            </div>
            <p className="text-sm font-medium text-mist">AI&apos;ın seçtiği hisseyi gör</p>
            <span className="rounded-xl bg-gradient-to-r from-fuchsia-300 to-emerald-300 px-3 py-1.5 text-xs font-semibold text-ink-fixed transition group-hover:from-fuchsia-200 group-hover:to-emerald-200">
              Premium&apos;a yükselt →
            </span>
          </div>

        </article>
      </button>

      {open && (
        <UpgradeModal
          feature={`${categoryTitle} · AI seçimi`}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
