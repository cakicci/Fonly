"use client";

import { useEffect, useState } from "react";
import { PieChart } from "lucide-react";
import type { SectorBreakdownResponse } from "@/app/api/portfolio/sectors/route";
import { PremiumGate } from "@/components/billing/PremiumGate";

const PALETTE = [
  { bar: "bg-emerald-300", dot: "bg-emerald-300" },
  { bar: "bg-cyan-300",    dot: "bg-cyan-300"    },
  { bar: "bg-amber-300",   dot: "bg-amber-300"   },
  { bar: "bg-fuchsia-300", dot: "bg-fuchsia-300" },
  { bar: "bg-rose-300",    dot: "bg-rose-300"    },
  { bar: "bg-sky-300",     dot: "bg-sky-300"     },
  { bar: "bg-lime-300",    dot: "bg-lime-300"    },
  { bar: "bg-violet-300",  dot: "bg-violet-300"  },
];

function tl(n: number): string {
  return n.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
}

/**
 * Portföy X-Ray — açık hisse pozisyonlarının sektör kırılımı. Sadece hisse
 * içeren portföylerde görünür; fon/döviz/altın-ağırlıklı portföylerde
 * anlamlı bir kırılım üretilemediği için gizlenir.
 */
export function SectorBreakdown() {
  return (
    <PremiumGate feature="Sektör Dağılımı (Portföy X-Ray)">
      <SectorBreakdownContent />
    </PremiumGate>
  );
}

function SectorBreakdownContent() {
  const [data, setData]       = useState<SectorBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/portfolio/sectors", { cache: "no-store" })
      .then(r => (r.ok ? r.json() : null))
      .then(json => { if (!cancelled) setData(json); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="glass-card animate-pulse rounded-2xl p-5">
        <div className="h-4 w-40 rounded bg-white/8" />
        <div className="mt-4 h-2.5 w-full rounded-full bg-white/8" />
      </div>
    );
  }

  if (!data || data.items.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <PieChart className="h-4 w-4 text-emerald-200" />
        <h3 className="text-sm font-semibold text-mist">Sektör Dağılımı</h3>
        <span className="text-xs text-mist-3">— hisse pozisyonların arasında</span>
      </div>

      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        {data.items.map((item, i) => (
          <div
            key={item.sector}
            className={PALETTE[i % PALETTE.length].bar}
            style={{ width: `${item.pct}%` }}
            title={`${item.sector} · %${item.pct.toFixed(1)}`}
          />
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {data.items.map((item, i) => (
          <li key={item.sector} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${PALETTE[i % PALETTE.length].dot}`} />
              <span className="truncate text-mist-2">{item.sector}</span>
            </span>
            <span className="shrink-0 tabular-nums text-mist-3">
              %{item.pct.toFixed(1)} · {tl(item.value)} ₺
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[11px] text-mist-3">
        Fon/döviz/altın pozisyonları bu kırılıma dahil değildir — sadece hisse ({tl(data.hisseValue)} ₺)
        üzerinden hesaplanır.
      </p>
    </div>
  );
}
