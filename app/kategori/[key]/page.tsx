import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Scale, Shield, Sprout, TimerReset, Waves } from "lucide-react";
import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { StockCard } from "@/components/StockCard";
import { stocks } from "@/data/stocks";
import { CATEGORIES, CATEGORY_FILTER } from "@/components/CategoryFilter";

type Params = { key: string };

// Geçerli key'ler
const VALID_KEYS = Object.keys(CATEGORY_FILTER) as (keyof typeof CATEGORY_FILTER)[];

const ICON_MAP: Record<string, LucideIcon> = {
  "dusuk-riskli":  Shield,
  "orta-riskli":   Scale,
  "yuksek-riskli": Waves,
  "uzun-vadeli":   Sprout,
  "kisa-vadeli":   TimerReset,
};

// Accent renkleri her kategori için
const ACCENT: Record<string, { border: string; bg: string; text: string; iconBg: string }> = {
  "dusuk-riskli":  { border: "border-emerald-200/16", bg: "bg-[linear-gradient(135deg,rgba(45,227,168,0.07),rgba(12,24,22,0.97))]", text: "text-emerald-200", iconBg: "bg-emerald-300/12" },
  "orta-riskli":   { border: "border-amber-200/16",   bg: "bg-[linear-gradient(135deg,rgba(251,191,36,0.07),rgba(12,24,22,0.97))]",  text: "text-amber-200",   iconBg: "bg-amber-300/12"   },
  "yuksek-riskli": { border: "border-rose-200/16",    bg: "bg-[linear-gradient(135deg,rgba(253,164,175,0.07),rgba(12,24,22,0.97))]", text: "text-rose-200",    iconBg: "bg-rose-300/12"    },
  "uzun-vadeli":   { border: "border-cyan-200/16",    bg: "bg-[linear-gradient(135deg,rgba(165,243,252,0.07),rgba(12,24,22,0.97))]", text: "text-cyan-200",    iconBg: "bg-cyan-300/12"    },
  "kisa-vadeli":   { border: "border-violet-200/16",  bg: "bg-[linear-gradient(135deg,rgba(196,181,253,0.07),rgba(12,24,22,0.97))]", text: "text-violet-200",  iconBg: "bg-violet-300/12"  },
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const cat = CATEGORIES.find(c => c.key === params.key);
  if (!cat) return { title: "Kategori — Fonly" };
  return { title: `${cat.title} Hisseler — Fonly` };
}

export default function KategoriPage({ params }: { params: Params }) {
  const key = params.key;
  if (!VALID_KEYS.includes(key as keyof typeof CATEGORY_FILTER)) notFound();

  const filter  = CATEGORY_FILTER[key as keyof typeof CATEGORY_FILTER];
  const cat     = CATEGORIES.find(c => c.key === key)!;
  const Icon    = ICON_MAP[key];
  const accent  = ACCENT[key];

  // Hisseleri filtrele
  const filtered = stocks.filter(s =>
    filter.field === "risk"
      ? s.risk    === filter.value
      : s.horizon === filter.value
  );

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-mist/45">
          <Link href="/" className="transition hover:text-white">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/#categories" className="transition hover:text-white">Kategoriler</Link>
          <span>/</span>
          <span className="text-white">{cat.title}</span>
        </nav>

        {/* Hero */}
        <div className={`rounded-[1.75rem] border p-6 sm:p-8 ${accent.border} ${accent.bg}`}>
          <div className="flex flex-wrap items-start gap-5">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${accent.iconBg} ${accent.text}`}>
              <Icon className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${accent.text}`}>Yatırım kategorisi</p>
              <h1 className="mt-1 text-3xl font-semibold text-white sm:text-4xl">{cat.title}</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-mist/65">{cat.description}</p>
              <p className={`mt-4 text-sm font-medium ${accent.text}`}>
                {filtered.length} hisse listeleniyor
              </p>
            </div>
          </div>
        </div>

        {/* Diğer kategoriler — hızlı geçiş */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.filter(c => c.key !== key).map(c => (
            <Link
              key={c.key}
              href={`/kategori/${c.key}`}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium
                         text-mist/55 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              {c.title}
            </Link>
          ))}
        </div>

        {/* Hisse listesi */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] py-16 text-center">
            <p className="text-sm text-mist/45">Bu kategoride henüz hisse eklenmemiş.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(stock => (
              <StockCard key={stock.symbol} stock={stock} />
            ))}
          </div>
        )}

        {/* Geri butonu */}
        <div className="pt-2">
          <Link
            href="/#categories"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04]
                       px-4 py-2.5 text-sm text-mist/55 transition hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Tüm kategoriler
          </Link>
        </div>

      </div>
    </main>
  );
}
