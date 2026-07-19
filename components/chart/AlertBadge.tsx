"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, X } from "lucide-react";
import { assetDisplayName, assetHref } from "@/lib/portfolio/asset";

interface TriggeredAlert {
  id:          number;
  slug:        string;
  triggerType: "price" | "percent_change" | string;
  condition:   "above" | "below";
  threshold:   number;
  triggeredAt: string;
  acknowledged: boolean;
}

const POLL_MS = 60_000; // dakikada bir kontrol

const fmtTL = (v: number) => v.toLocaleString("tr-TR", { maximumFractionDigits: 4 });

/**
 * Sayfada sabit (sağ üst) bir küçük zil rozeti. Tetiklenip henüz onaylanmamış
 * alarm sayısını gösterir. Tıklandığında modal açar, alarm detaylarını listeler
 * ve "Tamam" ile onaylanır (acknowledged=true).
 */
export function AlertBadge() {
  const { status } = useSession();
  const [items, setItems] = useState<TriggeredAlert[]>([]);
  const [open, setOpen]   = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    const fetchAlerts = async () => {
      try {
        const res = await fetch("/api/alerts", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const triggered: TriggeredAlert[] = (json.items ?? []).filter(
          (a: TriggeredAlert) => a.triggeredAt && !a.acknowledged
        );
        setItems(triggered);
      } catch { /* sessiz */ }
    };
    fetchAlerts();
    const id = setInterval(fetchAlerts, POLL_MS);
    return () => clearInterval(id);
  }, [status]);

  if (status !== "authenticated" || items.length === 0) return null;

  const acknowledge = async (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
    try {
      await fetch(`/api/alerts?id=${id}`, { method: "PATCH" });
    } catch { /* sessiz, list'ten zaten kaldırıldı */ }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`${items.length} tetiklenmiş alarm`}
        className="fixed right-5 top-5 z-40 flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-100 shadow-lg backdrop-blur-md transition hover:bg-amber-300/25"
      >
        <Bell className="h-4 w-4 animate-pulse" />
        {items.length} Alarm
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-amber-300/30 bg-ink shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-amber-100">
                <Bell className="h-4 w-4" />
                Tetiklenen Alarmlar
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Kapat"
                className="rounded-lg p-1.5 text-mist-3 transition hover:bg-white/5 hover:text-mist"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <ul className="max-h-96 space-y-2 overflow-y-auto p-3">
              {items.map(a => {
                const name = assetDisplayName(a.slug);
                const href = assetHref(a.slug);
                const conditionLabel = a.triggerType === "percent_change"
                  ? (a.condition === "above"
                      ? `Bugün belirlediğin %${fmtTL(a.threshold)} değişimi geçti.`
                      : `Bugün belirlediğin %${fmtTL(a.threshold)} düşüşü geçti.`)
                  : (a.condition === "above"
                      ? `Bugün belirlediğin ${fmtTL(a.threshold)} TL seviyesini geçti.`
                      : `Bugün belirlediğin ${fmtTL(a.threshold)} TL seviyesinin altına indi.`);

                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.04] px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={href}
                        onClick={() => setOpen(false)}
                        className="block text-sm font-semibold text-mist hover:text-amber-100"
                      >
                        {name}
                      </Link>
                      <p className="text-[11px] text-mist-3">{conditionLabel}</p>
                    </div>
                    <button
                      onClick={() => acknowledge(a.id)}
                      className="rounded-lg border border-line bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-mist-2 transition hover:bg-white/[0.08] hover:text-mist"
                    >
                      Tamam
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
