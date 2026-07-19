"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, Loader2, Lock, X } from "lucide-react";
import { UpgradeModal } from "@/components/billing/UpgradeModal";

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
  const isPremium    = session?.user?.isPremium === true;
  const authLoading  = status === "loading";
  const [triggerType, setTriggerType] = useState<"price" | "percent_change">("price");
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [threshold, setThreshold] = useState<string>(
    currentPrice > 0 ? currentPrice.toString() : ""
  );
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setTriggerType("price");
      setThreshold(currentPrice > 0 ? currentPrice.toFixed(2) : "");
      setCondition("above");
      setError(null);
      setSuccess(false);
    }
  }, [open, currentPrice]);

  function changeTriggerType(t: "price" | "percent_change") {
    if (t === "percent_change" && !isPremium && !authLoading) {
      setUpgradeOpen(true);
      return;
    }
    setTriggerType(t);
    setThreshold(t === "price" && currentPrice > 0 ? currentPrice.toFixed(2) : t === "percent_change" ? "5" : "");
  }

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
      setError(triggerType === "price" ? "Geçerli bir fiyat gir" : "Geçerli bir yüzde gir");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/alerts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ slug, triggerType, condition, threshold: thresholdNum }),
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
        className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-ink shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-300" />
            <h2 className="text-base font-semibold text-mist">Fiyat Alarmı</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-1.5 text-mist-3 transition hover:bg-white/5 hover:text-mist"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {status !== "authenticated" ? (
          <div className="p-6 text-center">
            <p className="text-sm text-mist-2">
              Alarm kurmak için <Link href="/login" className="font-semibold text-emerald-300 hover:underline">giriş yapmalısın</Link>.
            </p>
          </div>
        ) : success ? (
          <div className="p-6 text-center">
            <p className="text-sm font-semibold text-emerald-300">✓ Alarm kuruldu</p>
            <p className="mt-2 text-xs text-mist-3">
              Fiyat hedefine ulaştığında dashboard&apos;da bildirim göreceksin.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 p-5">
            <div>
              <p className="mb-1 text-xs text-mist-3">Varlık</p>
              <p className="rounded-lg border border-line bg-white/[0.025] px-3 py-2 text-sm text-mist">
                {assetName}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-mist-3">Tetikleyici</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => changeTriggerType("price")}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    triggerType === "price"
                      ? "border-emerald-300/35 bg-emerald-300/12 text-emerald-100"
                      : "border-line bg-white/[0.04] text-mist-3 hover:bg-white/[0.07]"
                  }`}
                >
                  Fiyat eşiği
                </button>
                <button
                  type="button"
                  onClick={() => changeTriggerType("percent_change")}
                  title={!isPremium && !authLoading ? "Premium özellik — yükseltmek için tıkla" : undefined}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    triggerType === "percent_change"
                      ? "border-emerald-300/35 bg-emerald-300/12 text-emerald-100"
                      : !isPremium && !authLoading
                        ? "border-line bg-white/[0.04] text-mist-3 hover:border-fuchsia-300/25 hover:bg-fuchsia-300/8 hover:text-fuchsia-200"
                        : "border-line bg-white/[0.04] text-mist-3 hover:bg-white/[0.07]"
                  }`}
                >
                  Günlük % değişim
                  {!isPremium && !authLoading && <Lock className="h-3 w-3 opacity-70" />}
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-mist-3">Koşul</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCondition("above")}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    condition === "above"
                      ? "border-emerald-300/35 bg-emerald-300/12 text-emerald-100"
                      : "border-line bg-white/[0.04] text-mist-3 hover:bg-white/[0.07]"
                  }`}
                >
                  {triggerType === "price" ? "↗ Bunun üstüne çıktığında" : "↗ Bu kadar yükseldiğinde"}
                </button>
                <button
                  type="button"
                  onClick={() => setCondition("below")}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    condition === "below"
                      ? "border-rose-300/35 bg-rose-300/12 text-rose-100"
                      : "border-line bg-white/[0.04] text-mist-3 hover:bg-white/[0.07]"
                  }`}
                >
                  {triggerType === "price" ? "↘ Bunun altına düştüğünde" : "↘ Bu kadar düştüğünde"}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-mist-3">
                {triggerType === "price" ? "Hedef fiyat" : "Yüzde eşiği"}
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-line bg-white/[0.04] px-3 py-2">
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder={triggerType === "price" ? "0.00" : "5"}
                  className="w-full bg-transparent text-sm text-mist outline-none placeholder:text-mist-3"
                />
                <span className="text-xs text-mist-3">{triggerType === "price" ? unit : "%"}</span>
              </div>
              {triggerType === "price" && currentPrice > 0 && (
                <p className="mt-1.5 text-[11px] text-mist-3">
                  Şu anki fiyat: <span className="text-mist-2">{currentPrice.toFixed(2)} {unit}</span>
                </p>
              )}
              {triggerType === "percent_change" && (
                <p className="mt-1.5 text-[11px] text-mist-3">
                  Örn. %5 ve &quot;yükseldiğinde&quot; seçersen, fiyat bugün içinde %5 veya daha fazla artınca haber veririz.
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
                className="flex-1 rounded-xl border border-line bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-mist-2 transition hover:bg-white/[0.07] hover:text-mist"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={busy}
                className="btn btn-sm btn-primary flex-1 shadow-glow"
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Alarm Kur
              </button>
            </div>
          </form>
        )}
      </div>
      {upgradeOpen && (
        <UpgradeModal
          feature="Yüzde değişim alarmı"
          onClose={() => setUpgradeOpen(false)}
        />
      )}
    </div>
  );
}
