"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { PlanId } from "@/lib/billing/plans";

interface CheckoutButtonProps {
  planId: PlanId;
  label: string;
  highlight?: boolean;
}

/**
 * Premium plan CTA'sı. /api/checkout'a POST atar, dönen redirectUrl'e gider.
 * 401 → /login'e (callbackUrl=/premium) yönlendirir.
 */
export function CheckoutButton({ planId, label, highlight }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      if (res.status === 401) {
        window.location.href = `/login?callbackUrl=${encodeURIComponent("/premium")}`;
        return;
      }

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.redirectUrl) {
        setError(data?.message ?? "Ödeme başlatılamadı.");
        setLoading(false);
        return;
      }

      window.location.href = data.redirectUrl;
    } catch {
      setError("Bağlantı hatası.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-center text-sm font-semibold transition disabled:opacity-60 ${
          highlight
            ? "bg-gradient-to-r from-fuchsia-300/80 to-emerald-300/80 text-ink hover:from-fuchsia-200 hover:to-emerald-200"
            : "border border-white/12 bg-white/[0.06] text-white hover:bg-white/[0.1]"
        }`}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Yönlendiriliyor…" : label}
      </button>
      {error && <p className="mt-2 text-center text-[11px] text-rose-300">{error}</p>}
    </>
  );
}
