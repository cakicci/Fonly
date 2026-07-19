// Server component — "use client" gerektirmez, Link yeterli
import Link from "next/link";
import type { CSSProperties } from "react";
import { Scale, Shield, Sprout, TimerReset, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type CategoryMeta = {
  title: string;
  description: string;
  icon: LucideIcon;
  key: string;
};

export const CATEGORIES: CategoryMeta[] = [
  {
    title: "Düşük Riskli",
    description:
      "Daha sakin ilerleyen seçeneklerdir. Amaç, büyük iniş çıkışlardan uzak durup birikimi korumaya yakın kalmaktır.",
    icon: Shield,
    key: "dusuk-riskli",
  },
  {
    title: "Orta Riskli",
    description:
      "Hem güvenli kalmak hem de büyüme şansı aramak isteyenler için dengeli bir yol sunar.",
    icon: Scale,
    key: "orta-riskli",
  },
  {
    title: "Yüksek Riskli",
    description:
      "Fiyatı daha hızlı değişebilir. Daha yüksek kazanç ihtimali vardır, fakat kısa vadede düşüşler de yaşanabilir.",
    icon: Waves,
    key: "yuksek-riskli",
  },
  {
    title: "Uzun Vadeli",
    description:
      "Bugünden yarına değil, yıllar içinde büyümeyi hedefler. Sabır bu yaklaşımın en önemli parçasıdır.",
    icon: Sprout,
    key: "uzun-vadeli",
  },
  {
    title: "Kısa Vadeli",
    description:
      "Paranı yakın zamanda kullanma ihtimalin varsa daha esnek ve kolay anlaşılır seçeneklere odaklanır.",
    icon: TimerReset,
    key: "kisa-vadeli",
  },
];

// URL param ↔ filtre eşlemesi — kategori sayfası da kullanır
export const CATEGORY_FILTER = {
  "dusuk-riskli":  { field: "risk",    value: "low"    },
  "orta-riskli":   { field: "risk",    value: "medium" },
  "yuksek-riskli": { field: "risk",    value: "high"   },
  "uzun-vadeli":   { field: "horizon", value: "long"   },
  "kisa-vadeli":   { field: "horizon", value: "short"  },
} as const;

export function CategoryFilter() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {CATEGORIES.map((cat, i) => {
        const Icon = cat.icon;
        return (
          <Link
            key={cat.key}
            href={`/kategori/${cat.key}`}
            className="glass-card glass-card-interactive animate-enter group rounded-card p-5"
            style={{ "--enter-index": i } as CSSProperties}
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/12 text-emerald-200 transition group-hover:bg-emerald-300/20">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-mist">{cat.title}</h3>
            <p className="mt-3 text-sm leading-6 text-mist-2">{cat.description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-emerald-300/60 transition group-hover:text-emerald-300">
              Hisseleri gör →
            </span>
          </Link>
        );
      })}
    </div>
  );
}
