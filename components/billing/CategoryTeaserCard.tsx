"use client";

import { useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { UpgradeModal } from "./UpgradeModal";

interface CategoryTeaserCardProps {
  /** Premium kullanıcının gördüğü ama free'nin göremediği hisse sayısı. */
  hiddenCount: number;
  /** Kategori başlığı — modal'a "X kategorisindeki ek hisseler" mesajı için. */
  categoryTitle: string;
}

/**
 * Kategori sayfasının altında yer alır. Free kullanıcı BIST 30 hisselerini
 * gördükten sonra "X hisse daha · Premium" CTA'sı bu kartla gösterilir.
 *
 * ÖNEMLİ: Gizli hisselerin sembolleri/isimleri prop olarak BURAYA SOKULMAZ.
 * Server component yalnızca `count` döner → premium-only semboller HTML'e sızmaz.
 */
export function CategoryTeaserCard({ hiddenCount, categoryTitle }: CategoryTeaserCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (hiddenCount <= 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="group block h-full w-full text-left"
      >
        <article className="relative h-full overflow-hidden rounded-card border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-300/8 via-purple-300/4 to-emerald-300/8 p-5 transition group-hover:-translate-y-0.5 group-hover:border-fuchsia-300/35">

          {/* Silüet arka plan — gerçek hisselerin yerini hayal ettirir */}
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute left-5 right-5 top-5 h-3 rounded-md bg-white/8" />
            <div className="absolute left-5 top-12 h-6 w-32 rounded-md bg-white/8" />
            <div className="absolute left-5 top-24 h-5 w-20 rounded-md bg-white/6" />
            <div className="absolute bottom-10 left-5 right-5 h-12 rounded-xl bg-white/4" />
          </div>

          {/* Kilit ikonu */}
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-300/15 text-fuchsia-100">
            <Lock className="h-5 w-5" />
          </div>

          {/* İçerik */}
          <div className="relative mt-5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-300/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-100">
              <Sparkles className="h-3 w-3" />
              Premium
            </div>
            <h3 className="mt-3 text-xl font-semibold text-white">
              +{hiddenCount} hisse daha
            </h3>
            <p className="mt-2 text-sm leading-6 text-mist-2">
              {categoryTitle} kategorisinde AI&apos;ın seçtiği {hiddenCount} ek hisse
              FonlyPro üyeleri için açık. Tümüne erişmek için yükselt.
            </p>
          </div>

          {/* CTA */}
          <div className="relative mt-6">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-300 to-emerald-300 px-3 py-2 text-xs font-semibold text-ink transition group-hover:from-fuchsia-200 group-hover:to-emerald-200">
              Premium&apos;a yükselt →
            </span>
          </div>

        </article>
      </button>

      {modalOpen && (
        <UpgradeModal
          feature={`${categoryTitle} · AI seçimi`}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
