"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

interface ManageSubscriptionProps {
  planName: string;
  /** ISO tarih — dönem bitişi. */
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
}

/**
 * Premium kullanıcı için abonelik durumu + "dönem sonunda iptal" butonu.
 * Premium sayfasında, plan kartları yerine gösterilir.
 */
export function ManageSubscription({ planName, periodEnd, cancelAtPeriodEnd }: ManageSubscriptionProps) {
  const [canceling, setCanceling] = useState(false);
  const [canceled, setCanceled] = useState(cancelAtPeriodEnd);
  const [error, setError] = useState<string | null>(null);

  const endLabel = new Date(periodEnd).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function cancel() {
    setCanceling(true);
    setError(null);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "İptal edilemedi.");
        return;
      }
      setCanceled(true);
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div className="glass-card mx-auto mt-12 max-w-md rounded-3xl p-6 ring-1 ring-emerald-300/25">
      <div className="flex items-center gap-2 text-emerald-200">
        <CheckCircle2 className="h-5 w-5" />
        <span className="text-sm font-semibold">FonlyPro aktif — {planName} plan</span>
      </div>

      <p className="mt-3 text-sm text-mist/65">
        {canceled
          ? `Aboneliğin ${endLabel} tarihinde sona erecek. O güne kadar tüm premium özellikler açık.`
          : `Sonraki yenileme: ${endLabel}. İstediğin zaman iptal edebilirsin.`}
      </p>

      {!canceled && (
        <button
          type="button"
          onClick={cancel}
          disabled={canceling}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-mist/75 transition hover:bg-white/[0.08] disabled:opacity-60"
        >
          {canceling && <Loader2 className="h-4 w-4 animate-spin" />}
          Aboneliği dönem sonunda iptal et
        </button>
      )}

      {error && <p className="mt-2 text-center text-xs text-rose-300">{error}</p>}
    </div>
  );
}
