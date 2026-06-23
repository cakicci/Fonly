"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2, ShieldCheck } from "lucide-react";

/**
 * Dev ödeme onay sayfası — gerçek PSP'nin hosted ödeme ekranını taklit eder.
 * Sadece `PAYMENT_PROVIDER=dev` akışında kullanılır. "Ödemeyi Onayla" deyince
 * imzalı token'ı /api/webhooks/dev'e POST'lar (PSP'nin webhook'unu simüle eder),
 * abonelik aktive olunca `redirect` adresine gider.
 */
export default function DevCheckoutPage() {
  const [token, setToken] = useState<string | null>(null);
  const [redirect, setRedirect] = useState("/dashboard?upgraded=1");
  const [status, setStatus] = useState<"idle" | "processing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
    const r = params.get("redirect");
    if (r) setRedirect(r);
  }, []);

  async function confirm() {
    if (!token) return;
    setStatus("processing");
    setError(null);
    try {
      const res = await fetch("/api/webhooks/dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "Onay başarısız.");
        setStatus("error");
        return;
      }
      window.location.href = redirect;
    } catch {
      setError("Bağlantı hatası.");
      setStatus("error");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card w-full max-w-md rounded-3xl p-7 ring-1 ring-white/10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-200">
          <Sparkles className="h-3.5 w-3.5" />
          Dev ödeme simülasyonu
        </div>
        <h1 className="text-xl font-semibold text-white">Ödemeyi onayla</h1>
        <p className="mt-2 text-sm leading-relaxed text-mist/60">
          Bu, gerçek bir ödeme değildir. Geliştirme ortamında abonelik akışını uçtan uca
          test etmek için kullanılır. Onayladığında FonlyPro aboneliğin aktive edilir.
        </p>

        {!token && (
          <p className="mt-4 rounded-xl bg-rose-300/10 p-3 text-xs text-rose-200">
            Geçersiz oturum — token bulunamadı. Premium sayfasından tekrar başla.
          </p>
        )}

        <button
          type="button"
          onClick={confirm}
          disabled={!token || status === "processing"}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-300/80 to-emerald-300/80 px-4 py-3 text-sm font-semibold text-ink transition hover:from-fuchsia-200 hover:to-emerald-200 disabled:opacity-60"
        >
          {status === "processing" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          {status === "processing" ? "Onaylanıyor…" : "Ödemeyi Onayla"}
        </button>

        {error && <p className="mt-3 text-center text-xs text-rose-300">{error}</p>}

        <a
          href="/premium"
          className="mt-3 block text-center text-xs text-mist/45 hover:text-mist/70"
        >
          Vazgeç
        </a>
      </div>
    </main>
  );
}
