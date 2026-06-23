"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2, BellRing, BellOff } from "lucide-react";
import { assetDisplayName, assetHref } from "@/lib/portfolio/asset";

interface Alert {
  id: number;
  slug: string;
  condition: "above" | "below";
  threshold: number;
  active: boolean;
  triggeredAt: string | null;
}

function statusBadge(a: Alert) {
  if (a.triggeredAt) {
    return (
      <span className="rounded-full bg-emerald-300/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
        Tetiklendi
      </span>
    );
  }
  if (a.active) {
    return (
      <span className="rounded-full bg-cyan-300/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
        Aktif
      </span>
    );
  }
  return (
    <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-mist/50">
      Pasif
    </span>
  );
}

export function AlertsManager() {
  const [items, setItems] = useState<Alert[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/alerts", { cache: "no-store" });
      if (!res.ok) {
        setError("Alarmlar yüklenemedi.");
        return;
      }
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setError("Bağlantı hatası.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
      if (res.ok) await load();
    } finally {
      setDeletingId(null);
    }
  }

  if (items === null) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-mist/55">
        <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
      </div>
    );
  }

  if (error) {
    return <p className="rounded-xl bg-rose-300/10 p-3 text-sm text-rose-200">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-10 text-center ring-1 ring-white/8">
        <BellOff className="mx-auto h-8 w-8 text-mist/40" />
        <p className="mt-3 text-sm text-mist/70">Henüz alarmın yok.</p>
        <p className="text-xs text-mist/45">
          Bir varlık sayfasını açıp “Alarm kur” diyerek fiyat alarmı oluşturabilirsin.
        </p>
        <Link
          href="/doviz"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-medium text-mist/80 hover:bg-white/[0.08]"
        >
          Piyasalara göz at →
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card divide-y divide-white/5 overflow-hidden rounded-2xl ring-1 ring-white/8">
      {items.map((a) => (
        <div key={a.id} className="flex items-center gap-3 px-4 py-3">
          <BellRing className="h-4 w-4 shrink-0 text-cyan-200/70" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link href={assetHref(a.slug)} className="truncate text-sm font-medium text-white hover:text-emerald-200">
                {assetDisplayName(a.slug)}
              </Link>
              {statusBadge(a)}
            </div>
            <p className="mt-0.5 text-xs text-mist/55">
              Fiyat {a.condition === "above" ? "şu değerin üzerine çıkınca" : "şu değerin altına inince"}:{" "}
              <span className="tabular-nums text-mist/80">{a.threshold}</span>
            </p>
          </div>
          <button
            onClick={() => remove(a.id)}
            disabled={deletingId === a.id}
            aria-label="Alarmı sil"
            className="shrink-0 rounded-lg p-1.5 text-mist/40 transition hover:bg-rose-300/10 hover:text-rose-300 disabled:opacity-50"
          >
            {deletingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      ))}
    </div>
  );
}
