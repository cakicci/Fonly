"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Check, Sparkles, X } from "lucide-react";

const PREMIUM_FEATURES = [
  "AI grafik ve teknik analiz",
  "Şirket profilini AI ile özetle",
  "Temettü ve büyüme değerlendirmesi",
  "AI haber özetleri",
  "Anlık soru-cevap (chat)",
];

interface UpgradeModalProps {
  /** Hangi özellik için açıldı — başlıkta gösterilir. */
  feature: string;
  onClose: () => void;
}

export function UpgradeModal({ feature, onClose }: UpgradeModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-ink shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Kapat"
          className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-mist-3 transition hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-br from-fuchsia-300/12 via-purple-300/6 to-emerald-300/10 px-6 pt-7 pb-5">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-fuchsia-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-fuchsia-200">
            <Sparkles className="h-3 w-3" />
            Premium özellik
          </div>
          <h2 className="text-xl font-semibold text-white">{feature}</h2>
          <p className="mt-1 text-sm text-mist-3">
            Yapay zekâ destekli analizler Premium aboneliğe özeldir.
          </p>
        </div>

        <div className="space-y-2 px-6 py-5">
          {PREMIUM_FEATURES.map(f => (
            <div key={f} className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-300" />
              <p className="text-sm text-mist-2">{f}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-white/8 px-6 py-4">
          <Link
            href="/premium"
            className="btn btn-lg btn-premium w-full"
          >
            Premium&apos;a yükselt
          </Link>
          <button
            onClick={onClose}
            className="mt-2 block w-full text-center text-xs text-mist-3 transition hover:text-mist-2"
          >
            Belki sonra
          </button>
        </div>
      </div>
    </div>
  );
}
