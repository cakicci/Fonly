"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, Loader2, X } from "lucide-react";

export interface PriceAlertModalProps {
  open:           boolean;
  onClose:        () => void;
  slug:           string;
  /** Şu anki fiyat — varsayılan eşik için kullanılır. */
  currentPrice?:  number;
  /** Para birimi sembolü ("₺", "$", "TL"). */
  unit?:          string;
  /** İnsan-okur varlık adı (modal başlığı için). */
  assetName:      string;
}

export function PriceAlertModal({
  open, onClose, slug, currentPrice = 0, unit = "", assetName,
}: PriceAlertModalProps) {
  const { data: session, status } = useSession();
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [threshold, setThreshold] = useState<string>(
    currentPrice > 0 ? currentPrice.toString() : ""
  );
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setThreshold(currentPrice > 0 ? currentPrice.toFixed(2) : "");
      setCondition("above");
      setError(null);
      setSuccess(false);
    }
  }, [open, currentPrice]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const thresholdNum = parseFloat(threshold.replace(",", "."));
    if (!Number.isFinite(thresholdNum) || thresholdNum <= 0) {
      setError("Geçerli bir fiyat gir");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/alerts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ slug, condition, threshold: thresholdNum }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Alarm kurulamadı");
      } else {
        setSuccess(true);
        setTimeout(onClose, 1500);
      }
    } catch {
      setError("Ağ hatası");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label="Fiyat alarmı"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-ink shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-300" />
            <h2 className="text-base font-semibold text-white">Fiyat Alarmı</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-1.5 text-mist/55 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {status !== "authenticated" ? (
          <div className="p-6 text-center">
            <p className="text-sm text-mist/65">
              Alarm kurmak için <Link href="/login" className="font-semibold text-emerald-300 hover:underline">giriş yapmalısın</Link>.
            </p>
          </div>
        ) : success ? (
          <div className="p-6 text-center">
            <p className="text-sm font-semibold text-emerald-300">✓ Alarm kuruldu</p>
            <p className="mt-2 text-xs text-mist/50">
              Fiyat hedefine ulaştığında dashboard&apos;da bildirim göreceksin.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 p-5">
            <div>
              <p className="mb-1 text-xs text-mist/45">Varlık</p>
              <p className="rounded-lg border border-white/8 bg-white/[0.025] px-3 py-2 text-sm text-white">
                {assetName}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-mist/60">Koşul</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCondition("above")}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    condition === "above"
                      ? "border-emerald-300/35 bg-emerald-300/12 text-emerald-100"
                      : "border-white/10 bg-white/[0.04] text-mist/60 hover:bg-white/[0.07]"
                  }`}
                >
                  ↗ Bunun üstüne çıktığında
                </button>
                <button
                  type="button"
                  onClick={() => setCondition("below")}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    condition === "below"
                      ? "border-rose-300/35 bg-rose-300/12 text-rose-100"
                      : "border-white/10 bg-white/[0.04] text-mist/60 hover:bg-white/[0.07]"
                  }`}
                >
                  ↘ Bunun altına düştüğünde
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-mist/60">
                Hedef fiyat
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-mist/30"
                />
                {unit && <span className="text-xs text-mist/45">{unit}</span>}
              </div>
              {currentPrice > 0 && (
                <p className="mt-1.5 text-[11px] text-mist/40">
                  Şu anki fiyat: <span className="text-mist/65">{currentPrice.toFixed(2)} {unit}</span>
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-lg border border-rose-300/20 bg-rose-300/[0.06] px-3 py-2 text-xs text-rose-200">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-mist/65 transition hover:bg-white/[0.07] hover:text-white"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-ink shadow-glow transition hover:bg-emerald-200 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Alarm Kur
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
